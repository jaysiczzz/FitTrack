import { DeviceEventEmitter, Platform } from 'react-native';
import { authStorage } from '../utils/authStorage';
import { offlineQueue } from '../utils/offlineQueue';
import { API_URL } from '../config';

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  _isRetry?: boolean;
  _skipOfflineQueue?: boolean;
  timeout?: number;
}

let refreshPromise: Promise<string | null> | null = null;
let isHandlingUnauthorized = false;

/**
 * Debounced emitter for session invalidation to avoid spamming multiple logouts
 */
function emitUnauthorized(): void {
  if (isHandlingUnauthorized) return;
  isHandlingUnauthorized = true;
  authStorage.clearAuth().finally(() => {
    DeviceEventEmitter.emit('AUTH_UNAUTHORIZED');
    setTimeout(() => {
      isHandlingUnauthorized = false;
    }, 2000);
  });
}

// Listen for reconnection / app-active flush triggers
DeviceEventEmitter.addListener('OFFLINE_QUEUE_TRIGGER_FLUSH', () => {
  offlineQueue.flush((ep: string, opts: any) => apiRequest(ep, opts)).catch(() => {});
});

function isOfflineQueuableEndpoint(endpoint: string, method?: string): boolean {
  if (!method || method.toUpperCase() === 'GET') return false;
  // Exclude financial, billing, and auth operations
  if (
    endpoint.includes('/api/subscription') ||
    endpoint.includes('/api/wallet') ||
    endpoint.includes('/api/paymongo') ||
    endpoint.includes('/api/stripe') ||
    endpoint.includes('/api/auth')
  ) {
    return false;
  }
  // Allow workout sessions/sets, food logs, weights, check-ins, and user profile updates
  return (
    endpoint.includes('/api/foodlog') ||
    endpoint.includes('/api/workout') ||
    endpoint.includes('/api/weight') ||
    endpoint.includes('/api/checkin') ||
    endpoint.includes('/api/user')
  );
}

/**
 * Safely parses JWT payload to extract expiration timestamp (in seconds)
 */
function parseJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = '';
    if (typeof atob === 'function') {
      jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let str = base64.replace(/=+$/, '');
      let output = '';
      for (
        let bc = 0, bs = 0, buffer, idx = 0;
        (buffer = str.charAt(idx++));
        ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
          ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
          : 0
      ) {
        buffer = chars.indexOf(buffer);
      }
      jsonPayload = output;
    }
    const parsed = JSON.parse(jsonPayload);
    return typeof parsed.exp === 'number' ? parsed.exp : null;
  } catch {
    return null;
  }
}

/**
 * Checks if JWT is expired or expiring within 30 seconds
 */
function isTokenExpired(token: string): boolean {
  const exp = parseJwtExp(token);
  if (!exp) return false;
  return Date.now() >= (exp - 30) * 1000;
}

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
  const isAuthEndpoint =
    endpoint.includes('/api/auth/refresh') ||
    endpoint.includes('/api/auth/login') ||
    endpoint.includes('/api/auth/register') ||
    endpoint.includes('/api/auth/logout') ||
    endpoint.includes('/api/auth/check-email') ||
    endpoint.includes('/api/auth/forgot-password') ||
    endpoint.includes('/api/auth/reset-password');

  let token = await authStorage.getToken();

  // Proactive token expiration handling for protected endpoints:
  // If access token is expired or expiring within 30s, refresh silently BEFORE sending request
  if (!isAuthEndpoint) {
    if (token && isTokenExpired(token)) {
      const refreshedToken = await doRefreshToken();
      if (refreshedToken) {
        token = refreshedToken;
      } else {
        // Refresh token invalid or expired — gracefully abort and notify auth context
        emitUnauthorized();
        throw new Error('Session expired. Please log in again.');
      }
    } else if (!token) {
      // No token at all: check if we have a refresh token to restore session
      const refreshToken = await authStorage.getRefreshToken();
      if (refreshToken) {
        const refreshedToken = await doRefreshToken();
        if (refreshedToken) {
          token = refreshedToken;
        } else {
          emitUnauthorized();
          throw new Error('Not authenticated. Please log in.');
        }
      } else {
        emitUnauthorized();
        throw new Error('Not authenticated. Please log in.');
      }
    }
  }

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

  // AI generation and photo analysis need a larger timeout window (60s), while normal requests timeout in 12s
  const isAiOrExternal = endpoint.includes('/api/ai/') || endpoint.includes('openfoodfacts');
  const defaultTimeout = isAiOrExternal ? 60000 : 12000;
  const timeoutMs = options.timeout ?? defaultTimeout;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers,
      body: body as BodyInit,
    });
  } catch (err: any) {
    const isNetworkError =
      err?.name === 'AbortError' ||
      controller.signal.aborted ||
      err?.message?.includes('Network request failed') ||
      err?.message?.includes('timed out') ||
      err?.message?.includes('Could not reach') ||
      err?.message?.includes('failed to fetch');

    // If an offline-queuable mutation fails due to network outage, buffer in the outbox
    if (isNetworkError && !options._skipOfflineQueue && isOfflineQueuableEndpoint(endpoint, options.method)) {
      offlineQueue.enqueue({
        endpoint,
        method: options.method,
        body: options.body,
        headers: options.headers as Record<string, string>,
      }).catch(() => {});

      return {
        success: true,
        isQueuedOffline: true,
        message: 'Action saved offline and queued for automatic sync.',
      };
    }

    if (err?.name === 'AbortError' || controller.signal.aborted) {
      console.warn(`[API Connection] Request timed out for ${url}`);
      throw new Error(`Request to ${API_URL} timed out. Please check your connection.`);
    }
    console.warn(`[API Connection] Could not reach ${url}:`, err?.message || err);
    throw new Error(`Unable to connect to server at ${API_URL}. Please check your connection or server status.`);
  } finally {
    clearTimeout(timeoutId);
  }

  // Handle Token Expiry & Silent Refresh if server returns 401
  if (response.status === 401 && !isAuthEndpoint) {
    if (!options._isRetry) {
      const newAccessToken = await doRefreshToken();
      if (newAccessToken) {
        // Retry the original request once with fresh access token
        return apiRequest(endpoint, {
          ...options,
          _isRetry: true,
        });
      }
    }

    emitUnauthorized();
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  // Trigger background flush of any previously queued mutations on successful request
  if (!options._skipOfflineQueue) {
    offlineQueue.flush((ep: string, opts: any) => apiRequest(ep, opts)).catch(() => {});
  }

  return data;
}
