import { COLORS } from '@/constants/theme';
import { isConnected, needsRecovery, useEmbeddedWallet, usePrivy } from '@privy-io/expo';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function IndexRoute() {
  const { user, isReady } = usePrivy();
  const wallet = useEmbeddedWallet();
  const loggedIn = !!user;
  const walletReady = isConnected(wallet);
  const walletNeedsRecovery = needsRecovery(wallet);

  if (!isReady || (loggedIn && !walletReady && !walletNeedsRecovery)) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!loggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  if (walletNeedsRecovery) {
    return <Redirect href="/(auth)/recovery" />;
  }

  return <Redirect href="/(app)/(tabs)/dashboard" />;
}
