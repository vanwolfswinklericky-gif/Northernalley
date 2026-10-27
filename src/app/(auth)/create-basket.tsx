// src/app/(auth)/create-basket.tsx

import { CreateBasketScreen } from '@/screens/auth/CreateBasketScreen';
import { useRouter } from 'expo-router';

export default function CreateBasketRoute() {
  const router = useRouter();
  return (
    <CreateBasketScreen
      onBack={() => router.back()}
      onCreated={() => router.replace('/(auth)/baskets')}
    />
  );
}