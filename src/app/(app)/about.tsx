import { AboutScreen } from '@/screens/app/AboutScreen';
import { useRouter } from 'expo-router';

export default function AboutRoute() {
  const router = useRouter();
  return <AboutScreen onBack={() => router.back()} />;
}