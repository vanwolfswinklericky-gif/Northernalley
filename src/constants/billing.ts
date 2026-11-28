import type { AddOns, SubscriptionPlan } from '@/store/planStore';
import type { Plan, SubscriptionAddOns } from '@/store/subscriptionStore';

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
      selected: addOns.prioritySupport && plan !== 'pro' && plan !== 'premium',
    },
  ];

  return chargedAddOns.filter((addOn) => addOn.selected);
};

export const getChargedAddOnsPrice = (plan: SubscriptionPlan | null, addOns: AddOns) =>
  getChargedAddOns(plan, addOns).reduce((total, addOn) => total + addOn.price, 0);

export type SupportTier = 'standard' | 'pro' | 'premium' | 'addon';

export interface SupportAccess {
  tier: SupportTier;
  isPriority: boolean;
  responseHours: 4 | 12 | 48;
  label: string;
  emailTag: string;
}

export const getSupportAccess = (
  plan: Plan | null,
  status: 'active' | 'past_due' | 'canceled' | null,
  addOns: SubscriptionAddOns,
): SupportAccess => {
  if (status !== 'active') {
    return {
      tier: 'standard',
      isPriority: false,
      responseHours: 48,
      label: 'Contact Support',
      emailTag: '',
    };
  }

  if (plan === 'premium') {
    return {
      tier: 'premium',
      isPriority: true,
      responseHours: 4,
      label: 'Premium Priority Support',
      emailTag: '[PREMIUM PRIORITY]',
    };
  }

  if (plan === 'pro') {
    return {
      tier: 'pro',
      isPriority: true,
      responseHours: 12,
      label: 'Pro Priority Support',
      emailTag: '[PRO PRIORITY]',
    };
  }

  if (addOns.prioritySupport) {
    return {
      tier: 'addon',
      isPriority: true,
      responseHours: 12,
      label: 'Priority Support',
      emailTag: '[PRIORITY]',
    };
  }

  return {
    tier: 'standard',
    isPriority: false,
    responseHours: 48,
    label: 'Contact Support',
    emailTag: '',
  };
};
