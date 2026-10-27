// src/store/portfolioStore.ts

import { create } from 'zustand';

export interface LiveHolding {
  symbol: string;
  amount: number;
  usdPrice: number;
  usdValue: number;
  change24h: number;
}

interface PortfolioState {
  holdings: LiveHolding[];
  totalValue: number;
  isLoading: boolean;
  lastFetched: number | null;
  error: string | null;

  setPortfolio: (data: { holdings: LiveHolding[]; totalValue: number }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  holdings: [],
  totalValue: 0,
  isLoading: false,
  lastFetched: null,
  error: null,

  setPortfolio: (data) =>
    set({
      holdings: data.holdings,
      totalValue: data.totalValue,
      lastFetched: Date.now(),
      error: null,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clear: () =>
    set({ holdings: [], totalValue: 0, isLoading: false, lastFetched: null, error: null }),
}));