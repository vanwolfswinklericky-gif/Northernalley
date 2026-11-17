// src/components/ui/StatusCircle.tsx

import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

interface StatusCircleProps {
  kind: 'ok' | 'err';
}

export function StatusCircle({ kind }: StatusCircleProps) {
  const isOk = kind === 'ok';
  const color = isOk ? COLORS.up : COLORS.danger;

  return (
    <View
      style={[
        styles.circle,
        { 
          backgroundColor: color,
          shadowColor: color,
        },
      ]}
    >
      <Ionicons
        name={isOk ? 'checkmark' : 'close'}
        size={44}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    // Premium glow shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});