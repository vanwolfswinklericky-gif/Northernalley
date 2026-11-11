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
      onTab={(key) => router.replace(`/(app)/(tabs)/${key}`)}
      onProfile={() => router.push('/(app)/profile')}
      
      // Restrict Wallet to active subscribers
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
      
      // Restrict Plan/Basket management to active subscribers
      onPlan={() => {
        if (hasActivePlan) {
          router.push('/(app)/baskets');
        } else {
          router.push('/(app)/plan');
        }
      }}
      
      onSignOut={signOut}
    />
  );
}