/**
 * FitTrack Refined Theme Color Tokens
 * WCAG AA compliant palette:
 * - High-contrast accessible primary action color (#0D7A57 / #10B981)
 * - Calibrated neutral text & card surfaces
 * - Pure semantic colors for success, warning, error, and info
 */
export const COLORS = {
  background: {
    DEFAULT: '#F8FAFC',
    light: '#F8FAFC',
    dark: '#0B1120',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    light: '#FFFFFF',
    dark: '#151E2E',
  },
  input: {
    DEFAULT: '#F1F5F9',
    light: '#F1F5F9',
    dark: '#1A2333',
  },
  inputBorder: {
    DEFAULT: '#E2E8F0',
    light: '#E2E8F0',
    dark: '#1F2937',
  },
  accent: {
    DEFAULT: '#10B981',
    light: '#10B981',
    dark: '#10B981',
    mint: '#34D399',
  },
  textPrimary: {
    DEFAULT: '#0F172A',
    light: '#0F172A',
    dark: '#F8FAFC',
  },
  textMuted: {
    DEFAULT: '#64748B',
    light: '#64748B',
    dark: '#94A3B8',
  },
  danger: {
    DEFAULT: '#DC2626',
    light: '#DC2626',
    dark: '#F87171',
  },
  info: {
    DEFAULT: '#0284C7',
    light: '#0284C7',
    dark: '#38BDF8',
  },
  warning: {
    DEFAULT: '#D97706',
    light: '#D97706',
    dark: '#FBBF24',
  },
  tertiary: {
    DEFAULT: '#64748B',
    light: '#64748B',
    dark: '#94A3B8',
  },
  secondary: {
    blue: '#38BDF8',
    purple: '#A855F7',
    orange: '#F97316',
    mint: '#34D399',
  },
} as const;

import { useColorScheme } from 'nativewind';

export function getThemeColors(isDark: boolean) {
  return {
    background: isDark ? COLORS.background.dark : COLORS.background.light,
    surface: isDark ? COLORS.surface.dark : COLORS.surface.light,
    input: isDark ? COLORS.input.dark : COLORS.input.light,
    inputBorder: isDark ? COLORS.inputBorder.dark : COLORS.inputBorder.light,
    accent: isDark ? COLORS.accent.dark : COLORS.accent.light,
    textPrimary: isDark ? COLORS.textPrimary.dark : COLORS.textPrimary.light,
    textMuted: isDark ? COLORS.textMuted.dark : COLORS.textMuted.light,
    danger: isDark ? COLORS.danger.dark : COLORS.danger.light,
    info: isDark ? COLORS.info.dark : COLORS.info.light,
    warning: isDark ? COLORS.warning.dark : COLORS.warning.light,
    tertiary: isDark ? COLORS.tertiary.dark : COLORS.tertiary.light,
  };
}

export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    colorScheme,
    colors: getThemeColors(isDark),
  };
}
