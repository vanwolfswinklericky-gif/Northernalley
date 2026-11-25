import { BasketsScreen } from '@/screens/auth/BasketsScreen';
import { usePlanStore } from '@/store/planStore';
import { useRouter } from 'expo-router';

export default function AppBasketsRoute() {
  const router = useRouter();
  const setBasket = usePlanStore((state) => state.setBasket);

  return (
    <BasketsScreen
      onBack={() => router.back()}
      onContinue={(basket) => {
        setBasket(basket);
        // FIX: Route to the auth group where the Amount screen lives
        router.push('/(auth)/amount'); 
      }}
      onCreateCustom={() => router.push('/(auth)/create-basket')}
    />
  );
}