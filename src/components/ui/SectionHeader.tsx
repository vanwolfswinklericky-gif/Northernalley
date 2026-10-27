// src/components/ui/SectionHeader.tsx

import { COLORS, SPACING } from '@/constants/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title.toUpperCase()}</Text>
      {action && (
        <Pressable onPress={onAction}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.s5,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.t2,
    letterSpacing: 0.78,
  },
  action: { fontSize: 14, fontWeight: '600', color: COLORS.t1 },
});