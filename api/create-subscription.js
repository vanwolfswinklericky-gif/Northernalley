// api/create-subscription.js

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLAN_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  premium: process.env.STRIPE_PRICE_PREMIUM,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { privyUserId, email, plan = 'starter', basketId = 'top20', amount = 100 } = req.body || {};

  const priceId = PLAN_PRICES[plan];

  if (!priceId) {
    return res.status(400).json({ error: `Invalid plan: ${plan}` });
  }
  if (!privyUserId) {
    return res.status(400).json({ error: 'privyUserId is required' });
  }

  try {
    const customer = await stripe.customers.create({
      email,
      metadata: { privyUserId },
    });

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      // DEEP LINK: Redirects back to the app with the custom scheme
      success_url: 'northernalley://(auth)/success',
      cancel_url: 'northernalley://(auth)/failure',
      metadata: {
        privyUserId,
        plan,
        basketId,
        dcaAmount: String(amount),
      },
      subscription_data: {
        metadata: { privyUserId, plan },
      },
    });

    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe subscription error:', error);
    res.status(500).json({ error: error.message });
  }
}