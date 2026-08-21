import { Platform } from 'react-native';

export const FALLBACK_API_URL = 'https://fittrack-au2r.onrender.com';

const getApiUrl = () => {
  // 1. If explicitly configured via environment variable, use it!
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Web browser testing fallback (local development)
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname !== 'localhost') {
      return `http://${window.location.hostname}:3000`;
    }
    return 'http://localhost:3000';
  }

  // 3. Standalone Mobile / Physical Device default -> Live Render Production URL
  return FALLBACK_API_URL;
};

export const API_URL = getApiUrl();