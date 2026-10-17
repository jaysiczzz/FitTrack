/**
 * FitTrack Refined Theme Color Tokens
 * WCAG AA compliant palette:
 * - High-contrast accessible primary action color (#0D7A57 / #10B981)
 * - Calibrated neutral text & card surfaces
 * - Pure semantic colors for success, warning, error, and info
 */
export { COLORS, getThemeColors } from './themePalette';

export {
  ThemeProvider,
  useThemeColors,
  useColorScheme,
  applyWebTheme,
  notifyNativeWindObservable,
  type AppColorScheme,
  type ThemeContextType,
} from '@/context/ThemeContext';

export { THEME_STORAGE_KEY } from '@/constants/storageKeys';

/**
 * Backward compatibility helpers
 */
export async function initAppTheme(): Promise<'light' | 'dark'> {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const { THEME_STORAGE_KEY: KEY } = require('@/constants/storageKeys');
  try {
    const saved =
      (await AsyncStorage.getItem(KEY)) ||
      (await AsyncStorage.getItem('fittrack_theme_preference'));
    if (saved === 'dark' || saved === 'light') {
      const { applyWebTheme: apply, notifyNativeWindObservable: notify } = require('@/context/ThemeContext');
      apply(saved);
      try {
        const { colorScheme: nwScheme } = require('nativewind');
        nwScheme.set(saved);
      } catch {}
      notify(saved);
      return saved;
    }
  } catch {}
  return 'light';
}

export function setAppTheme(newTheme: 'light' | 'dark') {
  const { applyWebTheme: apply, notifyNativeWindObservable: notify } = require('@/context/ThemeContext');
  apply(newTheme);
  try {
    const { colorScheme: nwScheme } = require('nativewind');
    nwScheme.set(newTheme);
  } catch {}
  notify(newTheme);
}
