// src/app/(app)/(tabs)/activity.tsx

// src/app/(app)/(tabs)/activity.tsx

import { ActivityScreen } from '@/screens/app/ActivityScreen';
import { useRouter } from 'expo-router';

export default function ActivityRoute() {
  const router = useRouter();
  return <ActivityScreen onTab={(key) => router.replace(`/(app)/(tabs)/${key}`)} />;
}