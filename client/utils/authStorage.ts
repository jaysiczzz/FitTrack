import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Checks if hardware SecureStore is available (iOS & Android native).
 */
const isSecureStorePlatform = () => Platform.OS !== 'web';

export const authStorage = {
  /**
   * Save the auth JWT token.
   * - iOS & Android: Hardware Keychain / Keystore (expo-secure-store).
   * - Web: Fallback to AsyncStorage (localStorage).
   */
  async setToken(token: string): Promise<void> {
    try {
      if (isSecureStorePlatform()) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      }
    } catch (err) {
      console.warn('[authStorage] Failed to setToken with SecureStore, falling back to AsyncStorage:', err);
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
  },

  /**
   * Retrieve the auth JWT token.
   * - iOS & Android: Reads from SecureStore (with automatic legacy AsyncStorage migration).
   * - Web: Reads from AsyncStorage.
   */
  async getToken(): Promise<string | null> {
    try {
      if (isSecureStorePlatform()) {
        const secureToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (secureToken) return secureToken;

        // Migration check: If user previously logged in with AsyncStorage on mobile, migrate it
        const legacyToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (legacyToken) {
          await SecureStore.setItemAsync(TOKEN_KEY, legacyToken);
          await AsyncStorage.removeItem(TOKEN_KEY);
          return legacyToken;
        }
        return null;
      }
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (err) {
      console.warn('[authStorage] Failed to getToken from SecureStore, checking AsyncStorage:', err);
      return await AsyncStorage.getItem(TOKEN_KEY);
    }
  },

  /**
   * Delete the auth JWT token from both SecureStore and AsyncStorage.
   */
  async removeToken(): Promise<void> {
    try {
      if (isSecureStorePlatform()) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (err) {
      console.warn('[authStorage] Failed to deleteItemAsync from SecureStore:', err);
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Store non-secret user profile object in AsyncStorage (no 2KB size constraint).
   */
  async setUser(user: any): Promise<void> {
    if (!user) {
      await this.removeUser();
      return;
    }
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Retrieve non-secret user profile object from AsyncStorage.
   */
  async getUser<T = any>(): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn('[authStorage] Failed to parse cached user:', err);
      return null;
    }
  },

  /**
   * Remove cached user profile.
   */
  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  },

  /**
   * Clear all authentication data on logout.
   */
  async clearAuth(): Promise<void> {
    await Promise.all([this.removeToken(), this.removeUser()]);
  },
};
