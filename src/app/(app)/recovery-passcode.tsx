import { RecoveryPasscodeScreen } from '@/screens/app/RecoveryPasscodeScreen';
import { useRouter } from 'expo-router';

export default function RecoveryPasscodeRoute() {
  const router = useRouter();
  return <RecoveryPasscodeScreen onBack={() => router.back()} />;
}
