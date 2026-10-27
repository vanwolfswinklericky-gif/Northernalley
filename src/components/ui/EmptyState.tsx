// src/components/ui/EmptyState.tsx

import { Button } from '@/components/ui/Button';
import { COLORS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'file-tray-outline', title, message, action, onAction }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={26} color={COLORS.t2} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.msg}>{message}</Text>}
      {action && (
        <View style={{ marginTop: 12 }}>
          <Button label={action} variant="secondary" small onPress={onAction} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: SPACING.s6,
    paddingHorizontal: SPACING.s4,
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.soft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.t1 },
  msg: { fontSize: 14, color: COLORS.t2, textAlign: 'center', maxWidth: 260, lineHeight: 20 },
});