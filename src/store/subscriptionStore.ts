// src/store/subscriptionStore.ts

import { create } from 'zustand';

export type Plan = 'free' | 'starter' | 'pro' | 'premium';

export interface SubscriptionAddOns {
  extraBasket: boolean;
  weeklyDca: boolean;
  customBasket: boolean;
  prioritySupport: boolean;
}

const emptyAddOns: SubscriptionAddOns = {
  extraBasket: false,
  weeklyDca: false,
  customBasket: false,
  prioritySupport: false,
};

interface SubscriptionState {
  plan: Plan | null;
  status: 'active' | 'past_due' | 'canceled' | null;
  currentPeriodEnd: string | null;
  addOns: SubscriptionAddOns;
  isLoading: boolean;
  setSubscription: (data: {
    plan: Plan;
    status: SubscriptionState['status'];
    currentPeriodEnd: string | null;
    addOns?: SubscriptionAddOns;
  }) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  plan: null,
  status: null,
  currentPeriodEnd: null,
  addOns: emptyAddOns,
  isLoading: false,
  setSubscription: (data) =>
    set({
      plan: data.plan,
      status: data.status,
      currentPeriodEnd: data.currentPeriodEnd,
      addOns: data.addOns ?? emptyAddOns,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () =>
    set({
      plan: null,
      status: null,
      currentPeriodEnd: null,
      addOns: emptyAddOns,
      isLoading: false,
    }),
}));