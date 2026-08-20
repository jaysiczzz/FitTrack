import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
  // Web (browser testing)
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return `http://${window.location.hostname}:3000`;
    }
    return 'http://localhost:3000';
  }

  // Android Emulator connects to host localhost via 10.0.2.2
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return 'http://10.0.2.2:3000';
  }

  // Physical Android Device
  return process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
};

export const API_URL = getApiUrl();