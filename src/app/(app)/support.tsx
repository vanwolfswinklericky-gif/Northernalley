// src/app/(app)/support.tsx

import { SupportScreen } from '@/screens/app/SupportScreen';
import { useRouter } from 'expo-router';

export default function SupportRoute() {
  const router = useRouter();
  return <SupportScreen onBack={() => router.back()} />;
}
