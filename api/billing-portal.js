import Stripe from 'stripe';
import pool from './_lib/db.js';

let _stripe = null;
function getStripe() {
  if (_stripe) return _stripe;
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { privyUserId } = req.body || {};
  if (!privyUserId) return res.status(400).json({ error: 'Missing privyUserId' });

  try {
    // 1. Find the user's Stripe customer ID in Neon
    const result = await pool.query(
      'SELECT s.stripe_customer_id FROM subscriptions s JOIN users u ON u.id = s.user_id WHERE u.privy_user_id = \ AND s.status = \'active\' LIMIT 1',
      [privyUserId]
    );

    if (result.rows.length === 0 || !result.rows[0].stripe_customer_id) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const customerId = result.rows[0].stripe_customer_id;
    const stripe = getStripe();

    // 2. Create the secure Stripe portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'northernalley://(app)/(tabs)/settings',
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Billing portal error:', err);
    return res.status(500).json({ error: err.message });
  }
}
