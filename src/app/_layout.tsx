import * as Crypto from 'expo-crypto';
import { COLORS } from '@/constants/theme';
import { useRecoveryStore } from '@/store/recoveryStore';
import { usePlanStore } from '@/store/planStore';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import {
  getAllUserEmbeddedEthereumWallets,
  hasError,
  isConnected,
  isCreating,
  isNotCreated,
  needsRecovery,
  PrivyProvider,
  useEmbeddedWallet,
  useOnNeedsRecovery,
  usePrivy,
} from '@privy-io/expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

if (typeof (globalThis as any).crypto === 'undefined') (globalThis as any).crypto = {};
if (typeof (globalThis as any).crypto.getRandomValues !== 'function') (globalThis as any).crypto.getRandomValues = Crypto.getRandomValues;
if (typeof (globalThis as any).crypto.randomUUID !== 'function') (globalThis as any).crypto.randomUUID = Crypto.randomUUID;
if (typeof (globalThis as any).crypto.subtle === 'undefined') (globalThis as any).crypto.subtle = { digest: Crypto.digest };

SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('Unable to hold the splash screen:', error);
});
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 2, staleTime: 30_000 } } });
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

function RootNavigator() {
  const { user, isReady } = usePrivy();
  const wallet = useEmbeddedWallet();
  const setOnRecovered = useRecoveryStore((state) => state.setOnRecovered);
  const hasSyncedUserRef = useRef<string | null>(null);

  const loggedIn = !!user;
  const walletReady = isConnected(wallet);
  const walletAddress = user
    ? getAllUserEmbeddedEthereumWallets(user)[0]?.address
    : undefined;
  const walletNeedsRecovery = needsRecovery(wallet);
  const walletNotCreated = isNotCreated(wallet);
  const walletCreating = isCreating(wallet);
  const walletHasError = hasError(wallet);
  
  // Get plan details for pending wallet sync
  const { basketId, amount, frequency } = usePlanStore();

  useOnNeedsRecovery({
    onNeedsRecovery: ({ onRecovered }) => {
      setOnRecovered(onRecovered);
    },
  });

  // --- RACE CONDITION FIX: Sync Wallet on Login ---
  useEffect(() => {
    if (
      loggedIn &&
      walletReady &&
      walletAddress &&
      user?.id &&
      hasSyncedUserRef.current !== user.id
    ) {
      hasSyncedUserRef.current = user.id;

      const syncWallet = async () => {
        try {
          const userResponse = await fetch(`${API_URL}/auth/sync-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              privyUserId: user.id,
              email: user.linked_accounts.find((account) => account.type === 'email')?.address ?? null,
              walletAddress,
            }),
          });
          if (!userResponse.ok) {
            throw new Error(`User sync failed (HTTP ${userResponse.status}).`);
          }

          const response = await fetch(`${API_URL}/auth/sync-wallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              privyUserId: user.id,
              walletAddress,
              basketId: basketId || undefined,
              amount: amount || undefined,
              frequency: frequency || undefined,
            }),
          });
          if (!response.ok) throw new Error(`Wallet sync failed (HTTP ${response.status}).`);

          const data = await response.json();
          if (data.activated) {
            console.log('Pending DCA subscription activated!');
          }
        } catch (err) {
          console.warn('Wallet sync failed:', err);
        }
      };

      syncWallet();
    }
  }, [
    loggedIn,
    walletReady,
    walletAddress,
    user?.id,
    user?.linked_accounts,
    basketId,
    amount,
    frequency,
  ]);

  if (!isReady) {
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

      <Stack.Protected guard={loggedIn && (walletNotCreated || walletCreating || walletHasError)}>
        <Stack.Screen name="(auth)/create-passcode" />
      </Stack.Protected>

      <Stack.Protected guard={loggedIn && walletReady}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch((error) => {
        console.warn('Unable to hide the splash screen:', error);
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;

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