import { SuccessScreen } from '@/screens/auth/SuccessScreen';
import { useRouter } from 'expo-router';

export default function SuccessRoute() {
  const router = useRouter();
  return <SuccessScreen onGoToDashboard={() => router.replace('/(app)/(tabs)/dashboard')} />;
}