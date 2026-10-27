// src/components/ui/Toggle.tsx

import { COLORS } from '@/constants/theme';
import { Pressable, StyleSheet, View } from 'react-native';

interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ value, onChange }: ToggleProps) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={[styles.track, value && styles.trackOn]}
    >
      <View style={[styles.knob, value && { transform: [{ translateX: 18 }] }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: '#E3E4E7',
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: COLORS.t1 },
  knob: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff', marginLeft: 3,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
});