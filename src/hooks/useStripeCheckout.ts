import { usePrivy } from '@privy-io/expo';
import { useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { usePlanStore } from '@/store/planStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

export function useStripeCheckout() {
  const { user } = usePrivy();
  const { plan, basketId, amount, addOns } = usePlanStore();
  const email = user?.linked_accounts.find((account) => account.type === 'email')?.address;
  const [loading, setLoading] = useState(false);
  const checkoutInProgress = useRef(false);

  const checkout = async () => {
    if (checkoutInProgress.current) return;
    if (!user?.id || !plan || !basketId || !amount) {
      Alert.alert('Missing Info', 'Please ensure you have selected a plan and basket.');
      return;
    }

    checkoutInProgress.current = true;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyUserId: user.id,
          email,
          plan,
          basketId,
          amount,
          addOns,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        Alert.alert('Error', data.error || 'Failed to create checkout session');
        return;
      }

      await Linking.openURL(data.url);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Network error',
      );
    } finally {
      checkoutInProgress.current = false;
      setLoading(false);
    }
  };

  return { checkout, loading };
}
