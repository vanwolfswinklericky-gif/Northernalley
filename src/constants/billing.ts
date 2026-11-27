import type { AddOns, SubscriptionPlan } from '@/store/planStore';

export const ADD_ON_PRICES = {
  extraBasket: 4.99,
  weeklyDca: 7.99,
  prioritySupport: 9.99,
} as const;

export const getChargedAddOns = (plan: SubscriptionPlan | null, addOns: AddOns) => {
  if (!plan || plan === 'free') return [];

  const chargedAddOns = [
    { key: 'extraBasket', name: 'Extra Basket', price: ADD_ON_PRICES.extraBasket, selected: addOns.extraBasket },
    {
      key: 'weeklyDca',
      name: 'Weekly DCA',
      price: ADD_ON_PRICES.weeklyDca,
      selected: addOns.weeklyDca && plan !== 'pro' && plan !== 'premium',
    },
    {
      key: 'prioritySupport',
      name: 'Priority Support',
      price: ADD_ON_PRICES.prioritySupport,
      selected: addOns.prioritySupport,
    },
  ];

  return chargedAddOns.filter((addOn) => addOn.selected);
};

export const getChargedAddOnsPrice = (plan: SubscriptionPlan | null, addOns: AddOns) =>
  getChargedAddOns(plan, addOns).reduce((total, addOn) => total + addOn.price, 0);
