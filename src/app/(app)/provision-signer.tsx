import { ProvisionSignerScreen } from '@/screens/auth/ProvisionSignerScreen';
import { useRouter } from 'expo-router';

export default function AppProvisionSignerRoute() {
  const router = useRouter();

  return (
    <ProvisionSignerScreen
      onBack={() => router.back()}
      onSuccess={() => router.push('/(app)/baskets')}
    />
  );
}
