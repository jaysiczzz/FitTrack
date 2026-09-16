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
          activeOpacity={0.8}
          className="bg-accent/10 dark:bg-accent-dark/15 px-3 py-1.5 rounded-xl border border-accent/30 dark:border-accent-dark/30"
        >
          <Text className="text-accent dark:text-accent-dark font-bold text-xs">
            {exercises.length > 0 ? 'Open Routine' : '+ Start'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exercises List or Empty State */}
      {exercises.length === 0 ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(screen)/workouts' as any)}
          className="bg-input dark:bg-input-dark rounded-2xl p-4 flex-row items-center justify-between border border-input-border dark:border-input-border-dark"
        >
          <View className="flex-1 mr-3">
            <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs">
              Ready to train today?
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
              Choose your routine or select exercises from the library.
            </Text>
          </View>
          <View className="bg-accent dark:bg-accent-dark px-3.5 py-2 rounded-xl">
            <Text className="text-white font-bold text-xs">
              Start
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View className="gap-2">
          {exercises.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              activeOpacity={0.7}
              onPress={() => router.push('/(screen)/workouts' as any)}
              className="flex-row items-center justify-between p-3 rounded-2xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
            >
              <View className="flex-row items-center flex-1 mr-2">
                {ex.isCompleted ? (
                  <View className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 items-center justify-center mr-3">
                    <Ionicons name="checkmark" size={13} color="#10B981" />
                  </View>
                ) : (
                  <View className="w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 items-center justify-center mr-3">
                    <Ionicons name="barbell" size={12} color="#A855F7" />
                  </View>
                )}

                <View className="flex-1 pr-2">
                  <Text
                    className={`text-xs font-bold leading-tight ${
                      ex.isCompleted
                        ? 'text-text-muted dark:text-text-muted-dark line-through'
                        : 'text-text-primary dark:text-text-primary-dark'
                    }`}
                    numberOfLines={1}
                  >
                    {ex.name}
                  </Text>
                  <Text className="text-[10px] text-text-muted dark:text-text-muted-dark mt-0.5 uppercase tracking-wider font-semibold">
                    {ex.isCompleted ? 'Completed' : 'Today Session'}
                  </Text>
                </View>
              </View>

              <View
                className={`px-2.5 py-0.5 rounded-full border ${
                  ex.isCompleted
                    ? 'bg-emerald-500/15 border-emerald-500/30'
                    : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold uppercase ${
                    ex.isCompleted ? 'text-accent dark:text-accent-dark' : 'text-text-muted dark:text-text-muted-dark'
                  }`}
                >
                  {ex.isCompleted ? 'Done' : 'Pending'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SurfaceCard>
  );
}
