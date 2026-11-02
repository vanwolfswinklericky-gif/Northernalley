// src/store/recoveryStore.ts
import { create } from 'zustand';

interface RecoveryState {
  onRecovered: (() => void) | null;
  setOnRecovered: (cb: (() => void) | null) => void;
  clear: () => void;
}

export const useRecoveryStore = create<RecoveryState>((set) => ({
  onRecovered: null,
  setOnRecovered: (cb) => set({ onRecovered: cb }),
  clear: () => set({ onRecovered: null }),
}));