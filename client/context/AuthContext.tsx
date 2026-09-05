import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';
import { authStorage } from '@/utils/authStorage';
import { getUserProfile } from '@/api/user';

export interface AuthUser {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  height?: number;
  weight?: number;
  age?: number;
  goal?: 'MUSCLE_GAIN' | 'WEIGHT_LOSS';
  [key: string]: any;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: AuthUser) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth on app cold start
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const storedToken = await authStorage.getToken();
        const storedUser = await authStorage.getUser<AuthUser>();

        if (isMounted) {
          setToken(storedToken);
          setUser(storedUser);
        }

        // If we have a token, optionally refresh the profile in the background
        if (storedToken) {
          try {
            const profileRes = await getUserProfile();
            if (profileRes?.user && isMounted) {
              setUser(profileRes.user);
              await authStorage.setUser(profileRes.user);
            }
          } catch (err: any) {
            // If token expired / 401 Unauthorized, clear auth session
            if (err?.message?.includes('401') || err?.message?.toLowerCase().includes('unauthorized')) {
              console.warn('[AuthContext] Stored token is invalid or expired. Logging out.');
              await authStorage.clearAuth();
              if (isMounted) {
                setToken(null);
                setUser(null);
              }
            }
          }
        }
      } catch (err) {
        console.error('[AuthContext] Failed to initialize auth session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for unauthorized 401 events emitted by apiRequest
    const sub = DeviceEventEmitter.addListener('AUTH_UNAUTHORIZED', async () => {
      await authStorage.clearAuth();
      if (isMounted) {
        setToken(null);
        setUser(null);
        router.replace('/(auth)');
      }
    });

    return () => {
      isMounted = false;
      sub.remove();
    };
  }, [router]);

  const login = useCallback(async (newToken: string, newUser: AuthUser) => {
    await authStorage.setToken(newToken);
    await authStorage.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
    router.replace('/(screen)/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    await authStorage.clearAuth();
    setToken(null);
    setUser(null);
    router.replace('/(auth)');
  }, [router]);

  const updateUser = useCallback(async (updatedUser: AuthUser) => {
    setUser(updatedUser);
    await authStorage.setUser(updatedUser);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await getUserProfile();
      if (res?.user) {
        setUser(res.user);
        await authStorage.setUser(res.user);
      }
    } catch (e) {
      console.warn('[AuthContext] Failed to refresh profile:', e);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        logout,
        updateUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
