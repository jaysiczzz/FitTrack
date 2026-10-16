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

