// src/screens/app/AssetDetailScreen.tsx

import { Button } from '@/components/ui/Button';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Container } from '@/components/ui/Container';
import { LineChart, makeSeries } from '@/components/ui/LineChart';
import { Pills } from '@/components/ui/Pills';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SummaryRows } from '@/components/ui/SummaryRows';
import { fmtPct, fmtUSD } from '@/constants/baskets';
import { COLORS, TYPE } from '@/constants/theme';
import { useBalances } from '@/hooks/useBalances';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface AssetDetailScreenProps {
  symbol: string;
  onBack: () => void;
  onBuyMore: () => void;
}

const COIN_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  USDC: 'USD Coin',
  BNB: 'BNB',
};

export function AssetDetailScreen({ symbol, onBack, onBuyMore }: AssetDetailScreenProps) {
  const { holdings, totalValue } = useBalances();
  const [range, setRange] = useState('1M');

  const holding = holdings.find((h) => h.symbol === symbol);
  const amount = holding?.amount ?? 0;
  const price = holding?.usdPrice ?? 0;
  const value = holding?.usdValue ?? 0;
  const change = holding?.change24h ?? 0;
  const share = totalValue > 0 ? (value / totalValue) * 100 : 0;

  return (
    <Screen
      onBack={onBack}
      right={
        <Pressable style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="star-outline" size={20} color={COLORS.t1} />
        </Pressable>
      }
      footer={<Button label={`Buy More ${symbol}`} onPress={onBuyMore} />}
    >
      <View style={styles.head}>
        <CoinBadge symbol={symbol} size={44} />
        <View>
          <Text style={styles.coinName}>{COIN_NAMES[symbol] ?? symbol}</Text>
          <Text style={styles.symbol}>{symbol}</Text>
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveLabel}>Live price</Text>
        </View>
        <Text style={[TYPE.big, { color: COLORS.t1, marginTop: 4 }]}>{fmtUSD(price)}</Text>
        <View
          style={[
            styles.chip,
            change >= 0 ? styles.chipUp : styles.chipDown,
            { marginTop: 8 },
          ]}
        >
          <Text style={[styles.chipText, { color: change >= 0 ? COLORS.up : COLORS.down }]}>
            {fmtPct(change)} today
          </Text>
        </View>
      </View>

      <View style={{ marginHorizontal: -4, marginVertical: 24 }}>
        <LineChart
          data={makeSeries(symbol.length + range.length, 50, change > 0 ? 0.004 : -0.001, 0.04)}
          height={170}
        />
      </View>

      <Pills seg options={['1D', '1W', '1M', '1Y', 'All']} value={range} onChange={setRange} />

      <SectionHeader title="Your holdings" />

      <Container>
        <View style={styles.valueRow}>
          <View>
            <Text style={styles.valueLabel}>Value</Text>
            <Text style={styles.valueBig}>{fmtUSD(value)}</Text>
          </View>
          <View style={[styles.chip, styles.chipUp]}>
            <Text style={[styles.chipText, { color: COLORS.up }]}>
              {share.toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <SummaryRows
          rows={[
            ['Quantity', `${amount.toFixed(4)} ${symbol}`],
            ['Price', fmtUSD(price)],
            ['Portfolio share', `${share.toFixed(1)}%`],
          ]}
        />
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coinName: { fontSize: 18, fontWeight: '600', color: COLORS.t1 },
  symbol: { fontSize: 13, color: COLORS.t2, fontWeight: '500', marginTop: 2 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.up },
  liveLabel: { fontSize: 13, color: COLORS.t2, fontWeight: '500' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  chipUp: { backgroundColor: COLORS.upSoft },
  chipDown: { backgroundColor: COLORS.downSoft },
  chipText: { fontSize: 13, fontWeight: '600' },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  valueLabel: { fontSize: 13, color: COLORS.t2, fontWeight: '500' },
  valueBig: { fontSize: 26, fontWeight: '600', letterSpacing: -0.78, color: COLORS.t1, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.line, marginVertical: 16 },
});