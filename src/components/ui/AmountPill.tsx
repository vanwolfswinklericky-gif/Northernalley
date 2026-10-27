// src/components/ui/AmountPill.tsx

import { COLORS, RADIUS, SHADOW } from '@/constants/theme';
import { Pressable, StyleSheet, Text } from 'react-native';

interface AmountPillProps {
  amount: number;
  selected: boolean;
  onPress: () => void;
  tag?: string;
}

export function AmountPill({ amount, selected, onPress, tag }: AmountPillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        selected && styles.pillSelected,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <Text style={styles.value}>${amount}</Text>
      <Text style={styles.tag}>{tag ?? 'per month'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexBasis: '48%',
    height: 104,
    borderRadius: RADIUS.xxl,
    backgroundColor: COLORS.soft,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pillSelected: {
    backgroundColor: '#fff',
    borderColor: COLORS.t1,
    ...SHADOW,
  },
  value: { fontSize: 26, fontWeight: '600', letterSpacing: -0.78, color: COLORS.t1 },
  tag: { fontSize: 12, color: COLORS.t2 },
});