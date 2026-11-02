// api/create-subscription.js

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLAN_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  premium: process.env.STRIPE_PRICE_PREMIUM,
};

const ADDON_PRICES = {
  extraBasket: process.env.STRIPE_PRICE_EXTRA_BASKET,
  weeklyDca: process.env.STRIPE_PRICE_WEEKLY_DCA,
  prioritySupport: process.env.STRIPE_PRICE_PRIORITY_SUPPORT,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { 
    privyUserId, 
    email, 
    plan = 'starter', 
    basketId = 'top20', 
    amount = 100,
    addOns = {} 
  } = req.body || {};

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

    // 1. Start with the base plan
    const line_items = [{ price: priceId, quantity: 1 }];
    
    // 2. Track which add-ons are being purchased for the metadata
    const selectedAddOns = [];

    // 3. Add any selected add-ons
    if (addOns.extraBasket && ADDON_PRICES.extraBasket) {
      line_items.push({ price: ADDON_PRICES.extraBasket, quantity: 1 });
      selectedAddOns.push('extraBasket');
    }
    if (addOns.weeklyDca && ADDON_PRICES.weeklyDca) {
      line_items.push({ price: ADDON_PRICES.weeklyDca, quantity: 1 });
      selectedAddOns.push('weeklyDca');
    }
    if (addOns.prioritySupport && ADDON_PRICES.prioritySupport) {
      line_items.push({ price: ADDON_PRICES.prioritySupport, quantity: 1 });
      selectedAddOns.push('prioritySupport');
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: line_items,
      // DEEP LINK: Redirects back to the app with the custom scheme
      success_url: 'northernalley://(auth)/success',
      cancel_url: 'northernalley://(auth)/failure',
      metadata: {
        privyUserId,
        plan,
        basketId,
        dcaAmount: String(amount),
        addOns: selectedAddOns.join(','), // Save a comma-separated list like "weeklyDca,prioritySupport"
      },
      subscription_data: {
        metadata: { 
          privyUserId, 
          plan,
          addOns: selectedAddOns.join(','),
        },
      },
    });

    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe subscription error:', error);
    res.status(500).json({ error: error.message });
  }
}