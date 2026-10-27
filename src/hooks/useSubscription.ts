// src/hooks/useSubscription.ts

import { Plan, useSubscriptionStore } from '@/store/subscriptionStore';
import { usePrivy } from '@privy-io/expo';
import { useEffect } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

export function useSubscription() {
  const { user } = usePrivy();
  const { plan, status, setSubscription, setLoading, isLoading } = useSubscriptionStore();

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/me?privyUserId=${user.id}`);
        if (!res.ok) return;
        const data = await res.json();

        if (!cancelled && data.subscription) {
          setSubscription({
            plan: data.subscription.plan as Plan,
            status: data.subscription.status,
            currentPeriodEnd: data.subscription.currentPeriodEnd,
          });
        }
      } catch (err) {
        console.warn('Subscription fetch failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, setSubscription, setLoading]);

  return { plan, status, isLoading };
}