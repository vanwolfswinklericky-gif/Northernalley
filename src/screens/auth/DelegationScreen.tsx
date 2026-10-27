// src/screens/auth/DelegationScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { StatusCircle } from '@/components/ui/StatusCircle';
import { COLORS, SPACING, TYPE } from '@/constants/theme';
import {
    getAllUserEmbeddedEthereumWallets,
    useDelegatedActions,
    usePrivy,
} from '@privy-io/expo';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface DelegationScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

export function DelegationScreen({ onBack, onComplete }: DelegationScreenProps) {
  const { user, isReady } = usePrivy();
  const { delegateWallet } = useDelegatedActions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the user's embedded wallets
  const wallets = getAllUserEmbeddedEthereumWallets(user);
  const walletToDelegate = wallets.find((wallet) => wallet.wallet_index === 0);
  const isAlreadyDelegated = walletToDelegate?.delegated === true;

  const onDelegate = async () => {
    if (!walletToDelegate || !isReady) return;

    setLoading(true);
    setError(null);

    try {
      await delegateWallet({
        address: walletToDelegate.address,
        chainType: 'ethereum',
      });
      onComplete();
    } catch (err: any) {
      console.warn('Delegation failed:', err.message);
      setError(err.message || 'Delegation was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  // If already delegated, skip this screen
  if (isAlreadyDelegated) {
    return (
      <Screen footer={<Button label="Continue" onPress={onComplete} />}>
        <View style={styles.hero}>
          <StatusCircle kind="ok" />
          <Text style={styles.title}>Automatic investing is on</Text>
          <Text style={styles.sub}>
            Your wallet is already set up to invest automatically.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      onBack={onBack}
      title="Enable Automatic Investing"
      subtitle="One-time setup to let Northernalley invest for you."
      footer={
        <>
          <Button
            label={loading ? 'Setting up...' : 'Enable Automatic Investing'}
            variant="accent"
            disabled={!isReady || !walletToDelegate || loading}
            loading={loading}
            onPress={onDelegate}
          />
          {error && <Text style={styles.error}>{error}</Text>}
        </>
      }
    >
      <Container>
        <Text style={styles.sectionTitle}>What you're approving</Text>
        <View style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            Northernalley can execute your scheduled DCA buys automatically.
          </Text>
        </View>
        <View style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            We can only swap USDC into the crypto assets in your chosen basket.
          </Text>
        </View>
        <View style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            We can never withdraw funds to an external address.
          </Text>
        </View>
        <View style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            You can revoke this permission anytime from Settings.
          </Text>
        </View>
      </Container>

      <Text style={styles.note}>
        Powered by Privy. Your keys stay with you — we only get permission to execute
        your pre-approved investment plan.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  title: { ...TYPE.h1, color: COLORS.t1, marginTop: 28, textAlign: 'center' },
  sub: {
    fontSize: 15,
    color: COLORS.t2,
    maxWidth: 320,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.t1,
    marginBottom: SPACING.s4,
  },
  bullet: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.s3,
  },
  bulletDot: {
    fontSize: 15,
    color: COLORS.accent,
    fontWeight: '700',
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.t2,
    lineHeight: 22,
  },
  note: {
    fontSize: 12,
    color: COLORS.t3,
    textAlign: 'center',
    marginTop: SPACING.s4,
    paddingHorizontal: SPACING.s4,
    lineHeight: 18,
  },
  error: {
    fontSize: 13,
    color: COLORS.danger,
    textAlign: 'center',
    marginTop: SPACING.s2,
  },
});