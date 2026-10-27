// src/components/ui/CoinBadge.tsx

import { StyleSheet, Text, View } from 'react-native';

const TINT: Record<string, number> = {
  BTC: 60, ETH: 270, SOL: 300, BNB: 85, ADA: 250,
  XRP: 230, DOT: 340, AVAX: 25, LINK: 255, JUP: 160,
  RAY: 200, MIN: 180,
};

interface CoinBadgeProps {
  symbol: string;
  size?: number;
  style?: any;
}

export function CoinBadge({ symbol, size = 40, style }: CoinBadgeProps) {
  const hue = TINT[symbol] ?? 220;
  const bg = `hsl(${hue}, 30%, 94%)`;
  const fg = `hsl(${hue}, 30%, 38%)`;

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <Text style={{ color: fg, fontSize: size * 0.3, fontWeight: '700', letterSpacing: -0.5 }}>
        {symbol.slice(0, 3)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
});