import { FailureScreen } from '@/screens/auth/FailureScreen';
import { useRouter } from 'expo-router';

export default function AppFailureRoute() {
  const router = useRouter();

  return (
    <FailureScreen
      onRetry={() => router.replace('/(app)/payment')}
      onChangeAmount={() => router.replace('/(app)/amount')}
    />
  );
}
