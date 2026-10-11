/**
 * Application-wide configuration and static reference values
 */

export const SUPPORT_EMAIL = 'fittrack.app.help@gmail.com';

export const APP_CONFIG = {
  appName: 'FitTrack',
  version: '1.0.5',
  supportEmail: SUPPORT_EMAIL,
  defaultDevPort: 3000,
  apiTimeoutMs: 15000,
  aiTimeoutMs: 60000,
  openFoodFactsSearchUrl: 'https://world.openfoodfacts.net/cgi/search.pl',
} as const;

export const ONBOARDING_CHECKLIST_DELAYS = {
  STEP_1_MS: 600,
  STEP_2_MS: 1300,
  STEP_3_MS: 2000,
  COMPLETE_MS: 2700,
} as const;
