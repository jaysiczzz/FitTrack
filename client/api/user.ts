import { apiRequest } from './client';

export interface UserProfilePayload {
  firstName?: string;
  lastName?: string;
  height?: number;
  weight?: number;
  age?: number;
  goal?: 'MUSCLE_GAIN' | 'WEIGHT_LOSS';
}

export const getUserProfile = () => apiRequest('/api/user/profile');

export const updateUserProfile = (payload: UserProfilePayload) =>
  apiRequest('/api/user/profile', { method: 'PUT', body: payload as any });
