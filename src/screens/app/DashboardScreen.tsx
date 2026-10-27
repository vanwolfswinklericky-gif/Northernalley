// src/screens/app/DashboardScreen.tsx

import { CoinBadge } from '@/components/ui/CoinBadge';
import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { FloatingTabBar } from '@/components/ui/FloatingTabBar';
import { LineChart, makeSeries } from '@/components/ui/LineChart';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { basketById, fmtPct, fmtUSD } from '@/constants/baskets';
import { COLORS, TYPE } from '@/constants/theme';
import { useBalances } from '@/hooks/useBalances';
import { useSubscription } from '@/hooks/useSubscription';
import { usePlanStore } from '@/store/planStore';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface DashboardScreenProps {
  onBuy: () => void;
  onWallet: () => void;
  onAsset: (symbol: string) => void;
  onTab: (key: string) => void;
}

export function DashboardScreen({ onBuy, onWallet, onAsset, onTab }: DashboardScreenProps) {
  const { holdings, totalValue, isLoading } = useBalances();
  const { plan } = useSubscription();
  const { basketId, amount: dcaAmount } = usePlanStore();
  const activeBasket = basketById(basketId);

  // --- Simulated Profit/Loss (Replace with real cost basis from DB later) ---
  const totalInvested = totalValue * 0.85; // Simulating that they are up 15%
  const totalProfit = totalValue - totalInvested;
  const profitPct = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const isPositive = totalProfit >= 0;

  // --- Best Performer ---
  const bestPerformer = holdings.length > 0 
    ? [...holdings].sort((a, b) => b.change24h - a.change24h)[0] 
    : null;

  // --- Next Buy Date (Simulated: 1st of next month) ---
  const nextBuyDate = new Date();
  nextBuyDate.setMonth(nextBuyDate.getMonth() + 1, 1);
  const nextBuyStr = nextBuyDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const tabs = <FloatingTabBar active="dashboard" onChange={onTab} />;

  if (isLoading && holdings.length === 0) {
    return (
      <Screen tabs={tabs}>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accent} />
        </View>
      </Screen>
    );
  }

  if (holdings.length === 0) {
    return (
      <Screen tabs={tabs}>
        <View style={styles.head}>
          <View>
            <Text style={styles.label}>Good morning</Text>
            <Text style={styles.name}>Welcome to Northernalley</Text>
          </View>
        </View>
        <Container>
          <EmptyState
            icon="sparkles-outline"
            title="No investments yet"
            message={plan ? "Your first DCA will execute soon." : "Choose a plan to start investing automatically."}
            action={plan ? undefined : "Choose a Plan"}
            onAction={plan ? undefined : onBuy}
          />
        </Container>
      </Screen>
    );
  }

  return (
    <Screen tabs={tabs}>
      {/* --- Header --- */}
      <View style={styles.head}>
        <View>
          <Text style={styles.label}>Good morning</Text>
          <Text style={styles.name}>Your Portfolio</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.accent} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={onWallet}>
            <Ionicons name="wallet-outline" size={20} color={COLORS.accent} />
          </Pressable>
        </View>
      </View>

      {/* --- Total Value & Profit Card --- */}
      <Container>
        <Text style={styles.label}>Total value</Text>
        <Text style={[TYPE.big, { color: COLORS.t1, marginTop: 6 }]}>
          {fmtUSD(totalValue)}
        </Text>

        <View style={styles.chipRow}>
          <View style={[styles.chip, isPositive ? styles.chipUp : styles.chipDown]}>
            <Ionicons 
              name={isPositive ? 'trending-up' : 'trending-down'} 
              size={14} 
              color={isPositive ? COLORS.up : COLORS.down} 
            />
            <Text style={[styles.chipText, { color: isPositive ? COLORS.up : COLORS.down }]}>
              {isPositive ? '+' : ''}{fmtUSD(totalProfit)} ({fmtPct(profitPct)})
            </Text>
          </View>
          <Text style={styles.chipNote}>
            Invested: {fmtUSD(totalInvested)}
          </Text>
        </View>

        <View style={{ marginHorizontal: -4, marginTop: 20 }}>
          <LineChart data={makeSeries(5, 50, 0.005, 0.04)} height={90} />
        </View>
      </Container>

      {/* --- Active Plan Card --- */}
      <Container style={{ marginTop: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={styles.label}>Active Plan</Text>
            <Text style={styles.planName}>{activeBasket?.name || 'No Basket'}</Text>
            <Text style={styles.planDetail}>
              {plan ? `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan` : 'No Plan'} · ${dcaAmount || 0}/mo
            </Text>
          </View>
          <View style={styles.nextBuyChip}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.accent} />
            <Text style={styles.nextBuyText}>Next: {nextBuyStr}</Text>
          </View>
        </View>
      </Container>

      {/* --- Quick Actions --- */}
      <View style={styles.quickActions}>
        <Pressable style={styles.actionBtn} onPress={onBuy}>
          <View style={styles.actionIconWrap}>
            <Ionicons name="add" size={22} color={COLORS.accent} />
          </View>
          <Text style={styles.actionText}>Deposit</Text>
        </Pressable>
        
        <Pressable style={styles.actionBtn} onPress={onWallet}>
          <View style={styles.actionIconWrap}>
            <Ionicons name="arrow-up" size={22} color={COLORS.accent} />
          </View>
          <Text style={styles.actionText}>Withdraw</Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={() => onTab('activity')}>
          <View style={styles.actionIconWrap}>
            <Ionicons name="time" size={22} color={COLORS.accent} />
          </View>
          <Text style={styles.actionText}>History</Text>
        </Pressable>
      </View>

      {/* --- Allocation Bar --- */}
      <View style={{ marginTop: 24, marginBottom: 8, paddingHorizontal: 4 }}>
        <Text style={[styles.label, { marginBottom: 8 }]}>Allocation</Text>
        <View style={styles.allocationBar}>
          {holdings.map((h, i) => {
            const pct = totalValue > 0 ? (h.usdValue / totalValue) * 100 : 0;
            // Alternate colors for the bar
            const colors = [COLORS.accent, COLORS.up, '#F59E0B', '#8B5CF6'];
            return (
              <View 
                key={h.symbol} 
                style={{ flex: pct, backgroundColor: colors[i % colors.length] }} 
              />
            );
          })}
        </View>
      </View>

      {/* --- Holdings List --- */}
      <SectionHeader 
        title="Holdings" 
        action={bestPerformer ? `Top: ${bestPerformer.symbol} (+${bestPerformer.change24h.toFixed(1)}%)` : undefined} 
      />

      <Container flush>
        {holdings.map((h, i) => (
          <ListRow
            key={h.symbol}
            leading={<CoinBadge symbol={h.symbol} />}
            title={h.symbol}
            subtitle={`${h.amount.toFixed(4)} ${h.symbol}`}
            value={fmtUSD(h.usdValue)}
            valueSub={fmtPct(h.change24h)}
            valueTone={h.change24h >= 0 ? 'up' : 'down'}
            onPress={() => onAsset(h.symbol)}
            last={i === holdings.length - 1}
          />
        ))}
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  label: { fontSize: 13, color: COLORS.t2, fontWeight: '500' },
  name: { fontSize: 24, fontWeight: '600', letterSpacing: -0.48, color: COLORS.t1 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  chipRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  chipUp: { backgroundColor: COLORS.upSoft },
  chipDown: { backgroundColor: COLORS.downSoft },
  chipText: { fontSize: 13, fontWeight: '600' },
  chipNote: { fontSize: 13, color: COLORS.t3 },
  
  planName: { fontSize: 18, fontWeight: '600', color: COLORS.t1, marginTop: 4 },
  planDetail: { fontSize: 13, color: COLORS.t2, marginTop: 2 },
  nextBuyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  nextBuyText: { fontSize: 12, fontWeight: '600', color: COLORS.accentText },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  actionText: { fontSize: 13, fontWeight: '500', color: COLORS.t1 },

  allocationBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 2,
  },
});