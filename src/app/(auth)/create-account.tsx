// src/app/(auth)/create-account.tsx

import { CreateAccountScreen } from '@/screens/auth/CreateAccountScreen';
import { useRouter } from 'expo-router';

export default function CreateAccountRoute() {
  const router = useRouter();
  return (
    <CreateAccountScreen
      onBack={() => router.back()}
    />
  );
}