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
        router.push('/(app)/amount');
      }}
      onCreateCustom={() => router.push('/(app)/create-basket')}
    />
  );
}
