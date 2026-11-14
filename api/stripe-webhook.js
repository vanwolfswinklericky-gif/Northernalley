// api/stripe-webhook.js

import Stripe from 'stripe';
import { pool } from './_lib/db.js';

let _stripe = null;
function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  _stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  return _stripe;
}

export const config = { api: { bodyParser: false } };

const FREE_PLAN_MAX_DEPOSIT = 1000;

function log(level, message, context = {}) {
  const entry = { ts: new Date().toISOString(), level, service: 'stripe-webhook', message, ...context };
  if (level === 'error') console.error(JSON.stringify(entry));
  else if (level === 'warn') console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    log('error', 'STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  try {
    const rawBody = await readRawBody(req);
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    log('error', 'Signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  log('info', 'Webhook received', { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        log('info', 'Unhandled event type', { type: event.type });
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    log('error', 'Webhook handler error', { type: event.type, error: err.message, stack: err.stack });
    return res.status(500).json({ error: err.message });
  }
}

async function handleCheckoutComplete(session) {
  const privyUserId = session.metadata?.privyUserId;
  const plan = session.metadata?.plan || 'free';
  const basketId = session.metadata?.basketId;
  const frequency = session.metadata?.frequency || 'monthly';
  const addOnsString = session.metadata?.addOns || '';

  let dcaAmount = Number(session.metadata?.dcaAmount || 50);

  if (!privyUserId) {
    log('warn', 'Checkout session missing privyUserId in metadata', { sessionId: session.id });
    return;
  }

  // Ensure user exists
  const userResult = await pool.query(`SELECT id FROM users WHERE privy_user_id = $1`, [privyUserId]);
  let userId;
  if (userResult.rows.length === 0) {
    const inserted = await pool.query(
      `INSERT INTO users (privy_user_id, email) VALUES ($1, $2) RETURNING id`,
      [privyUserId, session.customer_details?.email ?? null]
    );
    userId = inserted.rows[0].id;
  } else {
    userId = userResult.rows[0].id;
  }

  // Enforce Free plan cap
  if (plan === 'free' && dcaAmount > FREE_PLAN_MAX_DEPOSIT) {
    log('warn', 'Free user exceeded deposit limit — capping', {
      userId,
      requested: dcaAmount,
      cappedTo: FREE_PLAN_MAX_DEPOSIT,
    });
    dcaAmount = FREE_PLAN_MAX_DEPOSIT;
  }

  if (plan === 'free') {
    const lifetimeEnd = new Date();
    lifetimeEnd.setFullYear(lifetimeEnd.getFullYear() + 100);

    await pool.query(
      `INSERT INTO subscriptions (user_id, plan, status, current_period_end, add_ons)
       VALUES ($1, 'free', 'active', $2, '')
       ON CONFLICT (user_id)
       DO UPDATE SET plan = 'free', status = 'active', current_period_end = EXCLUDED.current_period_end`,
      [userId, lifetimeEnd]
    );

    log('info', 'Free user activated', { userId, plan: 'free' });
  } else {
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    await pool.query(
      `INSERT INTO subscriptions (
        user_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_end, add_ons
      )
       VALUES ($1, $2, 'active', $3, $4, $5, $6)
       ON CONFLICT (stripe_subscription_id)
       DO UPDATE SET
         plan = EXCLUDED.plan,
         status = 'active',
         current_period_end = EXCLUDED.current_period_end,
         add_ons = EXCLUDED.add_ons,
         updated_at = NOW()`,
      [userId, plan, session.customer, session.subscription, periodEnd, addOnsString]
    );

    log('info', 'Paid subscription activated', { userId, plan, addOns: addOnsString });
  }

  await pool.query(
    `INSERT INTO dca_plans (user_id, basket_id, amount_usd, frequency, status, next_execution_date)
     VALUES ($1, $2, $3, $4, 'active', NOW())
     ON CONFLICT DO NOTHING`,
    [userId, basketId, dcaAmount, frequency]
  );

  log('info', 'DCA plan created', { userId, basketId, dcaAmount, frequency });
}

async function handleSubscriptionUpdated(subscription) {
  const periodEnd = new Date(subscription.current_period_end * 1000);
  const addOnsString = subscription.metadata?.addOns || '';

  const result = await pool.query(
    `UPDATE subscriptions
     SET status = $1, current_period_end = $2, add_ons = $3, updated_at = NOW()
     WHERE stripe_subscription_id = $4
     RETURNING user_id, plan`,
    [subscription.status, periodEnd, addOnsString, subscription.id]
  );

  if (result.rows.length === 0) {
    log('warn', 'Subscription not found in DB', { stripeSubscriptionId: subscription.id });
    return;
  }
  log('info', 'Subscription updated', { userId: result.rows[0].user_id, status: subscription.status });
}

async function handleSubscriptionDeleted(subscription) {
  const result = await pool.query(
    `UPDATE subscriptions SET status = 'canceled', updated_at = NOW()
     WHERE stripe_subscription_id = $1 RETURNING user_id`,
    [subscription.id]
  );
  log('info', 'Subscription canceled', { stripeSubscriptionId: subscription.id, userId: result.rows[0]?.user_id });
}

async function handlePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  await pool.query(
    `UPDATE subscriptions SET status = 'past_due', updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );
  log('info', 'Subscription marked past_due', { stripeSubscriptionId: subscriptionId });
}