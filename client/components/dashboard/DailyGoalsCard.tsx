import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '@/components/ui/ProgressBar';
import { COLORS, useThemeColors } from '@/constants/colors';
import SurfaceCard from '@/components/ui/SurfaceCard';

export interface DailyGoalItem {
  id: string;
  title: string;
  subtitle: string;
  isCompleted: boolean;
  progressText?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface DailyGoalsCardProps {
  isCheckedIn: boolean;
  caloriesLogged: number;
  targetCalories: number;
  activeMinutes: number;
  completedExercisesCount: number;
  totalExercisesCount: number;
  workoutSessionDone: boolean;
  waterMl: number;
  targetWaterMl?: number;
  onQuickAddWater: (amountMl: number) => void;
}

export default function DailyGoalsCard({
  isCheckedIn,
  caloriesLogged,
  targetCalories,
  activeMinutes,
  completedExercisesCount,
  totalExercisesCount,
  workoutSessionDone,
  waterMl,
  targetWaterMl = 2500,
  onQuickAddWater,
}: DailyGoalsCardProps) {
  const router = useRouter();
  const { colors } = useThemeColors();

  const isNutritionDone = caloriesLogged >= targetCalories * 0.75 || caloriesLogged > 1200;
  const isWorkoutDone = workoutSessionDone || (totalExercisesCount > 0 && completedExercisesCount === totalExercisesCount) || activeMinutes >= 20;
  const isHydrationDone = waterMl >= targetWaterMl;

  const goals: DailyGoalItem[] = [
    {
      id: 'checkin',
      title: 'Daily Readiness Check-In',
      subtitle: isCheckedIn ? 'Completed morning readiness check' : 'Log your mood and energy above',
      isCompleted: isCheckedIn,
      progressText: isCheckedIn ? '1/1 Done' : 'Pending',
    },
    {
      id: 'nutrition',
      title: 'Nutrition & Calorie Target',
      subtitle: `${caloriesLogged.toLocaleString()} / ${targetCalories.toLocaleString()} kcal`,
      isCompleted: isNutritionDone,
      progressText: `${Math.min(100, Math.round((caloriesLogged / targetCalories) * 100))}%`,
      actionLabel: 'Log Food',
      onAction: () => router.push('/(screen)/foodlog' as any),
    },
    {
      id: 'workout',
      title: 'Daily Workout Session',
      subtitle: workoutSessionDone
        ? 'Session completed for today'
        : totalExercisesCount > 0
        ? `${completedExercisesCount}/${totalExercisesCount} exercises completed`
        : 'No exercises started yet',
      isCompleted: isWorkoutDone,
      progressText: workoutSessionDone ? 'Done' : `${activeMinutes} min`,
      actionLabel: 'Workouts',
      onAction: () => router.push('/(screen)/workouts' as any),
    },
    {
      id: 'hydration',
      title: 'Hydration Target',
      subtitle: `${waterMl.toLocaleString()} / ${targetWaterMl.toLocaleString()} ml`,
      isCompleted: isHydrationDone,
      progressText: `${Math.min(100, Math.round((waterMl / targetWaterMl) * 100))}%`,
      actionLabel: '+250 ml',
      onAction: () => onQuickAddWater(250),
    },
  ];

  const completedCount = goals.filter((g) => g.isCompleted).length;
  const totalCount = goals.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const allCompleted = completedCount === totalCount;

  return (
    <SurfaceCard className="mb-3">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
            Today's Goals
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs">
            {completedCount} of {totalCount} completed
          </Text>
        </View>

        <View className="bg-input dark:bg-input-dark px-2.5 py-1 rounded-full border border-input-border dark:border-input-border-dark">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs">
            {percentage}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar
        percentage={percentage}
        height={5}
        className="mb-3"
      />

      {/* All Completed Banner */}
      {allCompleted ? (
        <View className="bg-accent/10 dark:bg-accent-dark/15 border border-accent/25 dark:border-accent-dark/30 rounded-xl p-3 mb-2.5 flex-row items-center">
          <Ionicons name="checkmark-circle" size={20} color={colors.accent} style={{ marginRight: 8 }} />
          <View className="flex-1">
            <Text className="text-accent dark:text-accent-dark font-bold text-xs">
              All Goals Completed Today
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
              Excellent consistency! All daily targets have been met.
            </Text>
          </View>
        </View>
      ) : null}

      {/* Goal Items List */}
      <View className="gap-2">
        {goals.map((goal) => (
          <View
            key={goal.id}
            className={`flex-row items-center p-3 rounded-xl border ${
              goal.isCompleted
                ? 'bg-accent/5 dark:bg-accent-dark/10 border-accent/20 dark:border-accent-dark/25'
                : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
            }`}
          >
            {/* Completion Indicator Icon */}
            <View className="mr-2.5">
              <Ionicons
                name={goal.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={goal.isCompleted ? colors.accent : colors.textMuted}
              />
            </View>

            {/* Title & Subtitle */}
            <View className="flex-1 pr-2">
              <Text
                className={`text-xs font-semibold leading-tight ${
                  goal.isCompleted
                    ? 'text-text-muted dark:text-text-muted-dark line-through'
                    : 'text-text-primary dark:text-text-primary-dark'
                }`}
              >
                {goal.title}
              </Text>
              <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5 leading-snug">
                {goal.subtitle}
              </Text>
            </View>

            {/* Action / Progress Badge */}
            {goal.actionLabel && goal.onAction ? (
              <TouchableOpacity
                onPress={goal.onAction}
                activeOpacity={0.7}
                className={`px-2.5 py-1 rounded-lg border ${
                  goal.isCompleted
                    ? 'bg-transparent border-input-border dark:border-input-border-dark'
                    : 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    goal.isCompleted
                      ? 'text-text-muted dark:text-text-muted-dark'
                      : 'text-white dark:text-background-dark'
                  }`}
                >
                  {goal.isCompleted ? 'Done' : goal.actionLabel}
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="bg-surface dark:bg-surface-dark px-2 py-0.5 rounded-md border border-input-border dark:border-input-border-dark">
                <Text
                  className={`text-[10px] font-semibold ${
                    goal.isCompleted ? 'text-accent dark:text-accent-dark' : 'text-text-muted dark:text-text-muted-dark'
                  }`}
                >
                  {goal.progressText}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </SurfaceCard>
  );
}
