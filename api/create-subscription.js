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

const DEPOSIT_FEE_RATE = 0.01; // 1% Deposit Fee

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (process.env.NODE_ENV === 'production' && /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || '')) {
    return res.status(503).json({ error: 'Live payments are not configured.' });
  }

  const { 
    privyUserId, 
    email, 
    plan = 'starter', 
    basketId = 'top20', 
    amount = 50, 
    frequency = 'monthly', 
    addOns = {} 
  } = req.body || {};

  const priceId = PLAN_PRICES[plan];

  if (!priceId) return res.status(400).json({ error: `Invalid plan: ${plan}` });
  if (!privyUserId) return res.status(400).json({ error: 'privyUserId is required' });
  if (amount <= 0) return res.status(400).json({ error: 'Investment amount must be greater than 0' });

  try {
    const customer = await stripe.customers.create({
      email,
      metadata: { privyUserId },
    });

    // 1. RECURRING ITEMS (SaaS Plan + Add-ons)
    const recurring_items = [{ price: priceId, quantity: 1 }];
    const selectedAddOns = [];
    
    if (addOns.extraBasket && ADDON_PRICES.extraBasket) {
      recurring_items.push({ price: ADDON_PRICES.extraBasket, quantity: 1 });
      selectedAddOns.push('extraBasket');
    }
    if (addOns.weeklyDca && ADDON_PRICES.weeklyDca) {
      recurring_items.push({ price: ADDON_PRICES.weeklyDca, quantity: 1 });
      selectedAddOns.push('weeklyDca');
    }
    if (addOns.prioritySupport && ADDON_PRICES.prioritySupport) {
      recurring_items.push({ price: ADDON_PRICES.prioritySupport, quantity: 1 });
      selectedAddOns.push('prioritySupport');
    }

    // 2. ONE-TIME ITEMS (Initial ETF Investment + 1% Deposit Fee)
    const one_time_items = [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: `Initial ETF Investment` },
          unit_amount: Math.round(amount * 100), 
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'eur',
          product_data: { name: `Deposit Fee (1%)` },
          unit_amount: Math.round(amount * DEPOSIT_FEE_RATE * 100), 
        },
        quantity: 1,
      }
    ];

    // 3. Create the session in 'subscription' mode
    // Stripe allows mixing recurring (line_items) and one-time (add_invoice_items) in subscription mode.
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: recurring_items, // The monthly SaaS fees
      subscription_data: {
        add_invoice_items: one_time_items, // Charged ONCE on the first invoice
        metadata: { 
          privyUserId, 
          plan,
          frequency,
          addOns: selectedAddOns.join(','),
        },
      },
      payment_method_collection: 'always',
      success_url: 'northernalley://(app)/success',
      cancel_url: 'northernalley://(app)/failure',
      metadata: {
        privyUserId,
        plan,
        basketId,
        dcaAmount: String(amount),
        frequency,
        addOns: selectedAddOns.join(','),
      },
    });

    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe subscription error:', error);
    res.status(500).json({ error: error.message });
  }
}