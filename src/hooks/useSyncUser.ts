// src/hooks/useSyncUser.ts
import { useEmbeddedEthereumWallet, usePrivy } from '@privy-io/expo';
import { useEffect } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

export function useSyncUser() {
  const { user } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();

  useEffect(() => {
    if (!user?.id) return;

    const walletAddress = wallets[0]?.address;

    fetch(`${API_URL}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        privyUserId: user.id,
        // FIX: Cast user to 'any' to bypass the missing type definition
        email: (user as any).email?.address,
        walletAddress,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`HTTP ${res.status}: ${errorData.error || 'Unknown error'}`);
        }
        return res.json();
      })
      .then((data) => console.log('✅ User synced to Neon:', data.user))
      .catch((err) => {
        console.error('❌ Failed to sync user:', err.message);
      });
  }, [user?.id, wallets]);
}