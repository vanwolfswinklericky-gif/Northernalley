// src/app/(app)/(tabs)/settings.tsx

import { SettingsScreen } from '@/screens/app/SettingsScreen';
import { usePlanStore } from '@/store/planStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useRouter } from 'expo-router';

export default function SettingsRoute() {
  const router = useRouter();
  const resetPlan = usePlanStore((s) => s.reset);
  const clearPortfolio = usePortfolioStore((s) => s.clear);

  const signOut = () => {
    resetPlan();
    clearPortfolio();
    router.replace('/(auth)');
  };

  return (
    <SettingsScreen
      onTab={(key) => router.replace(`/(app)/(tabs)/${key}`)}
      onProfile={() => router.push('/(app)/profile')}
      onWallet={() => router.push('/(app)/wallet')}
      onAbout={() => router.push('/(app)/about')}
      onPolicies={() => router.push('/(app)/policies')}
      onPlan={() => router.push('/(auth)/amount')}
      onSignOut={signOut}
    />
  );
}