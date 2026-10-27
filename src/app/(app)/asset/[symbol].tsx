import { AssetDetailScreen } from '@/screens/app/AssetDetailScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function AssetDetailRoute() {
  const router = useRouter();
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  return (
    <AssetDetailScreen
      symbol={symbol ?? 'BTC'}
      onBack={() => router.back()}
      onBuyMore={() => router.push('/(auth)/amount')}
    />
  );
}