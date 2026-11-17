// src/screens/auth/DelegationScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { COLORS, RADIUS, SPACING, TYPE } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllUserEmbeddedEthereumWallets,
  usePrivy,
  useSigners,
} from '@privy-io/expo';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface DelegationScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

export function DelegationScreen({ onBack, onComplete }: DelegationScreenProps) {
  const { user, isReady } = usePrivy();
  const { addSigners } = useSigners();
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
      const signerId = process.env.EXPO_PUBLIC_PRIVY_SIGNER_ID;
      if (!signerId) throw new Error('Automatic investing is not configured.');

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
      onComplete();
    } catch (err: any) {
      console.warn('Delegation failed:', err.message);
      setError(err.message || 'Delegation was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  // --- SUCCESS STATE ---
  if (isAlreadyDelegated) {
    return (
      <Screen footer={<Button label="Continue to Dashboard" onPress={onComplete} variant="accent" />}>
        <View style={styles.hero}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
          <Text style={styles.title}>Auto-Investing Enabled</Text>
          <Text style={styles.sub}>
            Your wallet is now securely linked. NorthernAlley can execute your DCA schedule automatically.
          </Text>
        </View>
      </Screen>
    );
  }

  // --- LOADING STATE ---
  if (!isReady) {
    return (
      <Screen onBack={onBack}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Checking wallet status...</Text>
        </View>
      </Screen>
    );
  }

  // --- APPROVAL STATE ---
  return (
    <Screen
      onBack={onBack}
      title="Enable Automatic Investing"
      subtitle="One-time setup to let NorthernAlley invest for you."
      footer={
        <View style={styles.footer}>
          <Button
            label={loading ? 'Setting up...' : 'Authorize Auto-Investing'}
            variant="accent"
            disabled={!walletToDelegate || loading}
            loading={loading}
            onPress={onDelegate}
          />
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      }
    >
      <Container style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={36} color={COLORS.accent} />
        </View>
        
        <Text style={styles.sectionTitle}>What you are approving</Text>
        
        <View style={styles.bulletList}>
          <View style={styles.bullet}>
            <View style={styles.bulletIcon}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
            <Text style={styles.bulletText}>
              Execute your scheduled DCA purchases automatically.
            </Text>
          </View>

          <View style={styles.bullet}>
            <View style={styles.bulletIcon}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
            <Text style={styles.bulletText}>
              Swap USDC into the crypto assets in your chosen basket.
            </Text>
          </View>

          <View style={styles.bullet}>
            <View style={[styles.bulletIcon, { backgroundColor: COLORS.danger }]}>
              <Ionicons name="close" size={14} color="#fff" />
            </View>
            <Text style={styles.bulletText}>
              <Text style={{fontWeight: '700'}}>We can never withdraw funds</Text> to an external address.
            </Text>
          </View>

          <View style={styles.bullet}>
            <View style={[styles.bulletIcon, { backgroundColor: COLORS.t3 }]}>
              <Ionicons name="settings" size={12} color="#fff" />
            </View>
            <Text style={styles.bulletText}>
              You can revoke this permission anytime from Settings.
            </Text>
          </View>
        </View>
      </Container>

      <View style={styles.noteBox}>
        <Ionicons name="lock-closed" size={16} color={COLORS.t3} />
        <Text style={styles.note}>
          Powered by Privy. Your keys stay with you — we only get permission to execute your pre-approved investment plan.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.s3,
    color: COLORS.t2,
    fontWeight: '500',
  },
  hero: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.up,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: COLORS.up,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    ...TYPE.h1,
    color: COLORS.t1,
    marginBottom: 12,
    textAlign: 'center',
  },
  sub: {
    fontSize: 15,
    color: COLORS.t2,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    padding: 24,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.card,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.t1,
    marginBottom: 20,
    textAlign: 'center',
  },
  bulletList: {
    gap: 16,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.t1,
    lineHeight: 22,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  note: {
    fontSize: 12,
    color: COLORS.t3,
    lineHeight: 18,
    flex: 1,
  },
  footer: {
    paddingBottom: 24,
    gap: 12,
  },
  error: {
    fontSize: 13,
    color: COLORS.danger,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
  },
});