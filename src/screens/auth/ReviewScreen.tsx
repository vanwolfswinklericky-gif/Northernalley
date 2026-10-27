// src/screens/auth/ReviewScreen.tsx

import { Button } from '@/components/ui/Button';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { SummaryRows } from '@/components/ui/SummaryRows';
import { basketById, FEE_RATE, fmtUSD } from '@/constants/baskets';
import { COLORS } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface ReviewScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export function ReviewScreen({ onBack, onContinue }: ReviewScreenProps) {
  const { basketId, amount } = usePlanStore();
  const b = basketById(basketId);
  const fee = (amount ?? 0) * FEE_RATE;

  return (
    <Screen
      onBack={onBack}
      progress={5 / 7}
      title="Review your plan"
      subtitle="Here's what will happen each month."
      footer={<Button label="Continue" onPress={onContinue} />}
    >
      <Container>
        <View style={styles.head}>
          <View style={styles.stack}>
            {b.coins.slice(0, 3).map((c, i) => (
              <CoinBadge
                key={c}
                symbol={c}
                size={36}
                style={{ marginLeft: i ? -12 : 0, borderWidth: 2, borderColor: '#fff' }}
              />
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{b.name}</Text>
            <Text style={styles.meta}>
              {b.assets} assets · {b.risk}
            </Text>
          </View>
        </View>

        <SummaryRows
          rows={[
            ['Basket', b.name],
            ['Amount', fmtUSD(amount ?? 0)],
            ['Frequency', 'Monthly'],
            ['First buy', 'Today'],
            ['Next buy', 'Nov 7, 2026'],
          ]}
        />
      </Container>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.t3} />
        <Text style={styles.noteText}>
          A {(FEE_RATE * 100).toFixed(1)}% fee ({fmtUSD(fee)}) is included in each purchase.
          Crypto prices are volatile and you may lose money.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  stack: { flexDirection: 'row' },
  name: { fontSize: 17, fontWeight: '600', color: COLORS.t1 },
  meta: { fontSize: 13, color: COLORS.t2, marginTop: 2 },
  note: { flexDirection: 'row', gap: 12, marginTop: 16, paddingHorizontal: 4, alignItems: 'flex-start' },
  noteText: { fontSize: 13, color: COLORS.t2, lineHeight: 20, flex: 1 },
});