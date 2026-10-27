// src/app/(app)/(tabs)/performance.tsx

import { PerformanceScreen } from '@/screens/app/PerformanceScreen';
import { useRouter } from 'expo-router';

export default function PerformanceRoute() {
  const router = useRouter();
  return <PerformanceScreen onTab={(key) => router.replace(`/(app)/(tabs)/${key}`)} />;
}