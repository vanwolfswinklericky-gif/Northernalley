import { AmountScreen } from '@/screens/auth/AmountScreen';
import { useRouter } from 'expo-router';

export default function AmountRoute() {
  const router = useRouter();
  return (
    <AmountScreen
      onBack={() => router.back()}
      onContinue={() => router.push('/(auth)/review')}
    />
  );
}