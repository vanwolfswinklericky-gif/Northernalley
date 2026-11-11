import { SuccessScreen } from '@/screens/auth/SuccessScreen';
import { useRouter } from 'expo-router';

export default function AppSuccessRoute() {
  const router = useRouter();

  return (
    <SuccessScreen
      onGoToDashboard={() => router.replace('/(app)/(tabs)/dashboard')}
    />
  );
}
