// src/screens/app/DashboardScreen.tsx

import { CoinBadge } from '@/components/ui/CoinBadge';
import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { FloatingTabBar } from '@/components/ui/FloatingTabBar';
import { Screen } from '@/components/ui/Screen';
import { basketById, fmtPct, fmtUSD } from '@/constants/baskets';
import { COLORS, TYPE } from '@/constants/theme';
import { useBalances } from '@/hooks/useBalances';
import { useSubscription } from '@/hooks/useSubscription';
import { usePlanStore } from '@/store/planStore';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface DashboardScreenProps {
  onBuy: () => void;
  onChoosePlan: () => void;
  onWallet: () => void;
  onAsset: (symbol: string) => void;
}

export function DashboardScreen({ onBuy, onChoosePlan, onWallet, onAsset }: DashboardScreenProps) {
  const { holdings, totalValue, unsupportedAssets, isLoading } = useBalances();
  const { plan, status } = useSubscription(); 
  const { basketId, amount: dcaAmount, frequency } = usePlanStore();
  const activeBasket = basketById(basketId);
  
  const [hideBalance, setHideBalance] = useState(false);

  const hasActivePlan = plan && status === 'active';
  const isEmpty = !isLoading && holdings.length === 0;

  const handleBuyPress = () => {
    if (hasActivePlan) onBuy(); 
    else onChoosePlan();
  };

  const tabs = <FloatingTabBar />;

  // --- Loading State ---
  if (isLoading && holdings.length === 0) {
    return (
      <Screen tabs={tabs}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </Screen>
    );
  }

  // --- Empty State (No Wallet / No Holdings) ---
  if (isEmpty) {
    return (
      <Screen tabs={tabs}>
        <View style={styles.head}>
          <View>
            <Text style={styles.label}>Good afternoon</Text>
            <Text style={styles.bigTitle}>Portfolio</Text>
          </View>
        </View>
        <Container>
          <EmptyState
            icon="sparkles-outline"
            title="No investments yet"
            message={hasActivePlan ? "Your first DCA will execute soon. Sit tight!" : "Choose a plan to start investing automatically."}
            action={hasActivePlan ? undefined : "Choose a Plan"}
            onAction={hasActivePlan ? undefined : handleBuyPress}
          />
        </Container>
      </Screen>
    );
  }

  // --- Live Dashboard ---
  return (
    <Screen tabs={tabs}>
      {/* --- Header --- */}
      <View style={styles.head}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../../../assets/images/splash-logo.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.logoText}>NorthernAlley</Text>
        </View>
        <View style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.t1} />
          <View style={styles.notifDot} />
        </View>
      </View>

      <Text style={styles.label}>Good afternoon</Text>
      <Text style={styles.bigTitle}>Portfolio</Text>

      {/* --- NEW: No Active Plan Banner --- */}
      {!hasActivePlan && (
        <Pressable style={styles.upgradeBanner} onPress={onChoosePlan}>
          <View style={styles.upgradeIconWrap}>
            <Ionicons name="rocket-outline" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.upgradeTitle}>Activate your DCA Plan</Text>
            <Text style={styles.upgradeSub}>Choose a plan to start automating your investments.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.accent} />
        </Pressable>
      )}

      {/* --- Total Value & Profit Card --- */}
      <Container style={styles.valueCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[TYPE.big, { color: COLORS.t1, fontSize: 36, letterSpacing: -1 }]}>
            {hideBalance
              ? '••••••'
              : holdings.length > 0 && holdings.every((holding) => holding.usdValue == null)
                ? 'Price unavailable'
                : fmtUSD(totalValue)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hideBalance ? 'Show balance' : 'Hide balance'}
            onPress={() => setHideBalance((hidden) => !hidden)}
          >
            <Ionicons name={hideBalance ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.t3} />
          </Pressable>
        </View>

        <Text style={styles.valueNote}>
          Current known value of tracked Base assets. Historical returns aren’t available yet.
          {unsupportedAssets.length > 0
            ? ` Not tracked on Base: ${unsupportedAssets.join(', ')}.`
            : ''}
        </Text>
      </Container>

      {/* --- Quick Actions --- */}
      <View style={styles.quickActions}>
        <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={handleBuyPress}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.actionTextPrimary}>Buy</Text>
        </Pressable>
        
        <Pressable
          style={[styles.actionBtnSecondary, styles.actionBtnDisabled]}
          disabled
          onPress={() => undefined}
        >
          <Ionicons name="swap-horizontal" size={20} color={COLORS.t1} />
          <Text style={styles.actionTextSecondary}>Swap</Text>
        </Pressable>

        <Pressable style={styles.actionBtnSecondary} onPress={onWallet}>
          <Ionicons name="arrow-down" size={20} color={COLORS.t1} />
          <Text style={styles.actionTextSecondary}>Receive</Text>
        </Pressable>
      </View>

      {/* --- Recurring Buy (DCA) Card --- */}
      <Container style={styles.dcaCard}>
        <View style={styles.dcaLeft}>
          <View style={styles.dcaIconWrap}>
            <Ionicons name="calendar" size={20} color={COLORS.accent} />
          </View>
          <View>
            <Text style={styles.dcaTitle}>Recurring buy (DCA)</Text>
            <Text style={styles.dcaSub}>
              {fmtUSD(dcaAmount || 0)} · {frequency} · {hasActivePlan ? 'Active' : 'Not active'}
            </Text>
          </View>
        </View>
        <View
          accessibilityRole="switch"
          accessibilityState={{ checked: !!hasActivePlan, disabled: true }}
          style={[styles.toggle, hasActivePlan && styles.toggleActive]}
        >
          <View style={[styles.toggleKnob, hasActivePlan && styles.toggleKnobActive]} />
        </View>
      </Container>

      {/* --- Your Basket Section --- */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Your basket</Text>
        <Pressable onPress={handleBuyPress}>
          <Text style={styles.sectionAction}>Manage</Text>
        </Pressable>
      </View>

      <Pressable style={styles.basketCard} onPress={handleBuyPress}>
        <View style={styles.basketIconWrap}>
          <Ionicons name="layers" size={24} color={COLORS.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.basketTitle}>{activeBasket?.name || 'No Basket Selected'}</Text>
          <Text style={styles.basketSub}>
             {activeBasket?.coins?.join(' · ') || 'Tap to choose a basket'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.t3} />
      </Pressable>

      {/* --- Assets List --- */}
      <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Assets</Text>
      
      <Container flush style={{ paddingHorizontal: 0 }}>
        {holdings.map((h, i) => (
          <Pressable 
            key={h.symbol} 
            style={[styles.assetRow, i === holdings.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() => onAsset(h.symbol)}
          >
            <View style={styles.assetLeft}>
              <CoinBadge symbol={h.symbol} size={40} />
              <View>
                <Text style={styles.assetName}>
                  {h.symbol === 'ETH' ? 'Ethereum (ETH)' : h.symbol === 'USDC' ? 'USD Coin (USDC)' : `${h.symbol}`}
                </Text>
                <Text style={styles.assetSub}>
                  {h.usdValue == null
                    ? `${h.amount.toFixed(4)} ${h.symbol} · Price unavailable`
                    : `${(totalValue > 0 ? (h.usdValue / totalValue) * 100 : 0).toFixed(1)}% · ${h.amount.toFixed(4)} ${h.symbol}`}
                </Text>
              </View>
            </View>
            
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.assetValue}>
                {h.usdValue == null ? 'Price unavailable' : fmtUSD(h.usdValue)}
              </Text>
              {h.change24h != null && (
                <Text style={[styles.assetChange, { color: h.change24h >= 0 ? COLORS.up : COLORS.down }]}>
                  {h.change24h >= 0 ? '▲' : '▼'} {fmtPct(Math.abs(h.change24h))}
                </Text>
              )}
            </View>
          </Pressable>
        ))}
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logoWrap: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', backgroundColor: COLORS.accent },
  logoImage: { width: 32, height: 32 },
  logoText: { fontSize: 18, fontWeight: '700', color: COLORS.t1, letterSpacing: -0.5 },
  iconBtn: { position: 'relative' },
  notifDot: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.up, borderWidth: 2, borderColor: COLORS.bg },
  
  label: { fontSize: 14, color: COLORS.t2, fontWeight: '500', marginBottom: 4 },
  bigTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, color: COLORS.t1, marginBottom: 16 },
  
  // --- NEW: Upgrade Banner Styles ---
  upgradeBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.accentSoft, 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
  },
  upgradeIconWrap: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: COLORS.accent, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 12,
  },
  upgradeTitle: { fontSize: 16, fontWeight: '700', color: COLORS.accentText, marginBottom: 2 },
  upgradeSub: { fontSize: 13, color: COLORS.t2, lineHeight: 18 },

  valueCard: { padding: 20, borderRadius: 24 },
  valueNote: { fontSize: 13, color: COLORS.t2, marginTop: 8, lineHeight: 18 },

  quickActions: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 24 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 26, gap: 6 },
  actionBtnPrimary: { backgroundColor: COLORS.accent },
  actionBtnSecondary: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line },
  actionBtnDisabled: { opacity: 0.45 },
  actionTextPrimary: { fontSize: 15, fontWeight: '600', color: '#fff' },
  actionTextSecondary: { fontSize: 15, fontWeight: '600', color: COLORS.t1 },

  dcaCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 20, marginBottom: 24 },
  dcaLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dcaIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  dcaTitle: { fontSize: 15, fontWeight: '600', color: COLORS.t1 },
  dcaSub: { fontSize: 13, color: COLORS.t2, marginTop: 2 },
  
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: COLORS.soft, padding: 2, justifyContent: 'center' },
  toggleActive: { backgroundColor: COLORS.accent },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },
  toggleKnobActive: { alignSelf: 'flex-end' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.t1 },
  sectionAction: { fontSize: 14, fontWeight: '600', color: COLORS.accent },

  basketCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 16, borderRadius: 20, gap: 12, borderWidth: 1, borderColor: COLORS.line },
  basketIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  basketTitle: { fontSize: 16, fontWeight: '600', color: COLORS.t1 },
  basketSub: { fontSize: 13, color: COLORS.t2, marginTop: 4 },

  assetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  assetLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  assetName: { fontSize: 16, fontWeight: '600', color: COLORS.t1 },
  assetSub: { fontSize: 13, color: COLORS.t2, marginTop: 2 },
  assetValue: { fontSize: 16, fontWeight: '600', color: COLORS.t1 },
  assetChange: { fontSize: 13, fontWeight: '600', marginTop: 2 },
});