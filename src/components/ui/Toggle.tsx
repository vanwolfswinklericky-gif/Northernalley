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
    width: 44, 
    height: 26, 
    borderRadius: 13,
    backgroundColor: COLORS.soft, // Soft gray for inactive
    justifyContent: 'center',
  },
  trackOn: { 
    backgroundColor: COLORS.accent // Vibrant purple for active
  },
  knob: {
    width: 20, 
    height: 20, 
    borderRadius: 10,
    backgroundColor: '#fff', 
    marginLeft: 3,
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2, // Added for Android shadow
  },
});