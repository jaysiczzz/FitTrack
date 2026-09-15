import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStorage } from './authStorage';

export interface NotificationSettings {
  mealReminders: boolean;
  hydrationReminders: boolean;
  workoutReminders: boolean;
  checkinReminders: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  mealReminders: true,
  hydrationReminders: true,
  workoutReminders: true,
  checkinReminders: true,
};

// Configure foreground presentation behavior (Alert banner + sound on native)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Configure Android notification channel
 */
async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('fittrack-reminders', {
      name: 'FitTrack Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0D7A57',
      sound: 'default',
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
 * Load saved notification settings for user
 */
export async function getNotificationSettings(userId?: string | null): Promise<NotificationSettings> {
  try {
    const key = authStorage.getScopedKey(userId, 'fittrack_notification_settings');
    const saved = await AsyncStorage.getItem(key);
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn('[notificationService] Error loading settings:', err);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

/**
 * Save notification settings and update schedules
 */
export async function saveNotificationSettings(
  settings: NotificationSettings,
  userId?: string | null
): Promise<void> {
  try {
    const key = authStorage.getScopedKey(userId, 'fittrack_notification_settings');
    await AsyncStorage.setItem(key, JSON.stringify(settings));

    if (Platform.OS !== 'web') {
      await rescheduleAllNotifications(settings);
    }
  } catch (err) {
    console.warn('[notificationService] Error saving settings:', err);
  }
}

/**
 * Reschedules all active reminders according to preferences
 */
export async function rescheduleAllNotifications(settings: NotificationSettings): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    // Clear previously scheduled FitTrack notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const hasPermission = await hasNotificationPermission();
    if (!hasPermission) return;

    // 1. Meal Reminders
    if (settings.mealReminders) {
      // Breakfast (8:30 AM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🍳 Breakfast Reminder',
          body: 'Fuel your day with quality protein and wholesome carbs!',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 8,
          minute: 30,
          channelId: 'fittrack-reminders',
        },
      });

      // Lunch (12:30 PM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🥗 Lunch Time',
          body: 'Log your midday meal to stay on top of your macros!',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 12,
          minute: 30,
          channelId: 'fittrack-reminders',
        },
      });

      // Dinner (7:00 PM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🍽️ Dinner Check-In',
          body: 'Wrap up your daily nutrition and hit your remaining calorie target.',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 19,
          minute: 0,
          channelId: 'fittrack-reminders',
        },
      });
    }

    // 2. Hydration Reminders (11:00 AM and 3:00 PM)
    if (settings.hydrationReminders) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Hydration Check',
          body: 'Drink a glass of water! Aim to reach your 2,000 ml target today.',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 11,
          minute: 0,
          channelId: 'fittrack-reminders',
        },
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Midday Water Break',
          body: 'Keep hydrated for optimal energy, recovery, and focus.',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 15,
          minute: 0,
          channelId: 'fittrack-reminders',
        },
      });
    }

    // 3. Workout Reminder (5:30 PM)
    if (settings.workoutReminders) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💪 Workout Time',
          body: "Your daily session is ready. Consistency builds results!",
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 17,
          minute: 30,
          channelId: 'fittrack-reminders',
        },
      });
    }

    // 4. Daily Readiness / Check-In (9:00 AM)
    if (settings.checkinReminders) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚡ Daily Readiness Check',
          body: 'How are you feeling today? Tap to record your energy level.',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
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
export async function sendTestNotification(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 FitTrack Notifications Active',
        body: 'Local notifications are configured and ready to keep you on track!',
        sound: 'default',
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
