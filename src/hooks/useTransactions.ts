// src/hooks/useTransactions.ts

import { usePrivy } from '@privy-io/expo';
import { useQuery } from '@tanstack/react-query';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

export interface Transaction {
  id: string;
  type: 'dca_buy' | 'fee' | 'subscription' | 'withdrawal';
  amount_usd: number;
  status: string;
  created_at: string;
}

async function fetchTransactions(
  privyUserId: string,
  type?: string
): Promise<Transaction[]> {
  const query = new URLSearchParams({ privyUserId });
  if (type) query.set('type', type);

  const res = await fetch(`${API_URL}/api/transactions?${query}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.transactions ?? [];
}

export function useTransactions(type?: string) {
  const { user } = usePrivy();

  return useQuery({
    queryKey: ['transactions', user?.id, type],
    queryFn: () => fetchTransactions(user!.id, type),
    enabled: !!user?.id,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}