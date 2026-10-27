import { PoliciesScreen } from '@/screens/app/PoliciesScreen';
import { useRouter } from 'expo-router';

export default function PoliciesRoute() {
  const router = useRouter();
  return <PoliciesScreen onBack={() => router.back()} />;
}