import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import UnifiedFitnessCalendar from '@/components/calendar/UnifiedFitnessCalendar';
import { useThemeColors } from '@/constants/colors';

export default function CalendarScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 115 }}
      >
        {/* Top Header with Back Navigation */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2.5">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
              className="w-10 h-10 rounded-2xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
            >
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-black text-text-primary dark:text-text-primary-dark tracking-tight">
                Activity Calendar 📅
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark font-normal">
                Unified workouts, nutrition, and daily consistency
              </Text>
            </View>
          </View>
        </View>

        {/* The Unified Activity Calendar */}
        <UnifiedFitnessCalendar
          initialFilter="all"
          onSwitchToTodayWorkout={() => router.push('/(screen)/workouts' as any)}
          onSwitchToTodayNutrition={() => router.push('/(screen)/foodlog' as any)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
