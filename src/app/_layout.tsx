// src/app/_layout.tsx

import * as Crypto from 'expo-crypto';

// Polyfill for Hermes: Privy needs a Web Crypto shim on native
if (typeof (globalThis as any).crypto === 'undefined') {
  (globalThis as any).crypto = {};
}
if (typeof (globalThis as any).crypto.getRandomValues !== 'function') {
  (globalThis as any).crypto.getRandomValues = Crypto.getRandomValues;
}
if (typeof (globalThis as any).crypto.randomUUID !== 'function') {
  (globalThis as any).crypto.randomUUID = Crypto.randomUUID;
}
if (typeof (globalThis as any).crypto.subtle === 'undefined') {
  (globalThis as any).crypto.subtle = {
    digest: Crypto.digest,
  };
}

// import { SplashOverlay } from '@/components/SplashOverlay'; // Keep commented out
import { COLORS } from '@/constants/theme';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { PrivyProvider } from '@privy-io/expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSyncUser } from '@/hooks/useSyncUser';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 30_000 } },
});

function AppContent() {
  useSyncUser();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
      }}
    />
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
      setReady(true);
    }
  }, [fontsLoaded]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: '#000000' }} />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <PrivyProvider
          appId={process.env.EXPO_PUBLIC_PRIVY_APP_ID!}
          clientId={process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID!}
        >
          <AppContent />
        </PrivyProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}