// src/components/ui/ListRow.tsx

import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ListRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  valueSub?: string;
  valueTone?: 'up' | 'down';
  chevron?: boolean;
  onPress?: () => void;
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
  danger?: boolean;
  last?: boolean;
}

export function ListRow({
  icon,
  iconColor,
  leading,
  title,
  subtitle,
  value,
  valueSub,
  valueTone,
  chevron,
  onPress,
  toggle,
  onToggle,
  danger,
  last,
}: ListRowProps) {
  const inner = (
    <View style={[styles.row, !last && styles.divider]}>
      {leading ??
        (icon && (
          <View style={styles.iconBox}>
            <Ionicons
              name={icon}
              size={20}
              color={iconColor ?? (danger ? COLORS.danger : COLORS.t1)}
            />
          </View>
        ))}
      <View style={styles.main}>
        <Text
          style={[styles.title, danger && { color: COLORS.danger }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.sub} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {(value || valueSub) && (
        <View style={styles.valueBox}>
          {value && <Text style={styles.value}>{value}</Text>}
          {valueSub && (
            <Text
              style={[
                styles.valueSub,
                valueTone === 'up' && { color: COLORS.up },
                valueTone === 'down' && { color: COLORS.down },
              ]}
            >
              {valueSub}
            </Text>
          )}
        </View>
      )}
      {toggle !== undefined && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onToggle?.(!toggle);
          }}
          style={[styles.switch, toggle && styles.switchOn]}
        >
          <View style={[styles.knob, toggle && { transform: [{ translateX: 18 }] }]} />
        </Pressable>
      )}
      {chevron && <Ionicons name="chevron-forward" size={18} color={COLORS.t3} />}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{inner}</Pressable>;
  }
  return inner;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 64,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.15,
    color: COLORS.t1,
  },
  sub: {
    fontSize: 13,
    color: COLORS.t2,
    marginTop: 2,
  },
  valueBox: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.15,
    color: COLORS.t1,
  },
  valueSub: {
    fontSize: 13,
    color: COLORS.t2,
    marginTop: 2,
  },
  switch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E3E4E7',
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: COLORS.t1,
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
  },
});