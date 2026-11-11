// src/app/(app)/(tabs)/dashboard.tsx

import { DashboardScreen } from '@/screens/app/DashboardScreen';
import { useRouter } from 'expo-router';

export default function DashboardRoute() {
  const router = useRouter();
  return (
    <DashboardScreen
      onBuy={() => router.push('/(app)/baskets')}
      onChoosePlan={() => router.push('/(app)/plan')}
      onWallet={() => router.push('/(app)/wallet')}
      onAsset={(s) => router.push({ pathname: '/(app)/asset/[symbol]', params: { symbol: s } })}
      onTab={(key) => router.replace(`/(app)/(tabs)/${key}`)}
    />
  );
}