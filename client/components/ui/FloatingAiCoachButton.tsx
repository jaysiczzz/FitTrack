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

  // Hide the floating button when already inside the AI coach chat or auth screens
  if (!pathname || pathname.includes('ai-coach') || pathname.includes('auth')) {
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
              boxShadow: '0 4px 18px rgba(16, 185, 129, 0.28)',
            } as any,
            default: {
              elevation: 9,
            },
          }),
        ]}
        className="w-13 h-13 rounded-full bg-surface dark:bg-surface-dark border-1.5 border-accent/40 dark:border-accent-dark/50 items-center justify-center"
      >
        <View className="w-9.5 h-9.5 rounded-full bg-accent/15 dark:bg-accent-dark/20 items-center justify-center">
          <Ionicons name="sparkles" size={20} color={colors.accent} />
        </View>

        {/* Active Online Status Dot */}
        <View className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-surface dark:border-surface-dark" />
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
