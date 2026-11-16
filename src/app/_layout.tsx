// src/app/_layout.tsx
import * as Crypto from 'expo-crypto';

// Hermes Web Crypto polyfill
if (typeof (globalThis as any).crypto === 'undefined') (globalThis as any).crypto = {};
if (typeof (globalThis as any).crypto.getRandomValues !== 'function') (globalThis as any).crypto.getRandomValues = Crypto.getRandomValues;
if (typeof (globalThis as any).crypto.randomUUID !== 'function') (globalThis as any).crypto.randomUUID = Crypto.randomUUID;
if (typeof (globalThis as any).crypto.subtle === 'undefined') (globalThis as any).crypto.subtle = { digest: Crypto.digest };

import { COLORS } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore'; // Import your store
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { isConnected, isNotCreated, needsRecovery, PrivyProvider, useEmbeddedWallet, usePrivy } from '@privy-io/expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => {});
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 2, staleTime: 30_000 } } });

function RootNavigator() {
  const { user, isReady } = usePrivy();
  const wallet = useEmbeddedWallet();
  const [isSyncingWallet, setIsSyncingWallet] = useState(false);
  const hasSyncedRef = useRef(false); // Prevent infinite loop

  const loggedIn = !!user;
  const walletReady = isConnected(wallet);
  const walletNeedsRecovery = needsRecovery(wallet);
  const walletNotCreated = isNotCreated(wallet);
  
  // Get plan details for pending wallet sync
  const { basketId, amount, frequency } = usePlanStore();

  // --- RACE CONDITION FIX: Sync Wallet on Login ---
  useEffect(() => {
    if (loggedIn && walletReady && wallet?.address && user?.id && !hasSyncedRef.current) {
      hasSyncedRef.current = true; // Only try once per session
      
      const syncWallet = async () => {
        setIsSyncingWallet(true);
        try {
          // Fetch user data to get the privyUserId
          // Note: In Privy, user.id is the DID (did:privy:...) not the privyUserId from your DB.
          // You need to ensure your frontend sends the correct identifier.
          // Assuming your backend expects the DID:
          const response = await fetch('https://your-app.vercel.app/api/auth/sync-wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              privyUserId: user.id,
              walletAddress: wallet.address,
              // Pass pending plan details if they exist in store
              basketId: basketId || undefined,
              amount: amount || undefined,
              frequency: frequency || undefined,
            }),
          });
          
          const data = await response.json();
          if (data.activated) {
            console.log('Pending DCA subscription activated!');
          }
        } catch (err) {
          console.warn('Wallet sync failed:', err);
        } finally {
          setIsSyncingWallet(false);
        }
      };

      syncWallet();
    }
  }, [loggedIn, walletReady, wallet?.address, user?.id, basketId, amount, frequency]);

  // Show loader while Privy initializes or wallet is being created
  if (!isReady || (loggedIn && walletNotCreated) || isSyncingWallet) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg } }}>
      <Stack.Protected guard={!loggedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={loggedIn && walletNeedsRecovery}>
        <Stack.Screen name="(auth)/recovery" />
      </Stack.Protected>

      <Stack.Protected guard={loggedIn && walletReady}>
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