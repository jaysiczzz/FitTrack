import { Platform, Vibration } from 'react-native';

/**
 * Mobile Haptic & Vibration feedback utility
 * Works reliably on both Android and iOS devices using React Native's core Vibration API.
 */
export const hapticFeedback = {
  /**
   * Subtle tick feedback (e.g. checkbox toggle, tab change, small button tap)
   */
  light: () => {
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(25);
      } catch {}
    }
  },

  /**
   * Medium impact feedback (e.g. completing a workout set, quick meal log)
   */
  medium: () => {
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(45);
      } catch {}
    }
  },

  /**
   * Prominent double pulse feedback (e.g. workout session finished, macro goal reached)
   */
  success: () => {
    if (Platform.OS !== 'web') {
      try {
        // [wait, vibrate, wait, vibrate]
        Vibration.vibrate([0, 35, 70, 50]);
      } catch {}
    }
  },

  /**
   * Warning / error buzz
   */
  warning: () => {
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate([0, 60, 40, 60]);
      } catch {}
    }
  },
};
