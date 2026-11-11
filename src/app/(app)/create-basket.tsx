import { CreateBasketScreen } from '@/screens/auth/CreateBasketScreen';
import { useRouter } from 'expo-router';

export default function AppCreateBasketRoute() {
  const router = useRouter();

  return (
    <CreateBasketScreen
      onBack={() => router.back()}
      onCreated={() => router.replace('/(app)/baskets')}
    />
  );
}
