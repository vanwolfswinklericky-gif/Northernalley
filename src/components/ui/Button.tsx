// src/components/ui/Button.tsx

import { COLORS, RADIUS, TYPE } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  small?: boolean;
  style?: any;
}

export function Button({
  label,
  onPress,
  variant = 'accent', // Defaults to blue
  disabled,
  loading,
  icon,
  small,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Text color: white for blue/black buttons, colored for others
  const textColor =
    variant === 'primary' || variant === 'accent'
      ? '#FFFFFF'
      : variant === 'danger'
        ? COLORS.danger
        : COLORS.t1;

  // Background color: Both primary and accent are now blue
  const bgColor =
    variant === 'primary' || variant === 'accent'
      ? COLORS.accent
      : variant === 'secondary'
        ? COLORS.soft
        : 'transparent';

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bgColor },
        small && styles.small,
        isDisabled && styles.disabled,
        pressed && !isDisabled && { transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.row}>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={textColor}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={[
              styles.label,
              { color: textColor },
              small && { fontSize: 14 },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: RADIUS.full,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    height: 44,
    paddingHorizontal: 20,
    width: 'auto',
    alignSelf: 'flex-start',
  },
  disabled: {
    opacity: 0.28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    ...TYPE.pill,
  },
});