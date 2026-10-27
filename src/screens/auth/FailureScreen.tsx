// src/screens/auth/FailureScreen.tsx

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { StatusCircle } from '@/components/ui/StatusCircle';
import { SummaryRows } from '@/components/ui/SummaryRows';
import { basketById, fmtUSD } from '@/constants/baskets';
import { COLORS, SPACING, TYPE } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { StyleSheet, Text, View } from 'react-native';

interface FailureScreenProps {
  onRetry: () => void;
  onChangeAmount: () => void;
  failIndex?: number;
}

const FAIL_CASES = [
  { title: 'Card declined', msg: 'Your bank declined this charge. Try another card or contact your bank.' },
  { title: 'Insufficient funds', msg: "This card doesn't have enough available balance for this purchase." },
  { title: 'Amount over limit', msg: 'This amount exceeds your current monthly limit. Try a smaller amount.' },
];

export function FailureScreen({ onRetry, onChangeAmount, failIndex = 0 }: FailureScreenProps) {
  const { basketId, amount } = usePlanStore();
  const b = basketById(basketId);
  const error = FAIL_CASES[failIndex % FAIL_CASES.length];

  return (
    <Screen
      footer={
        <>
          <Button label="Try Again" onPress={onRetry} />
          <Button label="Change Amount" variant="secondary" onPress={onChangeAmount} />
        </>
      }
    >
      <View style={styles.hero}>
        <StatusCircle kind="err" />
        <Text style={styles.title}>{error.title}</Text>
        <Text style={styles.sub}>{error.msg}</Text>
      </View>

      <Container>
        <Text style={styles.planLabel}>Your plan</Text>
        <SummaryRows
          rows={[
            ['Basket', b.name],
            ['Amount', fmtUSD(amount ?? 0)],
            ['Frequency', 'Monthly'],
          ]}
        />
      </Container>

      <Text style={styles.note}>You haven't been charged.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  title: { ...TYPE.h1, color: COLORS.t1, marginTop: 28 },
  sub: {
    fontSize: 15,
    color: COLORS.t2,
    maxWidth: 300,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  planLabel: {
    fontSize: 13,
    color: COLORS.t2,
    fontWeight: '500',
    marginBottom: 14,
  },
  note: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.t3,
    marginTop: SPACING.s3,
  },
});