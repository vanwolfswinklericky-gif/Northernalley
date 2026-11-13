// src/store/planStore.ts

import { create } from 'zustand';
import type { Basket } from '@/types/basket';

export type SubscriptionPlan = 'starter' | 'pro' | 'premium';

export interface AddOns {
  extraBasket: boolean;
  weeklyDca: boolean;
  customBasket: boolean;
  prioritySupport: boolean;
}

const initialAddOns: AddOns = {
  extraBasket: false,
  weeklyDca: false,
  customBasket: false,
  prioritySupport: false,
};

interface PlanState {
  basketId: string | null;
  selectedBasket: Basket | null;
  amount: number | null;
  frequency: 'monthly' | 'weekly';
  email: string | null;
  plan: SubscriptionPlan | null;
  currency: string; // Supports all ISO 4217 currency codes
  addOns: AddOns;

  setBasket: (basket: Basket) => void;
  setAmount: (amount: number) => void;
  setFrequency: (frequency: 'monthly' | 'weekly') => void;
  setEmail: (email: string) => void;
  setPlan: (plan: SubscriptionPlan) => void;
  setCurrency: (currency: string) => void;
  toggleAddOn: (addOn: keyof AddOns) => void;
  reset: () => void;
}

const initialState = {
  basketId: null,
  selectedBasket: null,
  amount: null,
  frequency: 'monthly' as const,
  email: null,
  plan: null,
  currency: 'USD', // Default currency
  addOns: initialAddOns,
};

export const usePlanStore = create<PlanState>((set) => ({
  ...initialState,

  setBasket: (selectedBasket) => set({ basketId: selectedBasket.id, selectedBasket }),
  setAmount: (amount) => set({ amount }),
  setFrequency: (frequency) => set({ frequency }),
  setEmail: (email) => set({ email }),
  setPlan: (plan) => set({ plan }),
  setCurrency: (currency) => set({ currency }),
  toggleAddOn: (addOn) =>
    set((state) => ({
      addOns: { ...state.addOns, [addOn]: !state.addOns[addOn] },
    })),
  reset: () => set({ ...initialState, addOns: { ...initialAddOns } }),
}));