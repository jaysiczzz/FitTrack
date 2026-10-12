import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { APP_CONFIG } from './constants/appConfig';

/**
 * Fallback production backend URL hosted on Render.
 * Can be overridden by setting EXPO_PUBLIC_API_URL in .env
 */
export const FALLBACK_API_URL = 'https://fittrack-9vh0.onrender.com';
export const DEFAULT_DEV_PORT = APP_CONFIG.defaultDevPort;

const getApiUrl = () => {
  // 1. If explicitly configured via environment variable, use it!
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Web browser testing fallback (local development)
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname !== 'localhost') {
      return `http://${window.location.hostname}:${DEFAULT_DEV_PORT}`;
    }
    return `http://localhost:${DEFAULT_DEV_PORT}`;
  }

  // 3. Local network development on mobile (Expo Go / Emulator)
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp) {
        return `http://${hostIp}:${DEFAULT_DEV_PORT}`;
      }
    }
  }

  // 4. Standalone Mobile / Physical Device default -> Live Render Production URL
  return FALLBACK_API_URL;
};

export const API_URL = getApiUrl();