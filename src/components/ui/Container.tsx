// src/components/ui/Container.tsx

import { COLORS, RADIUS, SHADOW } from '@/constants/theme';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface ContainerProps {
  children: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  flush?: boolean;
  style?: any;
}

export function Container({
  children,
  onPress,
  selected,
  flush,
  style,
}: ContainerProps) {
  const inner = (
    <View
      style={[
        styles.card,
        flush && styles.flush,
        selected && styles.selected,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && { transform: [{ scale: 0.99 }] }]}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOW,
  },
  flush: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  selected: {
    borderColor: COLORS.accent,   // ← was COLORS.t1
  },
});