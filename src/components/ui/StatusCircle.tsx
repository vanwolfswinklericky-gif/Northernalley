// src/components/ui/StatusCircle.tsx

import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

interface StatusCircleProps {
  kind: 'ok' | 'err';
}

export function StatusCircle({ kind }: StatusCircleProps) {
  return (
    <View
      style={[
        styles.circle,
        { backgroundColor: kind === 'ok' ? COLORS.up : COLORS.down },
      ]}
    >
      <Ionicons
        name={kind === 'ok' ? 'checkmark' : 'alert'}
        size={40}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});