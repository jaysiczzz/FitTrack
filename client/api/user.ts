import { apiRequest } from './client';

export interface UserProfilePayload {
  firstName?: string;
  lastName?: string;
  height?: number;
  weight?: number;
  targetWeight?: number | null;
  age?: number;
  goal?: 'MUSCLE_GAIN' | 'WEIGHT_LOSS';
  avatarUrl?: string | null;
}

export const getUserProfile = () => apiRequest('/api/user/profile');

export const updateUserProfile = (payload: UserProfilePayload) =>
  apiRequest('/api/user/profile', { method: 'PUT', body: payload as any });

export const deleteUserAccount = () =>
  apiRequest('/api/user/profile', { method: 'DELETE' });


