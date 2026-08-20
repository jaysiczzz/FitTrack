import { Platform } from 'react-native';

const getApiUrl = () => {
  // 1. If explicitly configured via environment variable (e.g. Render URL or custom IP), ALWAYS use it!
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Web browser testing fallback
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return `http://${window.location.hostname}:3000`;
    }
    return 'http://localhost:3000';
  }

  // 3. Android Emulator fallback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  // 4. iOS Simulator fallback
  return 'http://localhost:3000';
};

export const API_URL = getApiUrl();