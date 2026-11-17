// src/components/ui/BasketCard.tsx

import { CoinBadge } from '@/components/ui/CoinBadge';
import { COLORS, RADIUS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Coin {
  symbol: string;
  weight: number;
}

interface Basket {
  id: string;
  name: string;
  description: string;
  coins: string | Coin[];
  type: string;
  recommended?: boolean;
}

interface BasketCardProps {
  basket: Basket;
  selected: boolean;
  onPress: () => void;
}

function isCoin(value: unknown): value is Coin {
  return (
    typeof value === 'object' &&
    value !== null &&
    'symbol' in value &&
    typeof value.symbol === 'string' &&
    'weight' in value &&
    typeof value.weight === 'number' &&
    Number.isFinite(value.weight) &&
    value.weight >= 0
  );
}

export function BasketCard({ basket, selected, onPress }: BasketCardProps) {
  let parsedCoins: unknown = basket.coins;
  try {
    if (typeof basket.coins === 'string') parsedCoins = JSON.parse(basket.coins);
  } catch {
    parsedCoins = [];
  }
  const coins = Array.isArray(parsedCoins) ? parsedCoins.filter(isCoin) : [];

  const totalWeight = coins.reduce((sum, coin) => sum + coin.weight, 0) || 1;
  const normalizedCoins = coins
    .map((c) => ({ symbol: c.symbol, weight: Math.round((c.weight / totalWeight) * 100) }))
    .sort((a, b) => b.weight - a.weight); 

  // Show top 4 coins, group the rest
  const displayCoins = normalizedCoins.slice(0, 4);
  const remainingCount = normalizedCoins.length - displayCoins.length;
  const remainingWeight = normalizedCoins.slice(4).reduce((sum, c) => sum + c.weight, 0);

  return (
    <Pressable onPress={onPress}>
      <View style={[styles.card, selected && styles.cardSelected]}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
            <Ionicons name="layers" size={24} color={selected ? '#fff' : COLORS.accent} />
          </View>
          
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{basket.name}</Text>
              {basket.recommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
              )}
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {basket.description}
            </Text>
          </View>

          {/* Selection Circle */}
          <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
            {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        </View>

        {/* Live Coin Distribution */}
        <View style={styles.coinRow}>
          {displayCoins.length === 0 && (
            <Text style={styles.coinWeight}>No coin allocation available</Text>
          )}
          {displayCoins.map((c) => (
            <View key={c.symbol} style={styles.coinItem}>
              <CoinBadge symbol={c.symbol} size={32} />
              <Text style={styles.coinSymbol}>{c.symbol}</Text>
              <Text style={styles.coinWeight}>{c.weight}%</Text>
            </View>
          ))}

          {remainingCount > 0 && (
            <View style={styles.coinItem}>
              <View style={styles.moreBadge}>
                <Text style={styles.moreText}>...</Text>
              </View>
              <Text style={styles.coinSymbol}>+{remainingCount} others</Text>
              <Text style={styles.coinWeight}>({remainingWeight}%)</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSoft, 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: COLORS.accent,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.t1,
    letterSpacing: -0.3,
  },
  recommendedBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 13,
    color: COLORS.t2,
    lineHeight: 18,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  coinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  coinItem: {
    alignItems: 'center',
    gap: 4,
  },
  coinSymbol: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.t1,
  },
  coinWeight: {
    fontSize: 11,
    color: COLORS.t2,
  },
  moreBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.t3,
    marginTop: -8,
  },
});