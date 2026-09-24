import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStorage } from './authStorage';
import {
  getNotificationSettingsApi,
  updateNotificationSettingsApi,
  resetNotificationSettingsApi,
  ApiNotificationSettings,
} from '../api/notifications';

export interface NotificationSettings {
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
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  mealReminders: true,
  breakfastTime: '08:30',
  lunchTime: '12:30',
  dinnerTime: '19:00',
  hydrationReminders: true,
  hydrationTime1: '11:00',
  hydrationTime2: '15:00',
  workoutReminders: true,
  workoutTime: '17:30',
  checkinReminders: true,
  checkinTime: '09:00',
  soundEnabled: true,
  vibrationEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

// Configure foreground presentation behavior (Alert banner + sound on native)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      return {
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    },
  });
}

/**
 * Parses "HH:MM" string to { hour, minute } numbers
 */
export function parseTime(timeStr: string): { hour: number; minute: number } {
  const parts = (timeStr || '12:00').split(':').map(Number);
  const hour = isNaN(parts[0]) ? 12 : Math.max(0, Math.min(23, parts[0]));
  const minute = isNaN(parts[1]) ? 0 : Math.max(0, Math.min(59, parts[1]));
  return { hour, minute };
}

/**
 * Formats "HH:MM" 24h string into 12h user-friendly display (e.g. "8:30 AM", "5:30 PM")
 */
