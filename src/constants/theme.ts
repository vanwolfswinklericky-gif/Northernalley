// src/constants/theme.ts

export const COLORS = {
  bg: '#F8F9FC',           // Very light, slightly cool gray/white
  card: '#FFFFFF',
  t1: '#111827',           // Deep dark gray/black for text
  t2: '#6B7280',           // Medium gray for secondary text
  t3: '#9CA3AF',           // Light gray for placeholders
  line: '#F3F4F6',         // Very subtle borders
  soft: '#F3F4F6',         // Soft backgrounds for pills/toggles
  
  // Financial Colors
  up: '#10B981',           // Emerald green for gains
  down: '#EF4444',         // Bright red for losses
  upSoft: '#D1FAE5',       
  downSoft: '#FEE2E2',
  danger: '#EF4444',
  
  // --- PURPLE BRAND COLORS (From Screenshot) ---
  accent: '#7C3AED',       // Vibrant Purple (Primary buttons, active states)
  accentSoft: '#F3E8FF',   // Light Purple (Card backgrounds, icons)
  accentMedium: '#C4B5FD', // Medium Purple (Inactive states)
  accentText: '#5B21B6',   // Dark Purple (Text on light backgrounds)
} as const;

export const SPACING = {
  s1: 4,
  s2: 8,
  s3: 16,
  s4: 24,
  s5: 32,
  s6: 48,
} as const;

export const TAB_BAR_HEIGHT = 72;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,    // Increased for rounder cards
  xxl: 32,   // Increased for the large cards
  full: 999,
} as const;

export const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05, // Slightly softer shadow
  shadowRadius: 16,    // Wider shadow spread
  elevation: 3,
} as const;

export const TYPE = {
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.8 },
  h1Lg: { fontSize: 44, fontWeight: '700' as const, letterSpacing: -1.4 },
  h3: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.3 },
  body: { fontSize: 15, fontWeight: '400' as const },
  sub: { fontSize: 15, fontWeight: '400' as const, color: COLORS.t2 },
  label: { fontSize: 13, fontWeight: '500' as const, color: COLORS.t2 },
  big: { fontSize: 44, fontWeight: '700' as const, letterSpacing: -1.6 },
  pill: { fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.16 },
} as const;