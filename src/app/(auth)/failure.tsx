import { FailureScreen } from '@/screens/auth/FailureScreen';
import { useRouter } from 'expo-router';

export default function FailureRoute() {
  const router = useRouter();
  return (
    <FailureScreen
      onRetry={() => router.replace('/(auth)/review')}
      onChangeAmount={() => router.replace('/(auth)/amount')}
    />
  );
}