// src/store/planStore.ts

import { create } from 'zustand';

export type SubscriptionPlan = 'starter' | 'pro' | 'premium';

export interface AddOns {
  extraBasket: boolean;
  weeklyDca: boolean;
  customBasket: boolean;
  prioritySupport: boolean;
}

interface PlanState {
  basketId: string | null;
  amount: number | null;
  frequency: 'monthly' | 'weekly';
  email: string | null;
  plan: SubscriptionPlan | null;
  currency: string;
  addOns: AddOns;

  setBasket: (basketId: string) => void;
  setAmount: (amount: number) => void;
  setFrequency: (frequency: 'monthly' | 'weekly') => void;
  setEmail: (email: string) => void;
  setPlan: (plan: SubscriptionPlan) => void;
  setCurrency: (currency: string) => void;
  toggleAddOn: (key: keyof AddOns) => void;
  reset: () => void;
}

const initialState = {
  basketId: null,
  amount: null,
  frequency: 'monthly' as const,
  email: null,
  plan: null,
  currency: 'USD',
  addOns: {
    extraBasket: false,
    weeklyDca: false,
    customBasket: false,
    prioritySupport: false,
  },
};

export const usePlanStore = create<PlanState>((set) => ({
  ...initialState,

  setBasket: (basketId) => set({ basketId }),
  setAmount: (amount) => set({ amount }),
  setFrequency: (frequency) => set({ frequency }),
  setEmail: (email) => set({ email }),
  setPlan: (plan) => set({ plan }),
  setCurrency: (currency) => set({ currency }),
  
  toggleAddOn: (key) => 
    set((state) => ({ 
      addOns: { ...state.addOns, [key]: !state.addOns[key] } 
    })),
    
  reset: () => set(initialState),
}));