// src/hooks/useBaskets.ts

import { usePrivy } from '@privy-io/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Basket } from '@/types/basket';
import { parseBasketCoins } from '@/utils/parseBasketCoins';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

export type { Basket } from '@/types/basket';

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
      const data: Omit<BasketsResponse, 'baskets'> & {
        baskets: (Omit<Basket, 'coins'> & { coins: unknown })[];
      } = await res.json();
      if (!Array.isArray(data.baskets)) {
        throw new Error('Invalid baskets response: expected a baskets array.');
      }

      return {
        ...data,
        baskets: data.baskets.map((basket) => ({
          ...basket,
          coins: parseBasketCoins(basket.coins),
        })),
      };
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