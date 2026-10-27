import { WalletScreen } from '@/screens/app/WalletScreen';
import { useRouter } from 'expo-router';

export default function WalletRoute() {
  const router = useRouter();
  return (
    <WalletScreen
      onBack={() => router.back()}
      onAsset={(s) =>
        router.push({ pathname: '/(app)/asset/[symbol]', params: { symbol: s } })
      }
    />
  );
}