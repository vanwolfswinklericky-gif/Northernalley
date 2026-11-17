// src/hooks/useBalances.ts

import { usePortfolioStore } from '@/store/portfolioStore';
import { usePrivy } from '@privy-io/expo';
import { useEffect } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';
const REFETCH_INTERVAL = 60_000;

export function useBalances() {
  const { user } = usePrivy();
  const { 
    setPortfolio, 
    setLoading, 
    setError, 
    holdings, 
    unsupportedAssets,
    totalValue, 
    totalInvested, // NEW
    portfolioHistory, // NEW
    isLoading, 
    error,
  } = usePortfolioStore();

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const fetchBalances = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/balances?privyUserId=${user.id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!cancelled) {
          setPortfolio({
            holdings: data.holdings ?? [],
            unsupportedAssets: data.unsupportedAssets ?? [],
            totalValue: data.totalValue ?? 0,
            totalInvested: data.totalInvested ?? 0, // NEW
            portfolioHistory: data.portfolioHistory ?? [], // NEW
          });
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBalances();

    const interval = setInterval(fetchBalances, REFETCH_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.id, setPortfolio, setLoading, setError]);

  return { 
    holdings, 
    unsupportedAssets,
    totalValue, 
    totalInvested, // NEW
    portfolioHistory, // NEW
    isLoading,
    error,
  };
}