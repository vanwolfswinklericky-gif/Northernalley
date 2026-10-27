// src/store/planStore.ts

import { create } from 'zustand';

export type SubscriptionPlan = 'starter' | 'pro' | 'premium';

interface PlanState {
  basketId: string | null;
  amount: number | null;
  frequency: 'monthly' | 'weekly';
  email: string | null;
  plan: SubscriptionPlan | null;

  setBasket: (basketId: string) => void;
  setAmount: (amount: number) => void;
  setFrequency: (frequency: 'monthly' | 'weekly') => void;
  setEmail: (email: string) => void;
  setPlan: (plan: SubscriptionPlan) => void;
  reset: () => void;
}

const initialState = {
  basketId: null,
  amount: null,
  frequency: 'monthly' as const,
  email: null,
  plan: null,
};

export const usePlanStore = create<PlanState>((set) => ({
  ...initialState,

  setBasket: (basketId) => set({ basketId }),
  setAmount: (amount) => set({ amount }),
  setFrequency: (frequency) => set({ frequency }),
  setEmail: (email) => set({ email }),
  setPlan: (plan) => set({ plan }),
  reset: () => set(initialState),
}));