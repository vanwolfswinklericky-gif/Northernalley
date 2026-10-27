// src/store/subscriptionStore.ts

import { create } from 'zustand';

export type Plan = 'starter' | 'pro' | 'premium';

interface SubscriptionState {
  plan: Plan | null;
  status: 'active' | 'past_due' | 'canceled' | null;
  currentPeriodEnd: string | null;
  isLoading: boolean;
  setSubscription: (data: {
    plan: Plan;
    status: SubscriptionState['status'];
    currentPeriodEnd: string | null;
  }) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  plan: null,
  status: null,
  currentPeriodEnd: null,
  isLoading: false,
  setSubscription: (data) =>
    set({
      plan: data.plan,
      status: data.status,
      currentPeriodEnd: data.currentPeriodEnd,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () =>
    set({ plan: null, status: null, currentPeriodEnd: null, isLoading: false }),
}));