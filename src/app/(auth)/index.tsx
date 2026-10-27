// src/app/(auth)/index.tsx

import { OnboardingScreen } from '@/screens/auth/OnboardingScreen';
import { useRouter } from 'expo-router';

export default function OnboardingRoute() {
  const router = useRouter();
  return <OnboardingScreen onStart={() => router.push('/(auth)/email')} onSignIn={() => router.push('/(auth)/login')} />;
}
