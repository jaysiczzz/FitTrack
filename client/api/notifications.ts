import { apiRequest } from './client';

export interface ApiNotificationSettings {
  id?: string;
  userId?: string;
  mealReminders: boolean;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  hydrationReminders: boolean;
  hydrationTime1: string;
  hydrationTime2: string;
  workoutReminders: boolean;
  workoutTime: string;
  checkinReminders: boolean;
  checkinTime: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getNotificationSettingsApi(): Promise<{
  success: boolean;
  settings: ApiNotificationSettings;
}> {
  return apiRequest('/api/user/notifications', { method: 'GET' });
}

export async function updateNotificationSettingsApi(
  settings: Partial<ApiNotificationSettings>
): Promise<{
  success: boolean;
  message: string;
  settings: ApiNotificationSettings;
}> {
  return apiRequest('/api/user/notifications', {
    method: 'PUT',
    body: settings,
  });
}

export async function resetNotificationSettingsApi(): Promise<{
  success: boolean;
  message: string;
  settings: ApiNotificationSettings;
}> {
  return apiRequest('/api/user/notifications/reset', { method: 'POST' });
}
