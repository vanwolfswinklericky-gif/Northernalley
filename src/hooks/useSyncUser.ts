// src/hooks/useSyncUser.ts
import { useAuthStore } from '@/store/authStore';
import { useEmbeddedEthereumWallet, usePrivy } from '@privy-io/expo';
import { useEffect } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

export function useSyncUser() {
  const { user } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();
  const setHasActivePlan = useAuthStore((s) => s.setHasActivePlan);

  useEffect(() => {
    if (!user?.id) return;

    const walletAddress = wallets[0]?.address;

    fetch(`${API_URL}/api/auth/sync-user`, { // <-- Updated URL
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        privyUserId: user.id,
        email: (user as any).email?.address,
        walletAddress,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(async (data) => {
        console.log('✅ User synced:', data.user);
        
        const planRes = await fetch(`${API_URL}/api/me?privyUserId=${user.id}`);
        const planData = await planRes.json();
        
        if (planData.subscription && planData.subscription.status === 'active') {
          setHasActivePlan(true);
        } else {
          setHasActivePlan(false);
        }
      })
      .catch((err) => console.error('❌ Sync error:', err.message));
  }, [user?.id, wallets, setHasActivePlan]);
}