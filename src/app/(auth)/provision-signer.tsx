// src/app/(auth)/provision-signer.tsx

import { ProvisionSignerScreen } from '@/screens/auth/ProvisionSignerScreen';
import { useRouter } from 'expo-router';

export default function ProvisionSignerRoute() {
  const router = useRouter();

  return (
    <ProvisionSignerScreen
      onBack={() => router.back()}
      onSuccess={() => router.push('/(auth)/baskets')}
    />
  );
}