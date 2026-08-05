import Constants from 'expo-constants';

const LOCAL_IP_URL = process.env.EXPO_PUBLIC_API_URL as string;

const getApiUrl = () => {
  const isEmulator = !Constants.isDevice;

  if (isEmulator) {
    return 'http://10.0.2.2:3000';
  }

  return LOCAL_IP_URL;
};

export const API_URL = getApiUrl();