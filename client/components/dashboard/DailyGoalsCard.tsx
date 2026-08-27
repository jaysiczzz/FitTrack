import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useToast } from '../../context/ToastContext';

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
  customGoalDone: boolean;
  onToggleCustomGoal: () => void;
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
  customGoalDone,
  onToggleCustomGoal,
}: DailyGoalsCardProps) {
  const router = useRouter();
  const { showSuccess } = useToast();

  // Determine completion of goals
  const isNutritionDone = caloriesLogged >= targetCalories * 0.75 || caloriesLogged > 1200;
  const isWorkoutDone = workoutSessionDone || (totalExercisesCount > 0 && completedExercisesCount === totalExercisesCount) || activeMinutes >= 20;
  const isHydrationDone = waterMl >= targetWaterMl;

  const goals: DailyGoalItem[] = [
    {
      id: 'checkin',
      title: 'Daily Motivation Check-In',
      subtitle: isCheckedIn ? 'Completed morning readiness check' : 'Select your mood & energy above',
      icon: '⚡',
      isCompleted: isCheckedIn,
      progressText: isCheckedIn ? '1/1 Done' : 'Pending',
    },
    {
      id: 'nutrition',
      title: 'Fuel & Nutrition Target',
      subtitle: `${caloriesLogged.toLocaleString()} / ${targetCalories.toLocaleString()} kcal`,
      icon: '🥗',
      isCompleted: isNutritionDone,
      progressText: `${Math.min(100, Math.round((caloriesLogged / targetCalories) * 100))}%`,
      actionLabel: 'Log Food',
      onAction: () => router.push('/(screen)/foodlog' as any),
    },
    {
      id: 'workout',
      title: 'Movement & Workout Session',
      subtitle: workoutSessionDone
        ? 'Workout completed for today!'
        : totalExercisesCount > 0
        ? `${completedExercisesCount}/${totalExercisesCount} exercises completed`
        : 'No workout exercises started yet',
      icon: '🏋️‍♂️',
      isCompleted: isWorkoutDone,
      progressText: workoutSessionDone ? 'Completed' : `${activeMinutes} min`,
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
    <View
      className="bg-surface dark:bg-surface-dark rounded-[24px] p-5 mb-4 border border-input-border dark:border-input-border-dark"
      style={Platform.select({
        web: { boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)' } as any,
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 3,
        },
      })}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mr-2.5">
            <Text className="text-base">🎯</Text>
          </View>
          <View>
            <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm">
              Today's Interactive Goals
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px]">
              {completedCount} of {totalCount} goals completed
            </Text>
          </View>
        </View>

        <View className="bg-accent/15 dark:bg-accent-dark/20 px-2.5 py-1 rounded-full">
          <Text className="text-accent dark:text-accent-dark font-black text-xs">
            {percentage}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="h-2 bg-input dark:bg-input-dark rounded-full overflow-hidden mb-4 border border-input-border/30">
        <View
          className="h-2 rounded-full bg-accent dark:bg-accent-dark"
          style={{ width: `${percentage}%` }}
        />
      </View>

      {/* All Completed Celebration Banner */}
      {allCompleted ? (
        <View className="bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/40 rounded-2xl p-3 mb-3 flex-row items-center">
          <Text className="text-2xl mr-2.5">🏆</Text>
          <View className="flex-1">
            <Text className="text-emerald-400 font-extrabold text-xs">
              All Daily Goals Crushed Today!
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px]">
              Phenomenal consistency! You’ve hit all your key targets today.
            </Text>
          </View>
        </View>
      ) : null}

      {/* Goal Items List */}
      <View className="gap-2">
        {goals.map((goal) => (
          <View
            key={goal.id}
            className={`flex-row items-center p-3 rounded-2xl border ${
              goal.isCompleted
                ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/25'
                : 'bg-input/60 dark:bg-input-dark/60 border-input-border/50 dark:border-input-border-dark/50'
            }`}
          >
            {/* Completion Indicator Icon */}
            <View
              className={`w-7 h-7 rounded-xl items-center justify-center mr-3 ${
                goal.isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400'
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
                className={`text-xs font-bold ${
                  goal.isCompleted
                    ? 'text-text-primary dark:text-text-primary-dark line-through opacity-70'
                    : 'text-text-primary dark:text-text-primary-dark'
                }`}
                numberOfLines={1}
              >
                {goal.title}
              </Text>
              <Text className="text-[11px] text-text-muted dark:text-text-muted-dark" numberOfLines={1}>
                {goal.subtitle}
              </Text>
            </View>

            {/* Action / Progress Badge */}
            {goal.actionLabel && goal.onAction ? (
              <TouchableOpacity
                onPress={goal.onAction}
                activeOpacity={0.7}
                className={`px-2.5 py-1 rounded-xl border ${
                  goal.isCompleted
                    ? 'bg-input dark:bg-input-dark border-input-border'
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
              <View className="bg-input dark:bg-input-dark px-2 py-0.5 rounded-lg">
                <Text
                  className={`text-[10px] font-bold ${
                    goal.isCompleted ? 'text-emerald-400' : 'text-text-muted dark:text-text-muted-dark'
                  }`}
                >
                  {goal.progressText}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
