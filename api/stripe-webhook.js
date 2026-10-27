// api/stripe-webhook.js

import Stripe from 'stripe';
import pool from './lib/db.js';

let _stripe = null;
function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  _stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  return _stripe;
}

// Disable Vercel's automatic body parsing so we can verify the signature
export const config = {
  api: {
    bodyParser: false,
  },
};

function log(level, message, context = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    service: 'stripe-webhook',
    message,
    ...context,
  };
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
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        log('info', 'Unhandled event type', { type: event.type });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    log('error', 'Webhook handler error', {
      type: event.type,
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Handle checkout.session.completed — user just paid for a new subscription.
 */
async function handleCheckoutComplete(session) {
  const privyUserId = session.metadata?.privyUserId;
  const plan = session.metadata?.plan || 'starter';

  if (!privyUserId) {
    log('warn', 'Checkout session missing privyUserId in metadata', {
      sessionId: session.id,
    });
    return;
  }

  log('info', 'Processing new subscription', {
    privyUserId,
    plan,
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription,
  });

  // Ensure the user exists in Neon
  const userResult = await pool.query(
    `SELECT id FROM users WHERE privy_user_id = $1`,
    [privyUserId]
  );

  let userId;
  if (userResult.rows.length === 0) {
    // Create the user record if it doesn't exist
    const inserted = await pool.query(
      `INSERT INTO users (privy_user_id, email)
       VALUES ($1, $2)
       RETURNING id`,
      [privyUserId, session.customer_details?.email ?? null]
    );
    userId = inserted.rows[0].id;
    log('info', 'Created new user record', { userId, privyUserId });
  } else {
    userId = userResult.rows[0].id;
  }

  // Calculate the current period end (30 days from now)
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  // Upsert the subscription
  await pool.query(
    `INSERT INTO subscriptions (
      user_id, plan, status,
      stripe_customer_id, stripe_subscription_id,
      current_period_end
    )
     VALUES ($1, $2, 'active', $3, $4, $5)
     ON CONFLICT (stripe_subscription_id)
     DO UPDATE SET
       plan = EXCLUDED.plan,
       status = 'active',
       current_period_end = EXCLUDED.current_period_end,
       updated_at = NOW()`,
    [
      userId,
      plan,
      session.customer,
      session.subscription,
      periodEnd,
    ]
  );

  log('info', 'Subscription activated', {
    userId,
    plan,
    periodEnd: periodEnd.toISOString(),
  });
}

/**
 * Handle customer.subscription.updated — status change, renewal, plan switch.
 */
async function handleSubscriptionUpdated(subscription) {
  const periodEnd = new Date(subscription.current_period_end * 1000);

  const result = await pool.query(
    `UPDATE subscriptions
     SET status = $1,
         current_period_end = $2,
         updated_at = NOW()
     WHERE stripe_subscription_id = $3
     RETURNING user_id, plan`,
    [subscription.status, periodEnd, subscription.id]
  );

  if (result.rows.length === 0) {
    log('warn', 'Subscription not found in DB', {
      stripeSubscriptionId: subscription.id,
    });
    return;
  }

  log('info', 'Subscription updated', {
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    periodEnd: periodEnd.toISOString(),
    userId: result.rows[0].user_id,
  });
}

/**
 * Handle customer.subscription.deleted — user canceled.
 */
async function handleSubscriptionDeleted(subscription) {
  const result = await pool.query(
    `UPDATE subscriptions
     SET status = 'canceled', updated_at = NOW()
     WHERE stripe_subscription_id = $1
     RETURNING user_id`,
    [subscription.id]
  );

  log('info', 'Subscription canceled', {
    stripeSubscriptionId: subscription.id,
    userId: result.rows[0]?.user_id,
  });
}

/**
 * Handle invoice.payment_failed — card declined on renewal.
 */
async function handlePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) return;

  await pool.query(
    `UPDATE subscriptions
     SET status = 'past_due', updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );

  log('info', 'Subscription marked past_due', {
    stripeSubscriptionId: subscriptionId,
  });
}