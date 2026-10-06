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
              boxShadow: '0 6px 22px rgba(16, 185, 129, 0.45)',
            } as any,
            default: {
              elevation: 9,
            },
          }),
        ]}
        className="w-13 h-13 rounded-full bg-accent dark:bg-accent-dark border-2 border-surface dark:border-surface-dark items-center justify-center shadow-lg"
      >
        <Ionicons name="sparkles" size={22} color={colors.accentContrast} />
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
