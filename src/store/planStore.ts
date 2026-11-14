// src/store/planStore.ts

import type { Basket } from '@/types/basket';
import { create } from 'zustand';

export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'premium';
export type Frequency = 'monthly' | 'weekly' | 'daily'; // <-- Added 'daily'

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
  frequency: Frequency; // <-- Updated type
  email: string | null;
  plan: SubscriptionPlan | null;
  currency: string;
  addOns: AddOns;

  setBasket: (basket: Basket) => void;
  setAmount: (amount: number) => void;
  setFrequency: (frequency: Frequency) => void; // <-- Updated type
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
  frequency: 'monthly' as Frequency,
  email: null,
  plan: null,
  currency: 'EUR',
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