// src/app/(auth)/baskets.tsx

import { BasketsScreen } from '@/screens/auth/BasketsScreen';
import { usePlanStore } from '@/store/planStore';
import { useRouter } from 'expo-router';

export default function BasketsRoute() {
  const router = useRouter();
  const setBasket = usePlanStore((s) => s.setBasket);

  return (
    <BasketsScreen
      onBack={() => router.back()}
      onContinue={(basketId) => {
        setBasket(basketId);
        router.push('/(auth)/amount');
      }}
      onCreateCustom={() => router.push('/(auth)/create-basket')}
    />
  );
}