// src/screens/auth/ProvisionSignerScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { COLORS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import {
  useAuthorizationContext,
  useEmbeddedEthereumWallet, // <-- THE CORRECT HOOK FOR v0.76.5
  usePrivy,
} from '@privy-io/expo';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface ProvisionSignerScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function ProvisionSignerScreen({
  onBack,
  onSuccess,
}: ProvisionSignerScreenProps) {
  const { user, isReady } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();
  
  // Using the correct hook from v0.76.5
  const { addSigner } = useAuthorizationContext();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletToDelegate = wallets.find((wallet) => wallet.walletIndex === 0);
  const isAlreadyDelegated = user?.linked_accounts.some(
    (account) =>
      account.type === 'wallet' &&
      account.chain_type === 'ethereum' &&
      account.connector_type === 'embedded' &&
      'wallet_index' in account &&
      account.wallet_index === 0 &&
      account.delegated,
  ) ?? false;

  const handleDelegate = async () => {
    if (isAlreadyDelegated) {
      onSuccess();
      return;
    }

    if (!walletToDelegate) {
      setError('Wallet is still loading. Please wait a moment and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addSigner({
        address: walletToDelegate.address,
        signerId: process.env.EXPO_PUBLIC_PRIVY_SIGNER_ID!,
        policyIds: process.env.EXPO_PUBLIC_PRIVY_POLICY_ID 
          ? [process.env.EXPO_PUBLIC_PRIVY_POLICY_ID] 
          : [],
      });
      onSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : undefined;
      setError(errorMessage || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isReady || !walletToDelegate) {
    return (
      <Screen onBack={onBack}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Creating your secure wallet...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      onBack={onBack}
      progress={4 / 7}
      title="Enable automatic investing"
      subtitle="Grant Northernalley permission to invest for you on schedule."
      footer={
        <View style={styles.footer}>
          <Button
            label={isAlreadyDelegated ? 'Continue' : 'Enable Automatic Investing'}
            variant="accent"
            loading={loading}
            onPress={handleDelegate}
          />
          {isAlreadyDelegated && (
            <View style={styles.successRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.up} />
              <Text style={styles.successText}>
                Your wallet is already delegated
              </Text>
            </View>
          )}
        </View>
      }
    >
      <Container style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={32} color={COLORS.accent} />
        </View>
        <Text style={styles.heading}>What you're approving</Text>
        <View style={styles.bulletList}>
          <View style={styles.bullet}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
            <Text style={styles.bulletText}>
              Northernalley can execute your monthly DCA purchases automatically
            </Text>
          </View>
          <View style={styles.bullet}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
            <Text style={styles.bulletText}>
              Only swap transactions are allowed — no withdrawals to other addresses
            </Text>
          </View>
          <View style={styles.bullet}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
            <Text style={styles.bulletText}>
              You keep full control — revoke access anytime from Settings
            </Text>
          </View>
        </View>
      </Container>

      {error && (
        <Container style={styles.errorCard}>
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={20} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </Container>
      )}

      <Text style={styles.note}>
        Your funds always stay in your wallet. Northernalley never holds your keys.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingBottom: 40,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.t2,
    marginTop: SPACING.s3,
  },
  card: {
    marginBottom: 16,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.s3,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.t1,
    marginBottom: SPACING.s3,
    textAlign: 'center',
  },
  bulletList: {
    gap: 12,
    width: '100%',
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.t1,
    lineHeight: 20,
  },
  errorCard: {
    marginBottom: 16,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.danger,
    lineHeight: 20,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  successText: {
    fontSize: 13,
    color: COLORS.up,
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    color: COLORS.t3,
    textAlign: 'center',
    paddingHorizontal: SPACING.s4,
    lineHeight: 18,
  },
});