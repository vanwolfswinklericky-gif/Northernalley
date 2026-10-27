// src/app/(auth)/login.tsx

import { LoginScreen } from '@/screens/auth/LoginScreen';
import { useRouter } from 'expo-router';

export default function LoginRoute() {
  const router = useRouter();
  return (
    <LoginScreen
      onBack={() => router.back()}
      onContinue={() => router.replace('/(app)/(tabs)/dashboard')}
      onGoogleSuccess={() => router.replace('/(app)/(tabs)/dashboard')}
    />
  );
}