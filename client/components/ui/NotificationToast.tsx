import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import ToastPortal from './ToastPortal';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface NotificationToastProps {
  visible: boolean;
  message: string;
  description?: string;
  type?: NotificationType;
  icon?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number;
  topOffset?: number;
  bottomOffset?: number;
}

const TYPE_CONFIG: Record<
  NotificationType,
  { borderColor: string; bgBadge: string; defaultIcon: keyof typeof Ionicons.glyphMap }
> = {
  success: {
    borderColor: 'border-emerald-500/30 dark:border-emerald-400/30',
    bgBadge: 'bg-emerald-500/15 dark:bg-emerald-400/20 border border-emerald-500/25 dark:border-emerald-400/40',
    defaultIcon: 'checkmark-circle',
  },
  info: {
    borderColor: 'border-sky-500/30 dark:border-sky-400/30',
    bgBadge: 'bg-sky-500/15 dark:bg-sky-400/20 border border-sky-500/25 dark:border-sky-400/40',
    defaultIcon: 'information-circle',
  },
  warning: {
    borderColor: 'border-amber-500/30 dark:border-amber-400/30',
    bgBadge: 'bg-amber-500/15 dark:bg-amber-400/20 border border-amber-500/25 dark:border-amber-400/40',
    defaultIcon: 'alert-circle',
  },
  error: {
    borderColor: 'border-rose-500/30 dark:border-rose-400/30',
    bgBadge: 'bg-rose-500/15 dark:bg-rose-400/20 border border-rose-500/25 dark:border-rose-400/40',
    defaultIcon: 'close-circle',
  },
};

export default function NotificationToast({
  visible,
  message,
  description,
  type = 'success',
  icon,
  iconName,
  actionLabel,
  onAction,
  onDismiss,
  duration = 2000,
  topOffset,
}: NotificationToastProps) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const [toastVisible, setToastVisible] = useState(visible);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-60)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const useNative = Platform.OS !== 'web';

    if (visible) {
      setToastVisible(true);
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: useNative,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          damping: 18,
          stiffness: 240,
          mass: 0.8,
          useNativeDriver: useNative,
        }),
      ]).start();

      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          handleDismiss();
        }, duration);
      }
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: useNative,
        }),
        Animated.timing(translateYAnim, {
          toValue: -60,
          duration: 180,
          useNativeDriver: useNative,
        }),
      ]).start(() => {
        setToastVisible(false);
      });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, message, description, duration]);

  const handleDismiss = () => {
    const useNative = Platform.OS !== 'web';
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: useNative,
      }),
      Animated.timing(translateYAnim, {
        toValue: -60,
        duration: 180,
        useNativeDriver: useNative,
      }),
    ]).start(() => {
      setToastVisible(false);
      onDismiss();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Detect upward swipe with higher vertical movement than horizontal
        return gestureState.dy < -6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateYAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If swiped up by >20px or with upward flick velocity, dismiss immediately
        if (gestureState.dy < -20 || gestureState.vy < -0.4) {
          handleDismiss();
        } else {
          // Snap back to top position
          Animated.spring(translateYAnim, {
            toValue: 0,
            damping: 18,
            stiffness: 240,
            mass: 0.8,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        }
      },
    })
  ).current;

  if (!toastVisible && !visible) return null;

  const resolvedTop =
    topOffset ??
    (insets.top > 0 ? insets.top + 8 : Platform.OS === 'ios' ? 52 : 36);

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.success;
  const iconColor = {
    success: isDark ? '#34D399' : colors.accent,
    info: isDark ? '#38BDF8' : colors.info,
    warning: isDark ? '#FBBF24' : colors.warning,
    error: isDark ? '#FB7185' : colors.danger,
  }[type];

  return (
    <ToastPortal visible={toastVisible || visible}>
      <View style={styles.overlay}>
        <View
          style={[styles.container, { top: resolvedTop }]}
        >
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.toastWrapper,
              Platform.select({
                web: {
                  boxShadow:
                    '0 12px 36px rgba(0, 0, 0, 0.45), 0 2px 10px rgba(0, 0, 0, 0.3)',
                } as any,
                default: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 12,
                },
              }),
              {
                opacity: opacityAnim,
                transform: [{ translateY: translateYAnim }],
              },
            ]}
          >
            <View
              className={`flex-row items-center bg-surface dark:bg-surface-dark border ${config.borderColor} rounded-2xl p-3.5`}
            >
              {/* Icon Badge */}
              <View
                className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${config.bgBadge}`}
              >
                {iconName ? (
                  <Ionicons name={iconName} size={20} color={iconColor} />
                ) : icon ? (
                  <Text className="text-base">{icon}</Text>
                ) : (
                  <Ionicons name={config.defaultIcon} size={20} color={iconColor} />
                )}
              </View>

              {/* Text Content */}
              <View className="flex-1 pr-2">
                <Text
                  className="text-text-primary dark:text-text-primary-dark font-extrabold text-xs leading-4"
                  style={{ color: colors.textPrimary }}
                  numberOfLines={2}
                >
                  {message}
                </Text>
                {description ? (
                  <Text
                    className="text-text-muted dark:text-text-muted-dark text-[11px] font-medium mt-0.5 leading-3.5"
                    style={{ color: colors.textMuted }}
                    numberOfLines={2}
                  >
                    {description}
                  </Text>
                ) : null}
              </View>

              {/* Optional Action Button */}
              {actionLabel && onAction ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    onAction();
                    handleDismiss();
                  }}
                  className="bg-accent dark:bg-accent-dark px-3.5 py-1.5 rounded-2xl mr-2"
                >
                  <Text className="text-white font-bold text-[11px]">
                    {actionLabel}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {/* Close Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleDismiss}
                className="w-6 h-6 rounded-full bg-input dark:bg-input-dark items-center justify-center"
              >
                <Text className="text-text-muted dark:text-text-muted-dark font-bold text-[10px]">
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>
    </ToastPortal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2147483647,
        } as any)
      : {
          ...StyleSheet.absoluteFill,
          zIndex: 999999,
          elevation: 999999,
        }),
    backgroundColor: 'transparent',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  container: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2147483647,
    elevation: 999999,
    paddingHorizontal: 16,
    borderRadius: 12,
    pointerEvents: 'box-none',
  },
  toastWrapper: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    zIndex: 2147483647,
    pointerEvents: 'auto',
  },
});
