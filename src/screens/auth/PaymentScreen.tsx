// src/screens/auth/PaymentScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { COLORS, RADIUS } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

const DEPOSIT_FEE_RATE = 0.01;
const fmtEUR = (n: number) => `€${n.toFixed(2)}`;

interface PaymentScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  loading?: boolean;
}

export function PaymentScreen({ onBack, onSuccess, loading }: PaymentScreenProps) {
  const { selectedBasket, amount, plan, frequency, addOns } = usePlanStore();

  // 1. Calculate Plan + Add-ons
  const planPrices: Record<string, number> = {
    starter: 19.99,
    pro: 39.99,
    premium: 79.99,
    free: 0,
  };
  const planPrice = plan ? planPrices[plan] ?? 0 : 0;
  
  const addOnPrice =
    (addOns.extraBasket ? 4.99 : 0) +
    (addOns.weeklyDca && plan === 'starter' ? 7.99 : 0) +
    (addOns.prioritySupport ? 9.99 : 0);
    
  const monthlySubscription = planPrice + addOnPrice;
  
  // 2. Calculate Investment + Fee
  const grossAmount = amount ?? 0;
  const depositFee = grossAmount * DEPOSIT_FEE_RATE;
  
  // 3. Total Due Today
  const totalDueToday = monthlySubscription + grossAmount + depositFee;
  
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
            label={`🔒 Pay ${fmtEUR(totalDueToday)} with Stripe`}
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
      {/* --- 1. App Subscription Card --- */}
      <Container style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <Ionicons name="ribbon-outline" size={20} color={COLORS.accent} />
          </View>
          <Text style={styles.cardTitle}>App Subscription</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Plan</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{planLabel}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Billing</Text>
          <Text style={styles.value}>Monthly</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Cancel anytime</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.up} />
            <Text style={styles.value}>Yes</Text>
          </View>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.price}>{fmtEUR(monthlySubscription)}</Text>
          <Text style={styles.pricePer}>/ month</Text>
        </View>
      </Container>

      {/* --- 2. Investment Plan Card --- */}
      <Container style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <Ionicons name="layers-outline" size={20} color={COLORS.accent} />
          </View>
          <Text style={styles.cardTitle}>Your Investment Plan</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Basket</Text>
          <Text style={styles.value}>{selectedBasket?.name ?? 'Top 20 Crypto'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>{fmtEUR(grossAmount)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Frequency</Text>
          <Text style={styles.value}>{frequency === 'monthly' ? 'Monthly' : frequency === 'weekly' ? 'Weekly' : 'Daily'}</Text>
        </View>
      </Container>

      {/* --- 3. Order Summary Card --- */}
      <Container style={styles.card}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subscription</Text>
          <Text style={styles.summaryValue}>{fmtEUR(monthlySubscription)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Deposit</Text>
          <Text style={styles.summaryValue}>{fmtEUR(grossAmount)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.summaryLabel}>Deposit fee (1%)</Text>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.t3} />
          </View>
          <Text style={styles.summaryValue}>{fmtEUR(depositFee)}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total due today</Text>
          <Text style={styles.totalValue}>{fmtEUR(totalDueToday)}</Text>
        </View>
      </Container>

      {/* --- 4. Stripe Info Box --- */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color={COLORS.accentText} />
        <Text style={styles.infoText}>
          You will be redirected to Stripe to securely enter your card details. Your subscription will start immediately after payment.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: RADIUS.xl,
    marginBottom: 16,
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.t1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: COLORS.t2,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.t1,
  },
  badge: {
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentText,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.t1,
  },
  pricePer: {
    fontSize: 13,
    color: COLORS.t2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.t1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.t1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.t1,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: -0.5,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.accentSoft,
    padding: 16,
    borderRadius: RADIUS.lg,
    gap: 12,
    alignItems: 'flex-start',
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.accentText,
    lineHeight: 18,
  },
  footer: {
    paddingBottom: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  secureText: {
    fontSize: 12,
    color: COLORS.t3,
    fontWeight: '500',
  },
});