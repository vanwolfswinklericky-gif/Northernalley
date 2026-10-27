// src/app/(auth)/payment.tsx

import { PaymentScreen } from '@/screens/auth/PaymentScreen';
import { usePlanStore } from '@/store/planStore';
import { usePrivy } from '@privy-io/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

export default function PaymentRoute() {
  const router = useRouter();
  const { user } = usePrivy();
  const { plan, basketId, amount } = usePlanStore();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!user?.id || !plan) {
      Alert.alert('Missing Info', 'Please ensure you have selected a plan and basket.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyUserId: user.id,
          email: user.email?.address,
          plan,
          basketId,
          amount,
        }),
      });
      
      const data = await res.json();
      
      if (data.url) {
        // Opens Stripe Checkout in the phone's browser
        await Linking.openURL(data.url);
      } else {
        Alert.alert('Error', data.error || 'Failed to create checkout session');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaymentScreen
      onBack={() => router.back()}
      onSuccess={handleConfirm}
      loading={loading}
    />
  );
}