// src/constants/theme.ts

export const COLORS = {
  bg: '#F5F6F8',
  card: '#FFFFFF',
  t1: '#0A0A0A',
  t2: '#6B6B6B',
  t3: '#9CA3AF',
  line: '#E5E5E5',
  soft: '#EFEFEF',
  up: '#16A34A',
  down: '#DC2626',
  upSoft: '#DCFCE7',
  downSoft: '#FEE2E2',
  danger: '#DC2626',
  accent: '#6366F1',
  accentSoft: '#EEF2FF',
  accentText: '#4338CA',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  s1: 4,
  s2: 8,
  s3: 16,
  s4: 24,
  s5: 32,
  s6: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 12,
  elevation: 2,
} as const;

export const TYPE = {
  h1: { fontSize: 30, fontWeight: '600' as const, letterSpacing: -0.75 },
  h1Lg: { fontSize: 44, fontWeight: '600' as const, letterSpacing: -1.4 },
  h3: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.25 },
  body: { fontSize: 15, fontWeight: '400' as const },
  sub: { fontSize: 15, fontWeight: '400' as const, color: COLORS.t2 },
  label: { fontSize: 13, fontWeight: '500' as const, color: COLORS.t2 },
  big: { fontSize: 44, fontWeight: '600' as const, letterSpacing: -1.6 },
  pill: { fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.16 },
} as const;