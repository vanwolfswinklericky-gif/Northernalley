// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  setHasActivePlan: any;
  /** Whether the app is locked (requires local passcode to unlock) */
  isLocked: boolean;
  /** Whether the wallet has been created (used for routing decisions) */
  hasWallet: boolean;
  setLocked: (locked: boolean) => void;
  setHasWallet: (has: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLocked: false,
  hasWallet: false,
  setLocked: (isLocked) => set({ isLocked }),
  setHasWallet: (hasWallet) => set({ hasWallet }),
}));