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
    alignItems: 'center', // Changed from baseline for cleaner alignment
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line, // Using theme color instead of hardcoded #F0F0F0
  },
  last: { 
    borderBottomWidth: 0 
  },
  key: { 
    fontSize: 14, 
    color: COLORS.t2,
    fontWeight: '500', // Added weight for better readability
    flex: 1, // Ensures the key takes available space and doesn't push the value
  },
  value: { 
    fontSize: 15, 
    fontWeight: '700', // Bolder value for the "receipt" look
    color: COLORS.t1, 
    textAlign: 'right',
  },
});