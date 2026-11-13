// src/screens/auth/ReviewScreen.tsx

import { Button } from '@/components/ui/Button';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Container } from '@/components/ui/Container';
import { Screen } from '@/components/ui/Screen';
import { SummaryRows } from '@/components/ui/SummaryRows';
import { COLORS } from '@/constants/theme';
import { usePlanStore } from '@/store/planStore';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const DEPOSIT_FEE_RATE = 0.01; // 1% Deposit Fee

// Format as Euros to match Stripe checkout
const fmtEUR = (n: number) => `€${n.toFixed(2)}`;

interface ReviewScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

export function ReviewScreen({ onBack, onContinue }: ReviewScreenProps) {
  const { selectedBasket, amount, frequency, plan } = usePlanStore();
  
  const grossAmount = amount ?? 0;
  
  // 1% deposit fee calculation
  const depositFee = grossAmount * DEPOSIT_FEE_RATE;
  const netInvestment = grossAmount - depositFee;

  const parsedCoins = useMemo(() => {
    if (!selectedBasket?.coins) return [];
    if (Array.isArray(selectedBasket.coins)) return selectedBasket.coins;
    try {
      return JSON.parse(selectedBasket.coins);
    } catch {
      return [];
    }
  }, [selectedBasket]);

  const coinSummary = parsedCoins
    .map(({ symbol, weight }: { symbol: string; weight: number }) => 
      (weight > 0 ? `${symbol} ${Math.round(weight * 100)}%` : symbol)
    )
    .join(' · ');

  const nextBuyDate = useMemo(() => {
    const today = new Date();
    if (frequency === 'monthly') {
      today.setMonth(today.getMonth() + 1); 
    } else {
      today.setDate(today.getDate() + 7);
    }
    return today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [frequency]);

  return (
    <Screen
      onBack={onBack}
      progress={5 / 7}
      title="Review your plan"
      subtitle="Here's exactly how your money will be invested."
      footer={<Button label="Continue" onPress={onContinue} />}
    >
      <Container>
        <View style={styles.head}>
          <View style={styles.stack}>
            {parsedCoins.slice(0, 3).map(({ symbol }: { symbol: string }, i: number) => (
              <CoinBadge
                key={`${symbol}-${i}`}
                symbol={symbol}
                size={36}
                style={{ marginLeft: i ? -12 : 0, borderWidth: 2, borderColor: '#fff' }}
              />
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{selectedBasket?.name ?? 'No basket selected'}</Text>
            <Text style={styles.meta}>{coinSummary || 'No coins listed'}</Text>
          </View>
        </View>

        <SummaryRows
          rows={[
            ['App Plan', plan?.toUpperCase() ?? 'STARTER'], 
            ['Basket', selectedBasket?.name ?? 'No basket selected'],
            ['Total Deposit', fmtEUR(grossAmount)],
            ['Deposit Fee (1%)', `-${fmtEUR(depositFee)}`],
            ['Amount Invested', fmtEUR(netInvestment)],
            ['Frequency', frequency === 'monthly' ? 'Monthly' : 'Weekly'],
            ['First buy', 'Today'],
            ['Next buy', nextBuyDate], 
          ]}
        />
      </Container>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.t3} />
        <Text style={styles.noteText}>
          A 1% deposit fee ({fmtEUR(depositFee)}) is applied to each deposit. 
          Your monthly app subscription is billed separately.
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