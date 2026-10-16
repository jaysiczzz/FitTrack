import { apiRequest } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CACHED_UNREAD_NOTIF_KEY = 'fittrack_cached_unread_notif_count';
let memoryUnreadCount = 0;

// Hydrate from AsyncStorage asynchronously on app launch
AsyncStorage.getItem(CACHED_UNREAD_NOTIF_KEY)
  .then((val) => {
    if (val !== null) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) {
        memoryUnreadCount = parsed;
      }
    }
  })
  .catch(() => {});

export function getCachedUnreadNotifCount(): number {
  return memoryUnreadCount;
}

export function setCachedUnreadNotifCount(count: number): void {
  memoryUnreadCount = Math.max(0, count);
  AsyncStorage.setItem(CACHED_UNREAD_NOTIF_KEY, String(memoryUnreadCount)).catch(() => {});
}

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

// ----------------------------------------------------
// In-App Notification Inbox & Real-time Persistence
// ----------------------------------------------------

export type InAppNotificationType =
  | 'STREAK'
  | 'WORKOUT'
  | 'NUTRITION'
  | 'SUPPORT'
  | 'AI'
  | 'SYSTEM'
  | 'ACHIEVEMENT';

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: InAppNotificationType;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function getInAppNotificationsApi(): Promise<{
  success: boolean;
  notifications: InAppNotification[];
  unreadCount: number;
}> {
  const res = await apiRequest('/api/notifications', { method: 'GET' });
  if (res && typeof res.unreadCount === 'number') {
    setCachedUnreadNotifCount(res.unreadCount);
  }
  return res;
}

export async function markNotificationReadApi(id: string): Promise<{
  success: boolean;
  notification: InAppNotification;
  unreadCount: number;
}> {
  const res = await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
  if (res && typeof res.unreadCount === 'number') {
    setCachedUnreadNotifCount(res.unreadCount);
  }
  return res;
}

export async function markAllNotificationsReadApi(): Promise<{
  success: boolean;
  message: string;
  unreadCount: number;
}> {
  const res = await apiRequest('/api/notifications/read-all', { method: 'PATCH' });
  if (res && typeof res.unreadCount === 'number') {
    setCachedUnreadNotifCount(res.unreadCount);
  }
  return res;
}

export async function deleteInAppNotificationApi(id: string): Promise<{
  success: boolean;
  message: string;
  unreadCount: number;
}> {
  const res = await apiRequest(`/api/notifications/${id}`, { method: 'DELETE' });
  if (res && typeof res.unreadCount === 'number') {
    setCachedUnreadNotifCount(res.unreadCount);
  }
  return res;
}

export async function clearReadNotificationsApi(): Promise<{
  success: boolean;
  message: string;
}> {
  return apiRequest('/api/notifications/read', { method: 'DELETE' });
}

export async function savePushTokenApi(pushToken: string): Promise<{
  success: boolean;
  message?: string;
}> {
  return apiRequest('/api/user/notifications/push-token', {
    method: 'POST',
    body: { pushToken },
  });
}
