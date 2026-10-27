// src/app/(auth)/plan.tsx
import { PlanScreen } from '@/screens/auth/PlanScreen';
import { usePlanStore } from '@/store/planStore';
import { useRouter } from 'expo-router';

export default function PlanRoute() {
  const router = useRouter();
  const setPlan = usePlanStore((s) => s.setPlan);

  return (
    <PlanScreen
      onBack={() => router.back()}
      onContinue={(plan) => {
        setPlan(plan);
        router.push('/(auth)/provision-signer');
      }}
      onSkip={() => {
        // If they skip, give them the starter plan temporarily
        // and send them to the dashboard.
        setPlan('starter');
        router.replace('/(app)/(tabs)/dashboard');
      }}
    />
  );
}