import { AmountScreen } from '@/screens/auth/AmountScreen';
import { useRouter } from 'expo-router';

export default function AppAmountRoute() {
  const router = useRouter();

  return (
    <AmountScreen
      onBack={() => router.back()}
      onContinue={() => router.push('/(app)/review')}
    />
  );
}
