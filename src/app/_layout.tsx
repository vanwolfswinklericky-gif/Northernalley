// src/app/_layout.tsx
import * as Crypto from 'expo-crypto';

// Hermes Web Crypto polyfill (keep as is)
if (typeof (globalThis as any).crypto === 'undefined') (globalThis as any).crypto = {};
if (typeof (globalThis as any).crypto.getRandomValues !== 'function') (globalThis as any).crypto.getRandomValues = Crypto.getRandomValues;
if (typeof (globalThis as any).crypto.randomUUID !== 'function') (globalThis as any).crypto.randomUUID = Crypto.randomUUID;
if (typeof (globalThis as any).crypto.subtle === 'undefined') (globalThis as any).crypto.subtle = { digest: Crypto.digest };

import { COLORS } from '@/constants/theme';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { isConnected, isNotCreated, needsRecovery, PrivyProvider, useEmbeddedWallet, usePrivy } from '@privy-io/expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => {});
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 2, staleTime: 30_000 } } });

function RootNavigator() {
  const { user, isReady } = usePrivy();
  const wallet = useEmbeddedWallet();

  // 1. Calculate all values BEFORE any early returns
  const loggedIn = !!user;
  const walletReady = isConnected(wallet);
  const walletNeedsRecovery = needsRecovery(wallet);
  const walletNotCreated = isNotCreated(wallet);

  // 2. ALL HOOKS MUST GO HERE, before any return statements
  useEffect(() => {
    if (isReady && loggedIn && walletNotCreated) {
      wallet.create({ recoveryMethod: 'privy' }).catch((error) => {
        console.error('Auto wallet creation failed:', error);
      });
    }
  }, [isReady, loggedIn, walletNotCreated]);

  // 3. Now it is safe to do early returns
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (loggedIn && walletNotCreated) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  // 4. Render the navigation stack
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg } }}>
      {/* Logged out: Welcome + Auth (Login/OTP) */}
      <Stack.Protected guard={!loggedIn}>
        <Stack.Screen name="(welcome)" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* Logged in, wallet needs recovery: Recovery */}
      <Stack.Protected guard={loggedIn && walletNeedsRecovery}>
        <Stack.Screen name="(auth)/recovery" />
      </Stack.Protected>

      {/* Logged in, wallet ready: Onboarding + Main App */}
      <Stack.Protected guard={loggedIn && walletReady}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
      setReady(true);
    }
  }, [fontsLoaded]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <PrivyProvider
          appId={process.env.EXPO_PUBLIC_PRIVY_APP_ID!}
          clientId={process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID!}
        >
          <RootNavigator />
        </PrivyProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}