// src/components/ui/FloatingTabBar.tsx

import { COLORS, RADIUS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export const TABS = [
  { key: 'dashboard', label: 'Home', icon: 'home-outline', iconOn: 'home' },
  { key: 'performance', label: 'Performance', icon: 'trending-up-outline', iconOn: 'trending-up' },
  { key: 'activity', label: 'Activity', icon: 'receipt-outline', iconOn: 'receipt' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', iconOn: 'settings' },
] as const;

interface FloatingTabBarProps {
  active: string;
  onChange: (k: string) => void;
}

export function FloatingTabBar({ active, onChange }: FloatingTabBarProps) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bar}>
        {TABS.map((t) => {
          const on = active === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              style={[styles.tab, on && styles.tabOn]}
            >
              <Ionicons
                name={(on ? t.iconOn : t.icon) as any}
                size={22}
                color={on ? COLORS.accent : COLORS.t3}
              />
              <Text style={[styles.label, on && styles.labelOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  bar: {
    width: '100%',
    maxWidth: 520,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  tab: {
    flex: 1,
    height: 56,
    borderRadius: RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabOn: { backgroundColor: COLORS.accentSoft },
  label: { fontSize: 11, fontWeight: '500', color: COLORS.t3 },
  labelOn: { color: COLORS.accentText, fontWeight: '600' },
});