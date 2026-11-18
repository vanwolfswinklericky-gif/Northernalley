// src/screens/auth/ProvisionSignerScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import {
  useEmbeddedEthereumWallet,
  usePrivy,
  useSigners,
} from '@privy-io/expo';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface ProvisionSignerScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function ProvisionSignerScreen({ onBack, onSuccess }: ProvisionSignerScreenProps) {
  const { user, isReady } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();
  const { addSigners } = useSigners();
  
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

    const signerId = process.env.EXPO_PUBLIC_PRIVY_SIGNER_ID;
    if (!signerId) {
      setError('Automatic investing is not configured. Please contact support.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addSigners({
        address: walletToDelegate.address,
        signers: [
          {
            signerId,
            policyIds: process.env.EXPO_PUBLIC_PRIVY_POLICY_ID
              ? [process.env.EXPO_PUBLIC_PRIVY_POLICY_ID]
              : [],
          },
        ],
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
      title="Enable Auto-Investing"
      subtitle="Authorize NorthernAlley to execute your DCA schedule."
      footer={
        <View style={styles.footer}>
          <Button
            label={isAlreadyDelegated ? 'Continue to Next Step' : 'Authorize Auto-Investing'}
            variant="accent"
            loading={loading}
            onPress={handleDelegate}
          />
          {isAlreadyDelegated && (
            <View style={styles.successRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.up} />
              <Text style={styles.successText}>Wallet already authorized</Text>
            </View>
          )}
        </View>
      }
    >
      <Container style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={36} color={COLORS.accent} />
        </View>
        <Text style={styles.heading}>Permission Required</Text>
        <Text style={styles.subheading}>
          To automate your investments, we need a secure, limited permission to execute swaps on your behalf.
        </Text>

        <View style={styles.divider} />

        <View style={styles.bulletList}>
          <View style={styles.bullet}>
            <View style={styles.bulletIcon}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
            <Text style={styles.bulletText}>
              Execute scheduled DCA purchases automatically
            </Text>
          </View>
          <View style={styles.bullet}>
            <View style={styles.bulletIcon}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
            <Text style={styles.bulletText}>
              Restricted to swaps only — <Text style={{fontWeight: '700'}}>NorthernAlley cannot withdraw your funds</Text>
            </Text>
          </View>
          <View style={styles.bullet}>
            <View style={styles.bulletIcon}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
            <Text style={styles.bulletText}>
              You retain full ownership of your funds and keys
            </Text>
          </View>
        </View>
      </Container>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Text style={styles.note}>
        Your funds always stay in your non-custodial wallet. NorthernAlley never holds your keys. You can revoke these permissions anytime from Settings.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingBottom: 24,
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
    fontWeight: '500',
  },
  card: {
    marginBottom: 20,
    padding: 24,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: SPACING.s4,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.t1,
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    color: COLORS.t2,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginBottom: 24,
  },
  bulletList: {
    gap: 16,
    width: '100%',
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulletIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.t1,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: RADIUS.lg,
    gap: 12,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '500',
    lineHeight: 18,
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
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: COLORS.t3,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
});