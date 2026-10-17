import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme as nativeWindColorScheme } from 'nativewind';
import { getThemeColors } from '@/constants/themePalette';
import { THEME_STORAGE_KEY } from '@/constants/storageKeys';

export type AppColorScheme = 'light' | 'dark';

export interface ThemeContextType {
  theme: AppColorScheme;
  colorScheme: AppColorScheme;
  isDark: boolean;
  colors: ReturnType<typeof getThemeColors>;
  setColorScheme: (scheme: AppColorScheme) => void;
  toggleColorScheme: () => void;
}

// Module-level global state for synchronous initial render & outside-provider fallbacks
let globalTheme: AppColorScheme = (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');

// Synchronous DOM pre-hydration on Web to prevent theme flash on browser reload
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY) || window.localStorage.getItem('fittrack_theme_preference');
    if (saved === 'dark' || saved === 'light') {
      globalTheme = saved;
    }
    applyWebTheme(globalTheme);
    try {
      nativeWindColorScheme.set(globalTheme);
    } catch {}
  } catch {}
}

/**
 * Apply theme to Web DOM synchronously
 */
export function applyWebTheme(theme: AppColorScheme) {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const isDark = theme === 'dark';
    try {
      if (document.documentElement) {
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.style.colorScheme = theme;
      }
      if (document.body) {
        document.body.classList.toggle('dark', isDark);
        document.body.style.colorScheme = theme;
      }
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.classList.toggle('dark', isDark);
      }
    } catch {}
  }
}

/**
 * Synchronously notifies NativeWind / css-interop observable on native mobile
 * so that all Tailwind `dark:` classes update in 0ms without the 1-2s Android delay.
 */
export function notifyNativeWindObservable(theme: AppColorScheme) {
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

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppColorScheme>(globalTheme);

  // Load persisted theme preference from storage on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSavedTheme() {
      try {
        const saved =
          (await AsyncStorage.getItem(THEME_STORAGE_KEY)) ||
          (await AsyncStorage.getItem('fittrack_theme_preference'));
        if ((saved === 'dark' || saved === 'light') && isMounted) {
          globalTheme = saved;
          setTheme(saved);
          applyWebTheme(saved);
          try {
            nativeWindColorScheme.set(saved);
          } catch {}
          notifyNativeWindObservable(saved);
        } else if (isMounted) {
          applyWebTheme(globalTheme);
          try {
            nativeWindColorScheme.set(globalTheme);
          } catch {}
          notifyNativeWindObservable(globalTheme);
        }
      } catch {
        if (isMounted) {
          applyWebTheme(globalTheme);
          try {
            nativeWindColorScheme.set(globalTheme);
          } catch {}
          notifyNativeWindObservable(globalTheme);
        }
      }
    }
    loadSavedTheme();
    return () => {
      isMounted = false;
    };
  }, []);

  const setColorScheme = useCallback((newTheme: AppColorScheme) => {
    globalTheme = newTheme;
    // 1. Synchronously update React state (triggers immediate dynamic re-render)
    setTheme(newTheme);

    // 2. Synchronously update Web DOM (Tailwind .dark class + colorScheme)
    applyWebTheme(newTheme);

    // 3. Sync NativeWind's built-in colorScheme controller
    try {
      nativeWindColorScheme.set(newTheme);
    } catch {}

    // 4. Synchronously notify NativeWind observable (0ms mobile transition)
    notifyNativeWindObservable(newTheme);

    // 5. Persist to storage (both current key and legacy fallback key)
    AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme).catch(() => {});
    AsyncStorage.setItem('fittrack_theme_preference', newTheme).catch(() => {});
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        window.localStorage.setItem('fittrack_theme_preference', newTheme);
      } catch {}
    }

    // 6. Sync native Appearance asynchronously on next tick to avoid stalling UI thread
    setTimeout(() => {
      try {
        Appearance.setColorScheme(newTheme);
      } catch {}
    }, 0);
  }, []);

  const toggleColorScheme = useCallback(() => {
    setColorScheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setColorScheme]);

  const isDark = theme === 'dark';

  const themeColors = useMemo(() => {
    return getThemeColors(isDark);
  }, [isDark]);

  const value = useMemo<ThemeContextType>(() => ({
    theme,
    colorScheme: theme,
    isDark,
    colors: themeColors,
    setColorScheme,
    toggleColorScheme,
  }), [theme, isDark, themeColors, setColorScheme, toggleColorScheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Primary hook to consume theme colors dynamically across Web and Mobile
 */
export function useThemeColors(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context) {
    return context;
  }

  // Graceful fallback if called outside ThemeProvider
  const isDark = globalTheme === 'dark';
  return {
    theme: globalTheme,
    colorScheme: globalTheme,
    isDark,
    colors: getThemeColors(isDark),
    setColorScheme: (scheme: AppColorScheme) => {
      globalTheme = scheme;
      applyWebTheme(scheme);
      try {
        nativeWindColorScheme.set(scheme);
      } catch {}
      notifyNativeWindObservable(scheme);
    },
    toggleColorScheme: () => {
      const next = globalTheme === 'dark' ? 'light' : 'dark';
      globalTheme = next;
      applyWebTheme(next);
      try {
        nativeWindColorScheme.set(next);
      } catch {}
      notifyNativeWindObservable(next);
    },
  };
}

/**
 * NativeWind-compatible useColorScheme hook
 */
export function useColorScheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useThemeColors();
  return {
    colorScheme,
    setColorScheme,
    toggleColorScheme,
  };
}
