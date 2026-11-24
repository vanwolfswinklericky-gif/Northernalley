// src/components/ui/FloatingTabBar.tsx

import { COLORS, RADIUS, TAB_BAR_HEIGHT } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TABS = [
  { key: 'dashboard', label: 'Home', icon: 'home-outline', iconOn: 'home', route: '/(app)/(tabs)/dashboard' },
  { key: 'performance', label: 'Performance', icon: 'trending-up-outline', iconOn: 'trending-up', route: '/(app)/(tabs)/performance' },
  { key: 'activity', label: 'Activity', icon: 'receipt-outline', iconOn: 'receipt', route: '/(app)/(tabs)/activity' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', iconOn: 'settings', route: '/(app)/(tabs)/settings' },
] as const;

export function FloatingTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Determine which tab is currently active based on the route
  const activeKey = TABS.find((t) => pathname.includes(t.key))?.key || 'dashboard';

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={[styles.bar, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
        {TABS.map((t) => {
          const on = activeKey === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => router.replace(t.route)}
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
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  bar: {
    width: '100%',
    height: TAB_BAR_HEIGHT,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  tab: {
    flex: 1,
    height: 56,
    borderRadius: RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabOn: { backgroundColor: COLORS.accentSoft },
  label: { fontSize: 11, fontWeight: '500', color: COLORS.t3 },
  labelOn: { color: COLORS.accentText, fontWeight: '600' },
});