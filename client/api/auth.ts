import { apiRequest } from './client';

export const registerUser = (payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  height: number;
  weight: number;
  age: number;
  goal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS';
}) => apiRequest('/api/auth/register', { method: 'POST', body: payload as any });

export const loginUser = (payload: { email: string; password: string }) =>
  apiRequest('/api/auth/login', { method: 'POST', body: payload as any });

export const refreshTokenApi = (refreshToken: string) =>
  apiRequest('/api/auth/refresh', { method: 'POST', body: { refreshToken } });

export const logoutUserApi = (refreshToken?: string | null) =>
  apiRequest('/api/auth/logout', { method: 'POST', body: { refreshToken: refreshToken || undefined } });

export const changePasswordApi = (payload: { currentPassword: string; newPassword: string }) =>
  apiRequest('/api/auth/change-password', { method: 'POST', body: payload });

export const forgotPasswordApi = (email: string) =>
  apiRequest('/api/auth/forgot-password', { method: 'POST', body: { email } });

export const resetPasswordWithCodeApi = (payload: { email: string; code: string; newPassword: string }) =>
  apiRequest('/api/auth/reset-password', { method: 'POST', body: payload });

export const checkEmailApi = (email: string) =>
  apiRequest('/api/auth/check-email', { method: 'POST', body: { email } });


