// src/app/(app)/(tabs)/_layout.tsx

import { COLORS } from '@/constants/theme';
import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
        animation: 'fade',
      }}
    />
  );
}