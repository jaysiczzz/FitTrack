import { DeviceEventEmitter } from 'react-native';
import { authStorage } from '../utils/authStorage';
import { API_URL } from '../config';

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
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

  if (response.status === 401) {
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
