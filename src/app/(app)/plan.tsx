import { PlanScreen } from '@/screens/auth/PlanScreen';
import { usePlanStore } from '@/store/planStore';
import { useRouter } from 'expo-router';

export default function AppPlanRoute() {
  const router = useRouter();
  const setPlan = usePlanStore((state) => state.setPlan);

  const continueToProvisioning = (plan: 'starter' | 'pro' | 'premium') => {
    setPlan(plan);
    router.push('/(app)/provision-signer');
  };

  return (
    <PlanScreen
      onBack={() => router.back()}
      onContinue={continueToProvisioning}
      onSkip={() => continueToProvisioning('starter')}
    />
  );
}
