// src/screens/auth/ProvisionSignerScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { COLORS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useEmbeddedEthereumWallet, usePrivy, useSessionSigners } from '@privy-io/expo';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProvisionSignerScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function ProvisionSignerScreen({ onBack, onSuccess }: ProvisionSignerScreenProps) {
  const { user, isReady } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();
  
  const { addSessionSigners } = useSessionSigners();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FIX: Changed wallet_index to walletIndex
  const walletToDelegate = wallets.find((wallet) => wallet.walletIndex === 0);
  const isAlreadyDelegated = (walletToDelegate as any)?.delegated === true;

  const handleDelegate = async () => {
    if (!walletToDelegate || !isReady) return;

    setLoading(true);
    setError(null);

    try {
      await addSessionSigners({
        address: walletToDelegate.address,
        // FIX: Cast to any to bypass Privy's strict TypeScript definitions for signers
        signers: [
          {
            signer_id: process.env.EXPO_PUBLIC_PRIVY_KEY_QUORUM_ID || process.env.EXPO_PUBLIC_PRIVY_POLICY_ID,
            policy_ids: [],
          }
        ] as any,
      });
      
      onSuccess();
    } catch (err: any) {
      if (err?.message?.includes('rejected')) {
        setError('You declined the request. Automatic investing requires your permission.');
      } else {
        setError(err?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      onBack={onBack}
      progress={4 / 10}
      title="Enable automatic investing"
      subtitle="Grant Northernalley permission to invest for you on schedule."
      footer={
        <View style={styles.footer}>
          <Button
            label={isAlreadyDelegated ? 'Already Enabled' : 'Enable Automatic Investing'}
            variant="accent"
            loading={loading}
            disabled={!isReady || !walletToDelegate || isAlreadyDelegated}
            onPress={handleDelegate}
          />
          {isAlreadyDelegated && (
            <View style={styles.successRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.up} />
              <Text style={styles.successText}>Your wallet is already delegated</Text>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { paddingBottom: 40, gap: 12 },
  card: { marginBottom: 16 },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: SPACING.s3,
  },
  heading: {
    fontSize: 17, fontWeight: '600', color: COLORS.t1,
    marginBottom: SPACING.s3, textAlign: 'center',
  },
  bulletList: { gap: 12 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletText: { flex: 1, fontSize: 14, color: COLORS.t1, lineHeight: 20 },
  errorCard: { marginBottom: 16 },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  errorText: { flex: 1, fontSize: 14, color: COLORS.danger, lineHeight: 20 },
  successRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  successText: { fontSize: 13, color: COLORS.up, fontWeight: '500' },
});