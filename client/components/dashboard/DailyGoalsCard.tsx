import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '@/components/ui/ProgressBar';
import SurfaceCard from '@/components/ui/SurfaceCard';

import { WorkoutRoutineTemplate } from '@/components/workouts/workoutTypes';

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
  isNutritionDone?: boolean;
  waterMl: number;
  targetWaterMl?: number;
  onQuickAddWater: (amountMl: number) => void;
  onCheckInPress?: () => void;
  scheduledRoutine?: WorkoutRoutineTemplate | null;
  isRestDay?: boolean;
}

export default function DailyGoalsCard({
  isCheckedIn,
  caloriesLogged,
  targetCalories,
  activeMinutes,
  completedExercisesCount,
  totalExercisesCount,
  workoutSessionDone,
  isNutritionDone = false,
  waterMl,
  targetWaterMl = 2500,
  onQuickAddWater,
  onCheckInPress,
  scheduledRoutine,
  isRestDay = false,
}: DailyGoalsCardProps) {
  const router = useRouter();

  const isNutritionDoneResolved = Boolean(isNutritionDone);
  const isWorkoutDoneResolved = Boolean(workoutSessionDone);
  const isHydrationDone = waterMl >= targetWaterMl;

  // Resolve workout goal representation from weekly split
  let workoutTitle = 'Daily Workout Session';
  let workoutSubtitle = 'No exercises started yet';
  let workoutCompleted = isWorkoutDoneResolved;
  let workoutProgressText = isWorkoutDoneResolved ? 'Done ✓' : `${activeMinutes} min`;
  let workoutActionLabel: string | undefined = isWorkoutDoneResolved ? 'History' : 'Workouts';

  if (isRestDay) {
    workoutTitle = 'Rest & Recovery Day';
    if (isWorkoutDoneResolved) {
      workoutSubtitle = `Rest day · Workout done (${activeMinutes || 35} min)`;
      workoutCompleted = true;
      workoutProgressText = 'Done 🏆';
      workoutActionLabel = 'History';
    } else {
      workoutSubtitle = 'Weekly recovery target';
      workoutCompleted = true;
      workoutProgressText = 'Rest ✓';
      workoutActionLabel = 'Workouts';
    }
  } else if (scheduledRoutine) {
    workoutTitle = scheduledRoutine.title;
    if (isWorkoutDoneResolved) {
      workoutSubtitle = `Session completed 🏆 (${activeMinutes || scheduledRoutine.estimatedDurationMinutes || 35} min)`;
      workoutCompleted = true;
      workoutProgressText = 'Done ✓';
      workoutActionLabel = 'History';
    } else if (totalExercisesCount > 0) {
      workoutSubtitle = `${completedExercisesCount}/${totalExercisesCount} exercises checked`;
      workoutCompleted = false;
      workoutProgressText = `${activeMinutes} min`;
      workoutActionLabel = 'Resume';
    } else {
      const exCount = scheduledRoutine.exercises?.length || 4;
      workoutSubtitle = `${exCount} exercises planned`;
      workoutCompleted = false;
      workoutProgressText = `${scheduledRoutine.estimatedDurationMinutes || 45} min`;
      workoutActionLabel = 'Start';
    }
  } else {
    if (isWorkoutDoneResolved) {
      workoutSubtitle = 'Session completed 🏆';
      workoutCompleted = true;
      workoutProgressText = 'Done ✓';
      workoutActionLabel = 'History';
    } else if (totalExercisesCount > 0) {
      workoutSubtitle = `${completedExercisesCount}/${totalExercisesCount} exercises checked (In Progress)`;
      workoutCompleted = false;
      workoutProgressText = `${activeMinutes} min`;
      workoutActionLabel = 'Resume';
    } else {
      workoutSubtitle = 'No exercises started yet';
      workoutCompleted = false;
      workoutProgressText = `${activeMinutes} min`;
      workoutActionLabel = 'Workouts';
    }
  }

  const goals: DailyGoalItem[] = [
    {
      id: 'checkin',
      title: 'Daily Readiness Check-In',
      subtitle: isCheckedIn ? 'Completed morning readiness check' : 'Log your mood and energy above',
      isCompleted: isCheckedIn,
      progressText: isCheckedIn ? 'Done ✓' : 'Pending',
      actionLabel: isCheckedIn ? undefined : (onCheckInPress ? 'Check In' : undefined),
      onAction: onCheckInPress,
    },
    {
      id: 'nutrition',
      title: 'Nutrition & Daily Intake',
      subtitle: isNutritionDoneResolved
        ? `Completed · ${caloriesLogged.toLocaleString()} / ${targetCalories.toLocaleString()} kcal`
        : `${caloriesLogged.toLocaleString()} / ${targetCalories.toLocaleString()} kcal (In Progress)`,
      isCompleted: isNutritionDoneResolved,
      progressText: isNutritionDoneResolved ? 'Done ✓' : `${Math.min(100, Math.round((caloriesLogged / targetCalories) * 100))}%`,
      actionLabel: isNutritionDoneResolved ? 'View Food' : 'Log Food',
      onAction: () => router.push('/(screen)/foodlog' as any),
    },
    {
      id: 'workout',
      title: workoutTitle,
      subtitle: workoutSubtitle,
      isCompleted: workoutCompleted,
      progressText: workoutProgressText,
      actionLabel: workoutActionLabel,
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
        height={6}
        color="#10B981"
        className="mb-3"
      />

      {/* All Completed Banner */}
      {allCompleted ? (
        <View className="bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 rounded-2xl p-3 mb-3 flex-row items-center">
          <View className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 items-center justify-center mr-2.5">
            <Ionicons name="checkmark" size={14} color="#10B981" />
          </View>
          <View className="flex-1">
            <Text className="text-accent dark:text-accent-dark font-bold text-xs">
              All Goals Completed Today 🎯
            </Text>
          </View>
        </View>
      ) : null}

      {/* Goal Items List */}
      <View className="gap-2">
        {goals.map((goal) => (
          <View
            key={goal.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: goal.isCompleted }}
            accessibilityLabel={`${goal.title}: ${goal.isCompleted ? 'Completed' : 'Pending'}`}
            className={`flex-row items-center p-3 rounded-2xl border ${
              goal.isCompleted
                ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20'
                : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
            }`}
          >
            {/* Completion Indicator Icon */}
            {goal.isCompleted ? (
              <View className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 items-center justify-center mr-3">
                <Ionicons name="checkmark" size={13} color="#10B981" />
              </View>
            ) : (
              <View className="w-6 h-6 rounded-full border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
                <View className="w-1.5 h-1.5 rounded-full bg-text-muted/40" />
              </View>
            )}

            {/* Title & Subtitle */}
            <View className="flex-1 pr-2">
              <Text
                className={`text-xs font-bold leading-tight ${
                  goal.isCompleted && !(goal.id === 'workout' && isRestDay && !workoutSessionDone)
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
            {goal.isCompleted ? (
              <View className="px-2.5 py-1 rounded-full border bg-emerald-500/15 border-emerald-500/30">
                <Text className="text-[10px] font-bold uppercase tracking-wide text-accent dark:text-accent-dark">
                  {goal.progressText || 'Done ✓'}
                </Text>
              </View>
            ) : goal.actionLabel && goal.onAction ? (
              <TouchableOpacity
                onPress={goal.onAction}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${goal.actionLabel} for ${goal.title}`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="px-3 py-1 items-center justify-center rounded-xl bg-accent dark:bg-accent-dark border border-accent dark:border-accent-dark active:opacity-75"
              >
                <Text className="text-xs font-bold text-accent-contrast dark:text-accent-contrast-dark">
                  {goal.actionLabel}
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="px-2.5 py-1 rounded-full border bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark">
                <Text className="text-[10px] font-bold uppercase tracking-wide text-text-muted dark:text-text-muted-dark">
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
