/**
 * Centralized AsyncStorage and SecureStore key constants
 */

export const STORAGE_KEYS = {
  THEME: 'fittrack_app_theme',
  USER: 'user',
  TOKEN: 'token',
  ONBOARDING_DATA: 'fittrack_onboarding_data',
  UNITS: 'fittrack_units',
} as const;

export const THEME_STORAGE_KEY = STORAGE_KEYS.THEME;
