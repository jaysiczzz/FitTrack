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
    dark: '#334155',
  },
  accent: {
    DEFAULT: '#047857',
    light: '#047857',
    dark: '#10B981',
    mint: '#34D399',
  },
  accentContrast: {
    DEFAULT: '#FFFFFF',
    light: '#FFFFFF',
    dark: '#0B1120',
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
    DEFAULT: '#0369A1',
    light: '#0369A1',
    dark: '#38BDF8',
  },
  warning: {
    DEFAULT: '#B45309',
    light: '#B45309',
    dark: '#FBBF24',
  },
  success: {
    DEFAULT: '#047857',
    light: '#047857',
    dark: '#10B981',
  },
  tertiary: {
    DEFAULT: '#64748B',
    light: '#64748B',
    dark: '#94A3B8',
  },
};

import { useState, useEffect } from 'react';
import { Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

export const THEME_STORAGE_KEY = 'fittrack_theme_preference';

export type AppColorScheme = 'light' | 'dark';

// Global synchronous theme state for instant 0ms access across the app
let activeTheme: AppColorScheme = (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
let themeHasBeenSet = false;

const themeListeners = new Set<(theme: AppColorScheme) => void>();

/**
 * Synchronously notifies react-native-css-interop observable so all
 * Tailwind `dark:` variant classes update in 0ms without waiting for
 * the slow asynchronous Android native bridge event.
 */
function notifyNativeWindObservable(theme: AppColorScheme) {
  if (Platform.OS !== 'web') {
    try {
      const appearanceObservables = require('react-native-css-interop/dist/runtime/native/appearance-observables');
      if (appearanceObservables?.systemColorScheme && typeof appearanceObservables.systemColorScheme.set === 'function') {
        appearanceObservables.systemColorScheme.set(theme);
      }
    } catch {
      // Ignored if bundled differently
    }
  }
}

/**
 * Sets the app theme instantaneously (0ms delay).
 * Synchronously notifies all React components, updates NativeWind observables,
 * syncs native Appearance, and persists the choice to AsyncStorage.
 */
export function setAppTheme(newTheme: AppColorScheme) {
  if (activeTheme === newTheme && themeHasBeenSet) return;
  activeTheme = newTheme;
  themeHasBeenSet = true;

  // 1. Instant synchronous notification to NativeWind / css-interop observable
  notifyNativeWindObservable(newTheme);

  // 2. Instant synchronous notification to all React hooks/components
  themeListeners.forEach((listener) => {
    try {
      listener(newTheme);
    } catch {}
  });

  // 3. Sync native OS status bar and Android configuration
  try {
    Appearance.setColorScheme(newTheme);
  } catch {}

  // 4. Save to persistent storage in background
  AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme).catch(() => {});
}

/**
 * Initialize theme from storage on app launch
 */
export async function initAppTheme(): Promise<AppColorScheme> {
  try {
    const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      activeTheme = saved;
      themeHasBeenSet = true;
      notifyNativeWindObservable(saved);
      try {
        Appearance.setColorScheme(saved);
      } catch {}
      themeListeners.forEach((listener) => {
        try {
          listener(saved);
        } catch {}
      });
      return saved;
    }
  } catch {}
  return activeTheme;
}

export function getThemeColors(isDark: boolean) {
  return {
    background: isDark ? COLORS.background.dark : COLORS.background.light,
    surface: isDark ? COLORS.surface.dark : COLORS.surface.light,
    input: isDark ? COLORS.input.dark : COLORS.input.light,
    inputBorder: isDark ? COLORS.inputBorder.dark : COLORS.inputBorder.light,
    accent: isDark ? COLORS.accent.dark : COLORS.accent.light,
    accentContrast: isDark ? COLORS.accentContrast.dark : COLORS.accentContrast.light,
    textPrimary: isDark ? COLORS.textPrimary.dark : COLORS.textPrimary.light,
    textMuted: isDark ? COLORS.textMuted.dark : COLORS.textMuted.light,
    danger: isDark ? COLORS.danger.dark : COLORS.danger.light,
    info: isDark ? COLORS.info.dark : COLORS.info.light,
    warning: isDark ? COLORS.warning.dark : COLORS.warning.light,
    success: isDark ? COLORS.success.dark : COLORS.success.light,
    tertiary: isDark ? COLORS.tertiary.dark : COLORS.tertiary.light,
  };
}

export function useThemeColors() {
  const nativeWind = useNativeWindColorScheme();
  const [theme, setTheme] = useState<AppColorScheme>(activeTheme);

  useEffect(() => {
    const handler = (newTheme: AppColorScheme) => {
      setTheme(newTheme);
    };
    themeListeners.add(handler);
    return () => {
      themeListeners.delete(handler);
    };
  }, []);

  // Sync if system changes outside our app controls
  useEffect(() => {
    if (nativeWind.colorScheme === 'dark' || nativeWind.colorScheme === 'light') {
      if (nativeWind.colorScheme !== activeTheme && !themeHasBeenSet) {
        activeTheme = nativeWind.colorScheme;
        setTheme(nativeWind.colorScheme);
      }
    }
  }, [nativeWind.colorScheme]);

  const isDark = theme === 'dark';

  return {
    isDark,
    colorScheme: theme,
    colors: getThemeColors(isDark),
    setColorScheme: setAppTheme,
  };
}

export function useColorScheme() {
  const { colorScheme, setColorScheme } = useThemeColors();
  return {
    colorScheme,
    setColorScheme,
    toggleColorScheme: () => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark'),
  };
}
