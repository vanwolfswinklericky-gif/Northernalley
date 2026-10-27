// src/app/(auth)/success.tsx

import { SuccessScreen } from '@/screens/auth/SuccessScreen';
import { usePlanStore } from '@/store/planStore';
import { useRouter } from 'expo-router';

export default function SuccessRoute() {
  const router = useRouter();
  const reset = usePlanStore((s) => s.reset);

  const handleGo = () => {
    reset(); // Clear the plan store
    router.replace('/(app)/(tabs)/dashboard');
  };

  return <SuccessScreen onGoToDashboard={handleGo} />;
}