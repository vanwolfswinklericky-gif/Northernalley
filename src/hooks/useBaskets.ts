// src/hooks/useBaskets.ts

import { usePrivy } from '@privy-io/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

export interface Basket {
  id: string;
  slug?: string;
  name: string;
  description: string;
  type: 'prebuilt' | 'custom';
  coins: { symbol: string; weight: number }[];
}

interface BasketsResponse {
  baskets: Basket[];
  plan: 'starter' | 'pro' | 'premium';
  limits: { prebuilt: number; custom: number; total: number };
  usage: { total: number; custom: number };
}

export function useBaskets() {
  const { user } = usePrivy();

  return useQuery({
    queryKey: ['baskets', user?.id],
    queryFn: async (): Promise<BasketsResponse> => {
      const res = await fetch(`${API_URL}/api/baskets?privyUserId=${user!.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}

export function useCreateBasket() {
  const { user } = usePrivy();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; coins: { symbol: string; weight: number }[] }) => {
      const res = await fetch(`${API_URL}/api/baskets?privyUserId=${user!.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create basket');
      return data.basket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baskets', user?.id] });
    },
  });
}