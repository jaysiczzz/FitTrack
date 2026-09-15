import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, useThemeColors } from '@/constants/colors';
import SurfaceCard from '@/components/ui/SurfaceCard';

export interface DashboardWorkoutExercise {
  id: string;
  name: string;
  isCompleted: boolean;
}

interface TodayWorkoutCardProps {
  exercises: DashboardWorkoutExercise[];
}

export default function TodayWorkoutCard({
  exercises,
}: TodayWorkoutCardProps) {
  const router = useRouter();
  const { colors } = useThemeColors();
  const completedCount = exercises.filter((e) => e.isCompleted).length;

  return (
    <SurfaceCard className="mb-3">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
            Today's Workout
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs">
            {exercises.length > 0
              ? `${completedCount} of ${exercises.length} exercises complete`
              : 'No active session started'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(screen)/workouts' as any)}
          activeOpacity={0.7}
          className="bg-input dark:bg-input-dark px-2.5 py-1 rounded-lg border border-input-border dark:border-input-border-dark"
        >
          <Text className="text-accent dark:text-accent-dark font-semibold text-xs">
            {exercises.length > 0 ? 'Open' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exercises List or Empty State */}
      {exercises.length === 0 ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(screen)/workouts' as any)}
          className="bg-input dark:bg-input-dark rounded-xl p-3.5 flex-row items-center justify-between border border-input-border dark:border-input-border-dark"
        >
          <View className="flex-1 mr-3">
            <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xs">
              Ready to train today?
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
              Choose your routine or select exercises from the library.
            </Text>
          </View>
          <View className="bg-accent dark:bg-accent-dark px-3 py-1.5 rounded-lg">
            <Text className="text-white dark:text-background-dark font-bold text-xs">
              Start
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View className="gap-1.5">
          {exercises.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              activeOpacity={0.7}
              onPress={() => router.push('/(screen)/workouts' as any)}
              className="flex-row items-center justify-between p-2.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <Ionicons
                  name={ex.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={ex.isCompleted ? colors.accent : colors.textMuted}
                  style={{ marginRight: 8 }}
                />
                <Text
                  className={`text-xs font-medium flex-1 ${
                    ex.isCompleted
                      ? 'text-text-muted dark:text-text-muted-dark line-through'
                      : 'text-text-primary dark:text-text-primary-dark'
                  }`}
                  numberOfLines={1}
                >
                  {ex.name}
                </Text>
              </View>
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px]">
                {ex.isCompleted ? 'Done' : 'Pending'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SurfaceCard>
  );
}
