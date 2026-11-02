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
        // Plan → Provision Signer → Baskets → Create Passcode → Dashboard
        router.push('/(auth)/provision-signer');
      }}
      onSkip={() => {
        // "Skip" means: default to starter plan, but still complete wallet setup.
        // We cannot jump straight to (app) because the wallet guard would block it.
        setPlan('starter');
        router.push('/(auth)/provision-signer');
      }}
    />
  );
}