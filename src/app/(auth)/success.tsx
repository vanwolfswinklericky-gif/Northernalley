import { SuccessScreen } from '@/screens/auth/SuccessScreen';
import { usePlanStore } from '@/store/planStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useRouter } from 'expo-router';

export default function SuccessRoute() {
  const router = useRouter();
  const reset = usePlanStore((s) => s.reset);
  const setHoldings = usePortfolioStore((s) => s.setHoldings);
  const basketId = usePlanStore((s) => s.basketId);

  const handleGo = () => {
    // Seed the portfolio so the Dashboard has data
    setHoldings([
      { symbol: 'BTC', amount: 0.0234, basketId: basketId ?? 'top20' },
      { symbol: 'ETH', amount: 0.45, basketId: basketId ?? 'top20' },
      { symbol: 'SOL', amount: 12.3, basketId: basketId ?? 'top20' },
      { symbol: 'BNB', amount: 2.1, basketId: basketId ?? 'top20' },
    ]);
    reset();
    router.replace('/(app)/(tabs)/dashboard');
  };

  return <SuccessScreen onGoToDashboard={handleGo} />;
}