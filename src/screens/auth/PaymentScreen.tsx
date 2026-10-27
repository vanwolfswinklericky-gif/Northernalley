// src/screens/auth/PaymentScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { SummaryRows } from '@/components/ui/SummaryRows';
import { basketById, fmtUSD } from '@/constants/baskets';
import { COLORS } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface PaymentScreenProps {
  onBack: () => void;
  onSuccess: () => void; // Will trigger the Stripe redirect
  loading?: boolean;
}

export function PaymentScreen({ onBack, onSuccess, loading }: PaymentScreenProps) {
  const { basketId, amount, plan } = usePlanStore();
  const b = basketById(basketId);

  const planPrices: Record<string, number> = {
    starter: 19.99,
    pro: 39.99,
    premium: 79.99,
  };
  const planPrice = plan ? planPrices[plan] ?? 0 : 0;
  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Starter';

  return (
    <Screen
      onBack={onBack}
      progress={8 / 10}
      title="Review & Pay"
      subtitle="Secure checkout powered by Stripe."
      footer={
        <View style={styles.footer}>
          <Button
            label={`Pay $${planPrice.toFixed(2)} with Stripe`}
            icon="lock-closed"
            variant="accent"
            loading={loading}
            onPress={onSuccess}
          />
          <View style={styles.secureRow}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.up} />
            <Text style={styles.secureText}>Encrypted and processed securely</Text>
          </View>
        </View>
      }
    >
      <Container style={styles.card}>
        <Text style={styles.cardLabel}>Subscription</Text>
        <SummaryRows
          rows={[
            ['Plan', planLabel],
            ['Billing', 'Monthly'],
            ['Cancel anytime', 'Yes'],
          ]}
        />
        <View style={styles.total}>
          <Text style={styles.totalKey}>Monthly total</Text>
          <Text style={styles.totalValue}>${planPrice.toFixed(2)}</Text>
        </View>
      </Container>

      <Container style={styles.card}>
        <Text style={styles.cardLabel}>Your Investment Plan</Text>
        <SummaryRows
          rows={[
            ['Basket', b.name],
            ['Monthly amount', fmtUSD(amount ?? 0)],
            ['Frequency', 'Monthly'],
          ]}
        />
      </Container>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color={COLORS.accent} />
        <Text style={styles.infoText}>
          You will be redirected to Stripe to securely enter your card details. Your subscription will start immediately after payment.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  cardLabel: { fontSize: 13, color: COLORS.t2, fontWeight: '500', marginBottom: 8 },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    borderStyle: 'dashed',
  },
  totalKey: { fontSize: 15, fontWeight: '600', color: COLORS.t1 },
  totalValue: { fontSize: 22, fontWeight: '600', color: COLORS.t1 },
  footer: { paddingBottom: 40, gap: 12 },
  secureRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  secureText: { fontSize: 12, color: COLORS.t3 },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.accentSoft,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.accentText,
    lineHeight: 20,
  },
});