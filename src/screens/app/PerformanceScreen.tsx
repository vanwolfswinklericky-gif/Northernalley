// src/screens/app/PerformanceScreen.tsx

import { Container } from '@/components/ui/Container';
import { FloatingTabBar } from '@/components/ui/FloatingTabBar';
import { LineChart, makeSeries } from '@/components/ui/LineChart';
import { Pills } from '@/components/ui/Pills';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fmtPct, fmtUSD } from '@/constants/baskets';
import { COLORS, TYPE } from '@/constants/theme';
import { useBalances } from '@/hooks/useBalances';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface PerformanceScreenProps {
  onTab: (key: string) => void;
}

const SHADES = ['#0A0A0A', '#4B4B4B', '#9CA3AF', '#D4D6DA', '#E5E5E5'];

export function PerformanceScreen({ onTab }: PerformanceScreenProps) {
  const { holdings, totalValue } = useBalances();
  const [range, setRange] = useState('1Y');

  const seedMap: Record<string, [number, number]> = {
    '1W': [3, 20],
    '1M': [8, 30],
    '1Y': [5, 60],
    All: [9, 80],
  };
  const [seed, n] = seedMap[range];

  const stats: [string, number][] = [
    ['1M', 3.42],
    ['1Y', 28.9],
    ['All Time', 12.6],
  ];

  const tabs = <FloatingTabBar active="performance" onChange={onTab} />;

  return (
    <Screen title="Performance" tabs={tabs}>
      <Container>
        <Text style={styles.label}>Total value</Text>
        <Text style={[TYPE.big, { fontSize: 36, color: COLORS.t1, marginTop: 4 }]}>
          {fmtUSD(totalValue)}
        </Text>

        <View style={{ marginHorizontal: -4, marginVertical: 20 }}>
          <LineChart data={makeSeries(seed, n, 0.005, 0.045)} height={180} />
        </View>

        <Pills seg options={['1W', '1M', '1Y', 'All']} value={range} onChange={setRange} />
      </Container>

      <View style={styles.statsRow}>
        {stats.map(([k, v]) => (
          <Container key={k} style={styles.statCard}>
            <Text style={styles.statLabel}>{k}</Text>
            <Text
              style={[
                styles.statValue,
                { color: v >= 0 ? COLORS.up : COLORS.down },
              ]}
            >
              {fmtPct(v)}
            </Text>
          </Container>
        ))}
      </View>

      <SectionHeader title="Allocation" />

      <Container>
        <View style={styles.bar}>
          {holdings.map((h, i) => (
            <View
              key={h.symbol}
              style={{ flex: h.usdValue, backgroundColor: SHADES[i % SHADES.length] }}
            />
          ))}
        </View>

        <View style={styles.legend}>
          {holdings.map((h, i) => {
            const pct = totalValue > 0 ? (h.usdValue / totalValue) * 100 : 0;
            return (
              <View key={h.symbol} style={styles.legendRow}>
                <View
                  style={[styles.legendDot, { backgroundColor: SHADES[i % SHADES.length] }]}
                />
                <Text style={styles.legendName}>{h.symbol}</Text>
                <Text style={styles.legendPct}>{pct.toFixed(1)}%</Text>
              </View>
            );
          })}
        </View>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, color: COLORS.t2, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  statCard: { flex: 1, padding: 16 },
  statLabel: { fontSize: 12, color: COLORS.t2, fontWeight: '500' },
  statValue: { fontSize: 18, fontWeight: '600', marginTop: 4, letterSpacing: -0.36 },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
    gap: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
    gap: 12,
  },
  legendRow: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendName: { flex: 1, fontSize: 14, color: COLORS.t1 },
  legendPct: { fontSize: 14, fontWeight: '600', color: COLORS.t1 },
});