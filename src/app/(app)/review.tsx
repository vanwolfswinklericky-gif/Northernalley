import { ReviewScreen } from '@/screens/auth/ReviewScreen';
import { useRouter } from 'expo-router';

export default function AppReviewRoute() {
  const router = useRouter();

  return (
    <ReviewScreen
      onBack={() => router.back()}
      onContinue={() => router.push('/(app)/payment')}
    />
  );
}
