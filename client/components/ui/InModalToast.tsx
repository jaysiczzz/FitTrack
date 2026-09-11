import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  StyleSheet,
} from 'react-native';

export interface InModalToastProps {
  visible: boolean;
  message: string;
  description?: string;
  icon?: string;
  onDismiss: () => void;
  duration?: number;
  bottomOffset?: number;
}

export default function InModalToast({
  visible,
  message,
  description,
  icon = '✓',
  onDismiss,
  duration = 2500,
  bottomOffset = 24,
}: InModalToastProps) {
  const [shouldRender, setShouldRender] = useState(visible);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const useNative = Platform.OS !== 'web';

    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: useNative,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 280,
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
          toValue: 30,
          duration: 180,
          useNativeDriver: useNative,
        }),
      ]).start(() => {
        setShouldRender(false);
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
        duration: 160,
        useNativeDriver: useNative,
      }),
      Animated.timing(translateYAnim, {
        toValue: 20,
        duration: 160,
        useNativeDriver: useNative,
      }),
    ]).start(() => {
      setShouldRender(false);
      onDismiss();
    });
  };

  if (!shouldRender) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { bottom: bottomOffset }]}
    >
      <Animated.View
        style={[
          styles.toastWrapper,
          {
            opacity: opacityAnim,
            transform: [{ translateY: translateYAnim }],
          },
          Platform.select({
            web: { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)' } as any,
            default: { elevation: 14 },
          }),
        ]}
      >
        <View className="bg-surface dark:bg-surface-dark border border-accent/60 dark:border-accent-dark/60 rounded-2xl p-3 flex-row items-center shadow-xl">
          <View className="w-8 h-8 rounded-xl bg-accent/15 dark:bg-accent-dark/25 items-center justify-center mr-2.5 shrink-0">
            <Text className="text-accent dark:text-accent-dark font-black text-sm">
              {icon}
            </Text>
          </View>
          <View className="flex-1 mr-2">
            <Text
              className="text-text-primary dark:text-text-primary-dark font-extrabold text-xs leading-tight"
              numberOfLines={1}
            >
              {message}
            </Text>
            {Boolean(description) && (
              <Text
                className="text-text-muted dark:text-text-muted-dark text-[11px] font-medium mt-0.5 leading-tight"
                numberOfLines={1}
              >
                {description}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleDismiss}
            activeOpacity={0.7}
            className="w-6 h-6 rounded-full bg-input dark:bg-input-dark items-center justify-center shrink-0"
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
  },
  toastWrapper: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
  },
});
