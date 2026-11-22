import { ReviewScreen } from '@/screens/auth/ReviewScreen';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { useRouter } from 'expo-router';

export default function ReviewRoute() {
  const router = useRouter();
  const { checkout, loading } = useStripeCheckout();

  return (
    <ReviewScreen
      onBack={() => router.back()}
      onContinue={checkout}
      loading={loading}
    />
  );
}