// src/app/(auth)/baskets.tsx

import { BasketsScreen } from '@/screens/auth/BasketsScreen';
import { usePlanStore } from '@/store/planStore';
import { useRouter } from 'expo-router';

export default function BasketsRoute() {
  const router = useRouter();
  
  // Make sure your store has this exact setter!
  const setBasket = usePlanStore((s) => s.setBasket);
  const setSelectedBasket = usePlanStore((s) => s.setSelectedBasket); // Or however you store the full object

  return (
    <BasketsScreen
      onBack={() => router.back()}
      onContinue={(basket) => {
        // 1. Save just the UUID string for the backend
        setBasket(basket.id); 
        
        // 2. Save the full object for the Review Screen (so it doesn't have to guess/fallback)
        if (setSelectedBasket) {
          setSelectedBasket(basket);
        }

        // 3. Move to the next step
        router.push('/(auth)/amount');
      }}
      onCreateCustom={() => router.push('/(auth)/create-basket')}
    />
  );
}