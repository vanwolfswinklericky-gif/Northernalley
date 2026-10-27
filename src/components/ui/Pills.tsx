// src/components/ui/Pills.tsx

import { COLORS, RADIUS } from '@/constants/theme';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface PillsProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  seg?: boolean;
}

export function Pills({ options, value, onChange, seg }: PillsProps) {
  if (seg) {
    return (
      <View style={styles.segWrap}>
        {options.map((o) => (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={[styles.segBtn, value === o && styles.segBtnOn]}
          >
            <Text style={[styles.segText, value === o && styles.segTextOn]}>{o}</Text>
          </Pressable>
        ))}
      </View>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((o) => (
        <Pressable
          key={o}
          onPress={() => onChange(o)}
          style={[styles.pill, value === o && styles.pillOn]}
        >
          <Text style={[styles.text, value === o && styles.textOn]}>{o}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  pill: {
    height: 40, paddingHorizontal: 18, borderRadius: RADIUS.full,
    backgroundColor: COLORS.soft,
    alignItems: 'center', justifyContent: 'center',
  },
  pillOn: { backgroundColor: COLORS.t1 },
  text: { fontSize: 14, fontWeight: '500', color: COLORS.t2 },
  textOn: { color: '#fff' },
  segWrap: {
    flexDirection: 'row',
    backgroundColor: COLORS.soft,
    borderRadius: RADIUS.full,
    padding: 4,
  },
  segBtn: {
    flex: 1, height: 34, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
  },
  segBtnOn: { backgroundColor: '#fff' },
  segText: { fontSize: 13, fontWeight: '500', color: COLORS.t2 },
  segTextOn: { color: COLORS.t1 },
});