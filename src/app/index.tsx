import { COLORS } from '@/constants/theme';
import {
  hasError,
  isConnected,
  isCreating,
  isNotCreated,
  needsRecovery,
  useEmbeddedWallet,
  usePrivy,
} from '@privy-io/expo';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function IndexRoute() {
  const { user, isReady } = usePrivy();
  const wallet = useEmbeddedWallet();
  const loggedIn = !!user;
  const walletReady = isConnected(wallet);
  const walletNeedsRecovery = needsRecovery(wallet);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  if (!loggedIn) {
    return <Redirect href="/(auth)" />;
  }

  if (walletNeedsRecovery) {
    return <Redirect href="/(auth)/recovery" />;
  }

  if (isNotCreated(wallet) || isCreating(wallet) || hasError(wallet)) {
    return <Redirect href="/(auth)/create-passcode" />;
  }

  if (!walletReady) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return <Redirect href="/(app)/(tabs)/dashboard" />;
}
