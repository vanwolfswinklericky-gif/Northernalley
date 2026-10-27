// src/components/ui/SummaryRows.tsx

import { COLORS } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

interface SummaryRowsProps {
  rows: [string, string][];
}

export function SummaryRows({ rows }: SummaryRowsProps) {
  return (
    <View>
      {rows.map(([k, v], i) => (
        <View key={k} style={[styles.row, i === rows.length - 1 && styles.last]}>
          <Text style={styles.key}>{k}</Text>
          <Text style={styles.value}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  last: { borderBottomWidth: 0 },
  key: { fontSize: 15, color: COLORS.t2 },
  value: { fontSize: 15, fontWeight: '600', color: COLORS.t1, textAlign: 'right' },
});