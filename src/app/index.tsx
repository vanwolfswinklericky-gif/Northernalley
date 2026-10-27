// src/app/index.tsx
import { usePrivy } from '@privy-io/expo';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isReady } = usePrivy();

  if (!isReady) return <View><ActivityIndicator /></View>;

  // If not logged in, send to auth flow
  return <Redirect href="/(auth)" />;
}