import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

export default function FloatingAiCoachButton() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();

  // Hide the floating button when inside AI coach chat, sub-screens, or auth screens
  if (
    !pathname ||
    pathname.includes('ai-coach') ||
    pathname.includes('settings') ||
    pathname.includes('calendar') ||
    pathname.includes('notifications') ||
    pathname.includes('admin') ||
    pathname.includes('auth')
  ) {
    return null;
  }

  const bottomPosition = Math.max(12, insets.bottom) + 68;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlayContainer, { bottom: bottomPosition }]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Chat with FitTrack AI Coach"
        onPress={() => router.push('/(screen)/ai-coach' as any)}
        style={[
          styles.buttonContainer,
          Platform.select({
            web: {
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
            } as any,
            default: {
              elevation: 8,
            },
          }),
        ]}
        className="w-[50px] h-[50px] rounded-full bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center shadow-lg"
      >
        <Ionicons name="chatbubble-ellipses" size={22} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 990,
  },
  buttonContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
