import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  StyleSheet,
} from 'react-native';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface NotificationToastProps {
  visible: boolean;
  message: string;
  description?: string;
  type?: NotificationType;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number;
  bottomOffset?: number;
}

const TYPE_CONFIG: Record<
  NotificationType,
  { borderColor: string; bgBadge: string; defaultIcon: string; textColor: string }
> = {
  success: {
    borderColor: 'border-emerald-500/50 dark:border-emerald-400/50',
    bgBadge: 'bg-emerald-500/15 dark:bg-emerald-500/25',
    defaultIcon: '✓',
    textColor: 'text-emerald-400',
  },
  info: {
    borderColor: 'border-sky-500/50 dark:border-sky-400/50',
    bgBadge: 'bg-sky-500/15 dark:bg-sky-500/25',
    defaultIcon: '💡',
    textColor: 'text-sky-400',
  },
  warning: {
    borderColor: 'border-amber-500/50 dark:border-amber-400/50',
    bgBadge: 'bg-amber-500/15 dark:bg-amber-500/25',
    defaultIcon: '⚠️',
    textColor: 'text-amber-400',
  },
  error: {
    borderColor: 'border-rose-500/50 dark:border-rose-400/50',
    bgBadge: 'bg-rose-500/15 dark:bg-rose-500/25',
    defaultIcon: '✕',
    textColor: 'text-rose-400',
  },
};

export default function NotificationToast({
  visible,
  message,
  description,
  type = 'success',
  icon,
  actionLabel,
  onAction,
  onDismiss,
  duration = 4000,
  bottomOffset = 28,
}: NotificationToastProps) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(40)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          damping: 18,
          stiffness: 240,
          mass: 0.8,
          useNativeDriver: true,
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
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 40,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, message, description, duration]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 40,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.success;
  const displayIcon = icon || config.defaultIcon;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { bottom: bottomOffset }]}
    >
      <Animated.View
        style={[
          styles.toastWrapper,
          Platform.select({
            web: {
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45), 0 2px 10px rgba(0, 0, 0, 0.3)',
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
          className={`flex-row items-center bg-surface/95 dark:bg-surface-dark/95 border ${config.borderColor} rounded-2xl p-3.5 backdrop-blur-md`}
        >
          {/* Icon Badge */}
          <View
            className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${config.bgBadge}`}
          >
            <Text className="text-base">{displayIcon}</Text>
          </View>

          {/* Text Content */}
          <View className="flex-1 pr-2">
            <Text
              className="text-text-primary dark:text-text-primary-dark font-extrabold text-xs leading-4"
              numberOfLines={2}
            >
              {message}
            </Text>
            {description ? (
              <Text
                className="text-text-muted dark:text-text-muted-dark text-[11px] font-medium mt-0.5 leading-3.5"
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
              className="bg-accent dark:bg-accent-dark px-3 py-1.5 rounded-xl mr-2"
            >
              <Text className="text-background dark:text-background-dark font-black text-[11px]">
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
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  toastWrapper: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
  },
});
