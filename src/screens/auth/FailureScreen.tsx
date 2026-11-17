// src/screens/auth/FailureScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { COLORS, RADIUS, TYPE } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface FailureScreenProps {
  onRetry: () => void;
  onChangeAmount: () => void;
  failIndex?: number;
}

const FAIL_CASES = [
  { title: 'Payment Declined', msg: 'Your bank declined this charge. Please try another card or contact your bank.' },
  { title: 'Insufficient Funds', msg: "This card doesn't have enough available balance for this purchase." },
  { title: 'Limit Exceeded', msg: 'This amount exceeds your current monthly limit. Try a smaller amount.' },
];

const fmtEUR = (n: number) => `€${n.toFixed(2)}`;

export function FailureScreen({ onRetry, onChangeAmount, failIndex = 0 }: FailureScreenProps) {
  const { selectedBasket, amount, frequency, plan } = usePlanStore();
  const error = FAIL_CASES[failIndex % FAIL_CASES.length];

  const planName = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Starter';

  return (
    <Screen
      footer={
        <View style={{ paddingBottom: 24, gap: 12 }}>
          {/* 1. Try Again -> Attempt Payment again */}
          <Button label="Try Again" variant="accent" onPress={onRetry} />
          {/* 2. Back to Plans -> Takes them back to plan selection */}
          <Button label="Back to Plans" variant="secondary" onPress={onChangeAmount} />
        </View>
      }
    >
      {/* Error Hero */}
      <View style={styles.hero}>
        <View style={styles.errorCircle}>
          <Ionicons name="close" size={48} color="#fff" />
        </View>
        <Text style={styles.title}>{error.title}</Text>
        <Text style={styles.sub}>{error.msg}</Text>
      </View>

      {/* Order Summary Card */}
      <Container style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Plan</Text>
          <Text style={styles.value}>{planName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Basket</Text>
          <Text style={styles.value}>{selectedBasket?.name ?? 'Top 20 Crypto'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>{fmtEUR(amount ?? 0)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Frequency</Text>
          <Text style={styles.value}>{frequency === 'monthly' ? 'Monthly' : frequency === 'weekly' ? 'Weekly' : 'Daily'}</Text>
        </View>
      </Container>

      {/* Reassurance Note */}
      <View style={styles.noteBox}>
        <Ionicons name="shield-checkmark" size={18} color={COLORS.up} />
        <Text style={styles.note}>
          You haven&apos;t been charged. No funds were moved from your account.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { 
    alignItems: 'center', 
    paddingTop: 40, 
    paddingBottom: 32 
  },
  errorCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: COLORS.danger,
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
    maxWidth: 320,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    padding: 20,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.card,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
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
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  note: {
    fontSize: 13,
    color: COLORS.t2,
    lineHeight: 18,
    fontWeight: '500',
  },
});