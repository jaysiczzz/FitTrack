import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import ProgressBar from '@/components/ui/ProgressBar';
import { COLORS } from '@/constants/colors';
import SurfaceCard from '@/components/ui/SurfaceCard';

export interface DailyGoalItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
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
  targetWaterMl = 2000,
  onQuickAddWater,
}: DailyGoalsCardProps) {
  const router = useRouter();

  // Determine completion of goals
  const isNutritionDone = caloriesLogged >= targetCalories * 0.75 || caloriesLogged > 1200;
  const isWorkoutDone = workoutSessionDone || (totalExercisesCount > 0 && completedExercisesCount === totalExercisesCount) || activeMinutes >= 20;
  const isHydrationDone = waterMl >= targetWaterMl;

  const goals: DailyGoalItem[] = [
    {
      id: 'checkin',
      title: 'Daily Readiness Check-In',
      subtitle: isCheckedIn ? 'Completed morning readiness check' : 'Log your mood & energy above',
      icon: '⚡',
      isCompleted: isCheckedIn,
      progressText: isCheckedIn ? '1/1 Done' : 'Pending',
    },
    {
      id: 'nutrition',
      title: 'Nutrition & Fuel Target',
      subtitle: `${caloriesLogged.toLocaleString()} / ${targetCalories.toLocaleString()} kcal`,
      icon: '🥗',
      isCompleted: isNutritionDone,
      progressText: `${Math.min(100, Math.round((caloriesLogged / targetCalories) * 100))}%`,
      actionLabel: 'Log Food',
      onAction: () => router.push('/(screen)/foodlog' as any),
    },
    {
      id: 'workout',
      title: 'Daily Workout Session',
      subtitle: workoutSessionDone
        ? 'Session completed for today!'
        : totalExercisesCount > 0
        ? `${completedExercisesCount}/${totalExercisesCount} exercises complete`
        : 'No exercises started yet',
      icon: '🏋️‍♂️',
      isCompleted: isWorkoutDone,
      progressText: workoutSessionDone ? 'Done' : `${activeMinutes} min`,
      actionLabel: 'Workouts',
      onAction: () => router.push('/(screen)/workouts' as any),
    },
    {
      id: 'hydration',
      title: 'Hydration Target (2.0L)',
      subtitle: `${waterMl.toLocaleString()} / ${targetWaterMl.toLocaleString()} ml`,
      icon: '💧',
      isCompleted: isHydrationDone,
      progressText: `${Math.min(100, Math.round((waterMl / targetWaterMl) * 100))}%`,
      actionLabel: '+250ml',
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
      <View className="flex-row justify-between items-center mb-2.5">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-7 h-7 rounded-lg bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mr-2">
            <Text className="text-xs">🎯</Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm">
              Today's Goals
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px]">
              {completedCount} of {totalCount} completed
            </Text>
          </View>
        </View>

        <View className="bg-accent/15 dark:bg-accent-dark/20 px-2 py-0.5 rounded-md">
          <Text className="text-accent dark:text-accent-dark font-black text-xs">
            {percentage}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar
        percentage={percentage}
        color={COLORS.accent.dark}
        height={8}
        className="mb-3"
      />

      {/* All Completed Celebration Banner */}
      {allCompleted ? (
        <View className="bg-accent/15 dark:bg-accent-dark/20 border border-accent/30 rounded-xl p-2.5 mb-2.5 flex-row items-center">
          <Text className="text-xl mr-2">🏆</Text>
          <View className="flex-1">
            <Text className="text-accent dark:text-accent-dark font-extrabold text-xs">
              All Goals Crushed Today!
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[10px]">
              Phenomenal consistency! You’ve hit all your key targets today.
            </Text>
          </View>
        </View>
      ) : null}

      {/* Goal Items List */}
      <View className="gap-1.5">
        {goals.map((goal) => (
          <View
            key={goal.id}
            className={`flex-row items-center p-2.5 rounded-xl border ${
              goal.isCompleted
                ? 'bg-accent/5 dark:bg-accent-dark/10 border-accent/20'
                : 'bg-input/60 dark:bg-input-dark/60 border-input-border/40 dark:border-input-border-dark/40'
            }`}
          >
            {/* Completion Indicator Icon */}
            <View
              className={`w-6 h-6 rounded-lg items-center justify-center mr-2.5 ${
                goal.isCompleted
                  ? 'bg-accent/20 dark:bg-accent-dark/20'
                  : 'bg-input dark:bg-input-dark'
              }`}
            >
              <Text className="text-xs">
                {goal.isCompleted ? '✓' : goal.icon}
              </Text>
            </View>

            {/* Title & Subtitle */}
            <View className="flex-1 pr-2">
              <Text
                className={`text-xs font-bold leading-tight ${
                  goal.isCompleted
                    ? 'text-text-primary dark:text-text-primary-dark line-through opacity-60'
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
                className={`px-2 py-1 rounded-lg border ${
                  goal.isCompleted
                    ? 'bg-input dark:bg-input-dark border-input-border/60'
                    : 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
                }`}
              >
                <Text
                  className={`text-[10px] font-extrabold ${
                    goal.isCompleted
                      ? 'text-text-muted dark:text-text-muted-dark'
                      : 'text-background dark:text-background-dark'
                  }`}
                >
                  {goal.isCompleted ? 'Done ✓' : goal.actionLabel}
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="bg-input dark:bg-input-dark px-2 py-0.5 rounded-md">
                <Text
                  className={`text-[10px] font-bold ${
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
