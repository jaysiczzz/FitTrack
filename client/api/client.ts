import { DeviceEventEmitter } from 'react-native';
import { authStorage } from '../utils/authStorage';
import { API_URL } from '../config';

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  _isRetry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * Performs silent token refresh. Queues concurrent requests so only one refresh API call is fired.
 */
async function doRefreshToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = await authStorage.getRefreshToken();
      if (!refreshToken) return null;

      const refreshUrl = `${API_URL}/api/auth/refresh`;
      const res = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      const newAccessToken = data.accessToken || data.token;
      const newRefreshToken = data.refreshToken;

      if (newAccessToken) {
        await authStorage.setToken(newAccessToken);
      }
      if (newRefreshToken) {
        await authStorage.setRefreshToken(newRefreshToken);
      }

      return newAccessToken || null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest(endpoint: string, options: ApiRequestOptions = {}) {
  const token = await authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData) && typeof body !== 'string') {
    body = JSON.stringify(body);
  }

  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      body: body as BodyInit,
    });
  } catch (err: any) {
    console.error(`[API Error] Could not connect to ${url}:`, err);
    throw new Error(`Unable to connect to server at ${API_URL}. Please check your connection or server status.`);
  }

  // Handle Token Expiry & Silent Refresh
  if (response.status === 401) {
    const isAuthEndpoint =
      endpoint.includes('/api/auth/refresh') ||
      endpoint.includes('/api/auth/login') ||
      endpoint.includes('/api/auth/register') ||
      endpoint.includes('/api/auth/logout');

    if (!isAuthEndpoint && !options._isRetry) {
      const newAccessToken = await doRefreshToken();
      if (newAccessToken) {
        // Retry the original request once with fresh access token
        return apiRequest(endpoint, {
          ...options,
          _isRetry: true,
        });
      }
    }

    await authStorage.clearAuth();
    DeviceEventEmitter.emit('AUTH_UNAUTHORIZED');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}