export function formatTimeDisplay(timeStr: string): string {
  const { hour, minute } = parseTime(timeStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = String(minute).padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Checks if a specific time falls within quiet hours window
 */
export function isWithinQuietHours(
  timeStr: string,
  quietStart: string = '22:00',
  quietEnd: string = '07:00'
): boolean {
  const { hour: h, minute: m } = parseTime(timeStr);
  const currentMinutes = h * 60 + m;

  const { hour: sh, minute: sm } = parseTime(quietStart);
  const startMinutes = sh * 60 + sm;

  const { hour: eh, minute: em } = parseTime(quietEnd);
  const endMinutes = eh * 60 + em;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight window (e.g. 22:00 to 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

/**
 * Configure Android notification channel with customized sound & vibration
 */
async function setupAndroidChannel(soundEnabled = true, vibrationEnabled = true): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('fittrack-reminders', {
      name: 'FitTrack Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: vibrationEnabled ? [0, 250, 250, 250] : undefined,
      enableVibrate: vibrationEnabled,
      lightColor: '#0D7A57',
      sound: soundEnabled ? 'default' : undefined,
    });
  }
}

/**
 * Request notification permissions from device OS
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    await setupAndroidChannel();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.warn('[notificationService] Failed to request permissions:', err);
    return false;
  }
}

/**
 * Check if notification permissions are already granted
 */
export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Load saved notification settings for user (AsyncStorage + Cloud sync)
 */
export async function getNotificationSettings(userId?: string | null): Promise<NotificationSettings> {
  let settings: NotificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };

  // 1. Read local cache
  try {
    const key = authStorage.getScopedKey(userId, 'fittrack_notification_settings');
    const saved = await AsyncStorage.getItem(key);
    if (saved) {
      settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn('[notificationService] Error reading local settings:', err);
  }

  // 2. Fetch fresh from backend if authenticated
  if (userId) {
    try {
      const res = await getNotificationSettingsApi();
      if (res.success && res.settings) {
        settings = { ...settings, ...res.settings };
        const key = authStorage.getScopedKey(userId, 'fittrack_notification_settings');
        await AsyncStorage.setItem(key, JSON.stringify(settings));
      }
    } catch {
      // Offline fallback used
    }
  }

  return settings;
}

/**
 * Save notification settings and update schedules (Local + Cloud)
 */
export async function saveNotificationSettings(
  settings: NotificationSettings,
  userId?: string | null
): Promise<void> {
  try {
    const key = authStorage.getScopedKey(userId, 'fittrack_notification_settings');
    await AsyncStorage.setItem(key, JSON.stringify(settings));

    // Sync to backend
    if (userId) {
      updateNotificationSettingsApi(settings).catch(() => {});
    }

    if (Platform.OS !== 'web') {
      await rescheduleAllNotifications(settings);
    }
  } catch (err) {
    console.warn('[notificationService] Error saving settings:', err);
  }
}

/**
 * Resets notification settings to default recommended fitness timings
 */
export async function resetNotificationSettings(userId?: string | null): Promise<NotificationSettings> {
  const defaults = { ...DEFAULT_NOTIFICATION_SETTINGS };
  try {
    const key = authStorage.getScopedKey(userId, 'fittrack_notification_settings');
    await AsyncStorage.setItem(key, JSON.stringify(defaults));

    if (userId) {
      resetNotificationSettingsApi().catch(() => {});
    }

    if (Platform.OS !== 'web') {
      await rescheduleAllNotifications(defaults);
    }
  } catch (err) {
    console.warn('[notificationService] Error resetting settings:', err);
  }
  return defaults;
}

/**
 * Reschedules all active reminders according to customized preferences and times
 */
export async function rescheduleAllNotifications(settings: NotificationSettings): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    // Clear previously scheduled FitTrack notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const hasPermission = await hasNotificationPermission();
    if (!hasPermission) return;

    await setupAndroidChannel(settings.soundEnabled, settings.vibrationEnabled);

    const soundOption = settings.soundEnabled ? 'default' : undefined;

    // Helper to check if a reminder time is suppressed by quiet hours
    const shouldSchedule = (timeStr: string) => {
      if (!settings.quietHoursEnabled) return true;
      return !isWithinQuietHours(timeStr, settings.quietHoursStart, settings.quietHoursEnd);
    };

    // 1. Meal Reminders (Breakfast, Lunch, Dinner with custom times)
    if (settings.mealReminders) {
      if (shouldSchedule(settings.breakfastTime)) {
        const { hour, minute } = parseTime(settings.breakfastTime);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🍳 Breakfast Reminder',
            body: 'Fuel your day with quality protein and wholesome carbs!',
            sound: soundOption,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: 'fittrack-reminders',
          },
        });
      }

      if (shouldSchedule(settings.lunchTime)) {
        const { hour, minute } = parseTime(settings.lunchTime);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🥗 Lunch Time',
            body: 'Log your midday meal to stay on top of your macros!',
            sound: soundOption,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: 'fittrack-reminders',
          },
        });
      }

      if (shouldSchedule(settings.dinnerTime)) {
        const { hour, minute } = parseTime(settings.dinnerTime);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🍽️ Dinner Check-In',
            body: 'Wrap up your daily nutrition and hit your remaining calorie target.',
            sound: soundOption,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: 'fittrack-reminders',
          },
        });
      }
    }

    // 2. Hydration Reminders (Time 1 and Time 2)
    if (settings.hydrationReminders) {
      if (shouldSchedule(settings.hydrationTime1)) {
        const { hour, minute } = parseTime(settings.hydrationTime1);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💧 Hydration Check',
            body: 'Drink a glass of water! Aim to reach your daily hydration target.',
            sound: soundOption,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: 'fittrack-reminders',
          },
        });
      }

      if (shouldSchedule(settings.hydrationTime2)) {
        const { hour, minute } = parseTime(settings.hydrationTime2);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💧 Midday Water Break',
            body: 'Keep hydrated for optimal energy, recovery, and focus.',
            sound: soundOption,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: 'fittrack-reminders',
          },
        });
      }
    }

    // 3. Workout Reminder (Custom workout time)
    if (settings.workoutReminders && shouldSchedule(settings.workoutTime)) {
      const { hour, minute } = parseTime(settings.workoutTime);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💪 Workout Time',
          body: 'Your scheduled session is ready. Consistency builds results!',
          sound: soundOption,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'fittrack-reminders',
        },
      });
    }

    // 4. Daily Readiness / Check-In (Custom check-in time)
    if (settings.checkinReminders && shouldSchedule(settings.checkinTime)) {
      const { hour, minute } = parseTime(settings.checkinTime);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚡ Daily Readiness Check',
          body: 'How are you feeling today? Tap to record your energy level and calibrate advice.',
          sound: soundOption,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'fittrack-reminders',
        },
      });
    }
  } catch (err) {
    console.warn('[notificationService] Failed to reschedule notifications:', err);
  }
}

/**
 * Fires an immediate test notification to verify device permissions and sound/alert presentation
 */
export async function sendTestNotification(soundEnabled = true): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 FitTrack Notifications Active',
        body: 'Custom alert timings and reminders are active and ready to keep you accountable!',
        sound: soundEnabled ? 'default' : undefined,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        channelId: 'fittrack-reminders',
      },
    });

    return true;
  } catch (err) {
    console.warn('[notificationService] Failed to send test notification:', err);
    return false;
  }
}
