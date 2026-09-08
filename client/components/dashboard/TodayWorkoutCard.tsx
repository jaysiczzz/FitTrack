import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
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
  const completedCount = exercises.filter((e) => e.isCompleted).length;

  return (
    <SurfaceCard className="mb-3">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-7 h-7 rounded-lg bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mr-2">
            <Text className="text-xs">🏋️‍♂️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm">
              Today's Workout
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
          className="bg-accent/15 dark:bg-accent-dark/20 px-2.5 py-1 rounded-lg"
        >
          <Text className="text-accent dark:text-accent-dark font-bold text-[11px]">
            {exercises.length > 0 ? 'Open →' : '+ Start →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exercises List or Empty State */}
      {exercises.length === 0 ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(screen)/workouts' as any)}
          className="bg-input/60 dark:bg-input-dark/60 rounded-xl p-3.5 flex-row items-center justify-between border border-input-border/40 dark:border-input-border-dark/40"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <Text className="text-xl mr-2.5">💪</Text>
            <View className="flex-1">
              <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs">
                Ready to train today?
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px]">
                Choose your routine or select exercises from the library.
              </Text>
            </View>
          </View>
          <View className="bg-accent dark:bg-accent-dark px-3 py-1.5 rounded-lg">
            <Text className="text-background dark:text-background-dark font-black text-[11px]">
              Start
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View className="gap-2">
          {exercises.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              activeOpacity={0.8}
              onPress={() => router.push('/(screen)/workouts' as any)}
              className="flex-row items-center p-2.5 rounded-xl bg-input/60 dark:bg-input-dark/60 border border-input-border/40 dark:border-input-border-dark/40"
            >
              <Text
                className={`mr-2.5 text-xs ${
                  ex.isCompleted ? 'text-accent dark:text-accent-dark font-bold' : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                {ex.isCompleted ? '✔︎' : '○'}
              </Text>
              <Text
                className={`text-xs flex-1 mr-2 leading-tight ${
                  ex.isCompleted
                    ? 'line-through text-text-muted dark:text-text-muted-dark'
                    : 'text-text-primary dark:text-text-primary-dark font-semibold'
                }`}
                numberOfLines={2}
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
                    ex.isCompleted ? 'text-accent dark:text-accent-dark' : 'text-text-muted dark:text-text-muted-dark'
                  }`}
                >
                  {ex.isCompleted ? 'Done' : 'Active'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SurfaceCard>
  );
}
