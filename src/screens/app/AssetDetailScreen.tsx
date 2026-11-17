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
import { COLORS, RADIUS, TYPE } from '@/constants/theme';
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
  XRP: 'XRP',
  ADA: 'Cardano',
  AVAX: 'Avalanche',
  LINK: 'Chainlink',
  DOT: 'Polkadot',
};

export function AssetDetailScreen({ symbol, onBack, onBuyMore }: AssetDetailScreenProps) {
  const { holdings, totalValue } = useBalances();
  const [range, setRange] = useState('1M');

  // Find the live data for this specific coin
  const holding = holdings.find((h) => h.symbol === symbol);
  const amount = holding?.amount ?? 0;
  const price = holding?.usdPrice ?? 0;
  const value = holding?.usdValue ?? 0;
  const change = holding?.change24h ?? 0;
  const share = totalValue > 0 ? (value / totalValue) * 100 : 0;
  
  const isPositive = change >= 0;

  // Generate a dummy chart based on the actual change direction
  const chartData = makeSeries(symbol.length + range.length, 50, isPositive ? 0.004 : -0.001, 0.04);

  return (
    <Screen
      onBack={onBack}
      right={
        <Pressable style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="star-outline" size={20} color={COLORS.t1} />
        </Pressable>
      }
      footer={
        <View style={{ paddingBottom: 24 }}>
          <Button label={`Buy More ${symbol}`} onPress={onBuyMore} variant="accent" />
        </View>
      }
    >
      {/* --- Header --- */}
      <View style={styles.header}>
        <CoinBadge symbol={symbol} size={56} />
        <View style={{ flex: 1 }}>
          <Text style={styles.coinName}>{COIN_NAMES[symbol] ?? symbol}</Text>
          <Text style={styles.symbol}>{symbol}</Text>
        </View>
      </View>

      {/* --- Live Price Hero --- */}
      <View style={styles.hero}>
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveLabel}>Live price</Text>
        </View>
        <Text style={[TYPE.big, styles.price]}>{fmtUSD(price)}</Text>
        
        <View style={[styles.chip, isPositive ? styles.chipUp : styles.chipDown]}>
          <Ionicons 
            name={isPositive ? 'trending-up' : 'trending-down'} 
            size={14} 
            color={isPositive ? COLORS.up : COLORS.down} 
          />
          <Text style={[styles.chipText, { color: isPositive ? COLORS.up : COLORS.down }]}>
            {fmtPct(change)} today
          </Text>
        </View>
      </View>

      {/* --- Chart --- */}
      <View style={{ marginHorizontal: -16, marginVertical: 24 }}>
        <LineChart data={chartData} height={180} />
      </View>

      {/* --- Timeframe Selector --- */}
      <Pills seg options={['1D', '1W', '1M', '1Y', 'All']} value={range} onChange={setRange} />

      {/* --- Your Holdings --- */}
      <SectionHeader title="Your holdings" />
      
      <Container style={styles.card}>
        <View style={styles.valueRow}>
          <View>
            <Text style={styles.valueLabel}>Current Value</Text>
            <Text style={styles.valueBig}>{fmtUSD(value)}</Text>
          </View>
          <View style={styles.shareBadge}>
            <Text style={styles.shareText}>{share.toFixed(1)}%</Text>
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
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16,
    marginBottom: 32,
  },
  coinName: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: COLORS.t1,
    letterSpacing: -0.5,
  },
  symbol: { 
    fontSize: 14, 
    color: COLORS.t2, 
    fontWeight: '600', 
    marginTop: 2 
  },
  hero: {
    alignItems: 'flex-start',
  },
  liveRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    marginBottom: 4,
  },
  liveDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: COLORS.up 
  },
  liveLabel: { 
    fontSize: 13, 
    color: COLORS.t2, 
    fontWeight: '600' 
  },
  price: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.t1,
    letterSpacing: -1,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  chipUp: { backgroundColor: COLORS.upSoft },
  chipDown: { backgroundColor: COLORS.downSoft },
  chipText: { fontSize: 14, fontWeight: '700' },
  card: {
    padding: 20,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  valueLabel: { 
    fontSize: 13, 
    color: COLORS.t2, 
    fontWeight: '500',
    marginBottom: 4,
  },
  valueBig: { 
    fontSize: 28, 
    fontWeight: '700', 
    letterSpacing: -0.5, 
    color: COLORS.t1 
  },
  shareBadge: {
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shareText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentText,
  },
  divider: { 
    height: 1, 
    backgroundColor: COLORS.line, 
    marginVertical: 20 
  },
});