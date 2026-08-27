import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';

export interface DashboardWorkoutExercise {
  id: string;
  name: string;
  isCompleted: boolean;
}

interface TodayWorkoutCardProps {
  exercises: DashboardWorkoutExercise[];
  completedSessionsCount: number;
  activeMinutes: number;
}

export default function TodayWorkoutCard({
  exercises,
  completedSessionsCount,
  activeMinutes,
}: TodayWorkoutCardProps) {
  const router = useRouter();
  const completedCount = exercises.filter((e) => e.isCompleted).length;
  const isAllDone = exercises.length > 0 && completedCount === exercises.length;

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
            <Text className="text-base">🏋️‍♂️</Text>
          </View>
          <View>
            <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm">
              Today's Workout Session
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px]">
              {exercises.length > 0
                ? `${completedCount} of ${exercises.length} exercises complete`
                : 'No active session started'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(screen)/workouts' as any)}
          activeOpacity={0.7}
          className="bg-accent/15 dark:bg-accent-dark/20 px-2.5 py-1 rounded-xl"
        >
          <Text className="text-accent dark:text-accent-dark font-extrabold text-[11px]">
            {exercises.length > 0 ? 'Open Workout →' : '+ Start →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exercises List or Empty State */}
      {exercises.length === 0 ? (
        <View className="bg-input/60 dark:bg-input-dark/60 rounded-2xl p-4 items-center">
          <Text className="text-2xl mb-1">💪</Text>
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs text-center">
            Ready to train today?
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-[11px] text-center mt-0.5 mb-2.5">
            Select exercises from the library or load your customized routine.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(screen)/workouts' as any)}
            className="bg-accent dark:bg-accent-dark px-4 py-1.5 rounded-xl"
          >
            <Text className="text-background dark:text-background-dark font-black text-xs">
              Go to Workouts
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="gap-2">
          {exercises.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              activeOpacity={0.8}
              onPress={() => router.push('/(screen)/workouts' as any)}
              className="flex-row items-center p-2.5 rounded-xl bg-input/60 dark:bg-input-dark/60 border border-input-border/40"
            >
              <Text
                className={`mr-2.5 text-xs ${
                  ex.isCompleted ? 'text-accent dark:text-accent-dark font-bold' : 'text-text-muted'
                }`}
              >
                {ex.isCompleted ? '✔︎' : '○'}
              </Text>
              <Text
                className={`text-xs flex-1 ${
                  ex.isCompleted
                    ? 'line-through text-text-muted dark:text-text-muted-dark'
                    : 'text-text-primary dark:text-text-primary-dark font-semibold'
                }`}
                numberOfLines={1}
              >
                {ex.name}
              </Text>
              <View
                className={`px-2 py-0.5 rounded-md ${
                  ex.isCompleted ? 'bg-accent/15' : 'bg-input dark:bg-input-dark'
                }`}
              >
                <Text
                  className={`text-[9px] font-extrabold uppercase ${
                    ex.isCompleted ? 'text-accent dark:text-accent-dark' : 'text-text-muted'
                  }`}
                >
                  {ex.isCompleted ? 'Done' : 'Active'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
