import { ProfileScreen } from '@/screens/app/ProfileScreen';
import { usePlanStore } from '@/store/planStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useRouter } from 'expo-router';

export default function ProfileRoute() {
  const router = useRouter();
  const resetPlan = usePlanStore((s) => s.reset);
  const clearPortfolio = usePortfolioStore((s) => s.clear);

  return (
    <ProfileScreen
      onBack={() => router.back()}
      onSignOut={() => {
        resetPlan();
        clearPortfolio();
        router.replace('/(auth)');
      }}
    />
  );
}