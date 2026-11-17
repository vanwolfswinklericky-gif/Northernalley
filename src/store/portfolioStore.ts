// src/store/portfolioStore.ts

import { create } from 'zustand';

export interface LiveHolding {
  symbol: string;
  amount: number;
  usdPrice: number | null;
  usdValue: number | null;
  change24h: number | null;
}

interface PortfolioState {
  holdings: LiveHolding[];
  unsupportedAssets: string[];
  totalValue: number;
  totalInvested: number;
  portfolioHistory: number[];
  isLoading: boolean;
  lastFetched: number | null;
  error: string | null;

  setPortfolio: (data: {
    holdings: LiveHolding[];
    unsupportedAssets: string[];
    totalValue: number;
    totalInvested: number;
    portfolioHistory: number[];
  }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  holdings: [],
  unsupportedAssets: [],
  totalValue: 0,
  totalInvested: 0,
  portfolioHistory: [],
  isLoading: false,
  lastFetched: null,
  error: null,

  setPortfolio: (data) =>
    set({
      holdings: data.holdings,
      unsupportedAssets: data.unsupportedAssets,
      totalValue: data.totalValue,
      totalInvested: data.totalInvested,
      portfolioHistory: data.portfolioHistory,
      lastFetched: Date.now(),
      error: null,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clear: () =>
    set({
      holdings: [],
      unsupportedAssets: [],
      totalValue: 0,
      totalInvested: 0,
      portfolioHistory: [],
      isLoading: false,
      lastFetched: null,
      error: null,
    }),
}));