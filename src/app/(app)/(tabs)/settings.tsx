// src/app/(app)/(tabs)/settings.tsx

import { useSubscription } from '@/hooks/useSubscription';
import { SettingsScreen } from '@/screens/app/SettingsScreen';
import { usePlanStore } from '@/store/planStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export default function SettingsRoute() {
  const router = useRouter();
  const resetPlan = usePlanStore((s) => s.reset);
  const clearPortfolio = usePortfolioStore((s) => s.clear);
  const { status } = useSubscription();

  const hasActivePlan = status === 'active';

  const signOut = () => {
    resetPlan();
    clearPortfolio();
    router.replace('/(auth)');
  };

  return (
    <SettingsScreen
      onProfile={() => router.push('/(app)/profile')}
      onWallet={() => {
        if (hasActivePlan) {
          router.push('/(app)/wallet');
        } else {
          Alert.alert('No Active Plan', 'Please purchase a plan to access your wallet.');
          router.push('/(app)/plan');
        }
      }}
      onAbout={() => router.push('/(app)/about')}
      onPolicies={() => router.push('/(app)/policies')}
      onPlan={() => {
        if (hasActivePlan) {
          router.push('/(app)/baskets');
        } else {
          router.push('/(app)/plan');
        }
      }}
      onSupport={() => router.push('/(app)/support')}
      onSignOut={signOut}
    />
  );
}