// components/layout/Screen.tsx

import { BASE_WIDTH, COLORS, SPACING } from '@/constants/theme';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
}

/**
 * Responsive screen shell.
 * - Applies black background
 * - Handles safe area (notch, status bar, home indicator)
 * - Scales horizontal padding based on screen width
 * - Caps padding on tablets so content doesn't stretch awkwardly
 */
export function Screen({ children }: ScreenProps) {
  const { width } = useWindowDimensions();

  // Tablet detection: width >= 768 is iPad/Android tablet territory
  const isTablet = width >= 768;

  // Responsive horizontal padding:
  // - On phones: scales gently with screen width
  // - On tablets: fixed comfortable padding, capped
  const horizontalPadding = isTablet
    ? SPACING.xl
    : Math.max(SPACING.md, (width / BASE_WIDTH) * SPACING.md);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});