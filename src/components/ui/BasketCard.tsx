// src/components/ui/BasketCard.tsx

import { CoinBadge } from '@/components/ui/CoinBadge';
import { Container } from '@/components/ui/Container';
import type { Basket } from '@/constants/baskets';
import { COLORS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface BasketCardProps {
  basket: Basket;
  selected: boolean;
  onPress: () => void;
}

export function BasketCard({ basket, selected, onPress }: BasketCardProps) {
  return (
    <Container onPress={onPress} selected={selected} style={{ marginBottom: 12 }}>
      <View style={styles.top}>
        <View style={styles.stack}>
          {basket.coins.slice(0, 3).map((c, i) => (
            <CoinBadge
              key={c}
              symbol={c}
              size={32}
              style={{
                marginLeft: i ? -10 : 0,
                borderWidth: 2,
                borderColor: '#fff',
              }}
            />
          ))}
        </View>
        <View style={[styles.check, selected && styles.checkOn]}>
          {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </View>
      <Text style={styles.title}>{basket.name}</Text>
      <Text style={styles.desc}>{basket.description}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>{basket.assets} assets</Text>
        <View style={styles.dot} />
        <Text style={styles.metaText}>{basket.risk}</Text>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s3,
  },
  stack: { flexDirection: 'row' },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.27,
    color: COLORS.t1,
  },
  desc: {
    fontSize: 14,
    color: COLORS.t2,
    lineHeight: 20,
    marginTop: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.s3,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.t3,
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.t3,
  },
});