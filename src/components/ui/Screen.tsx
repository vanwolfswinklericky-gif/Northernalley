// src/components/ui/Screen.tsx

import { COLORS, SPACING, TYPE } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  progress?: number;
  right?: ReactNode;
  footer?: ReactNode;
  tabs?: ReactNode;
  noScroll?: boolean;
}

export function Screen({
  children,
  title,
  subtitle,
  onBack,
  progress,
  right,
  footer,
  tabs,
  noScroll,
}: ScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const pad = isTablet ? 40 : 24;
  const maxW = isTablet ? 680 : undefined;

  const contentStyle = {
    paddingHorizontal: pad,
    paddingTop: SPACING.s3,
    paddingBottom: tabs ? 72 + 16 + 20 + SPACING.s4 : footer ? SPACING.s4 : SPACING.s5,
    maxWidth: maxW,
    width: '100%' as const,
    alignSelf: 'center' as const,
  };

  const showNav = !!(onBack || progress != null || right);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.root}>
        {showNav && (
          <View style={[styles.nav, { maxWidth: maxW, alignSelf: 'center', width: '100%' }]}>
            {onBack ? (
              <Pressable style={styles.iconBtn} onPress={onBack} hitSlop={8}>
                <Ionicons name="chevron-back" size={22} color={COLORS.t1} />
              </Pressable>
            ) : (
              <View style={{ width: 44 }} />
            )}
            {progress != null ? (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            {right ?? <View style={{ width: 44 }} />}
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!noScroll}
        >
          {title && (
            <View style={styles.titleBlock}>
              <Text style={styles.h1}>{title}</Text>
              {subtitle && <Text style={styles.sub}>{subtitle}</Text>}
            </View>
          )}
          {children}
        </ScrollView>

        {footer && (
          <View style={[styles.footer, { paddingHorizontal: pad }]}>
            <View style={{ maxWidth: maxW, alignSelf: 'center', width: '100%', gap: 12 }}>
              {footer}
            </View>
          </View>
        )}

        {tabs}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  root: { flex: 1, backgroundColor: COLORS.bg },
  nav: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s2,
    paddingHorizontal: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#E7E8EB',
    overflow: 'hidden',
    marginHorizontal: SPACING.s2,
  },
  progressFill: { height: '100%', backgroundColor: COLORS.t1, borderRadius: 4 },
  titleBlock: { marginBottom: SPACING.s5 },
  h1: { ...TYPE.h1, color: COLORS.t1 },
  sub: { ...TYPE.sub, marginTop: SPACING.s2 },
   footer: {
    paddingTop: SPACING.s3,
    paddingBottom: SPACING.s3 + 100,
    backgroundColor: COLORS.bg,
  },
});