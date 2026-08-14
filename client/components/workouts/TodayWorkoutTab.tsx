import React from 'react';
import { View, Text, Pressable, TouchableOpacity } from 'react-native';
import ExerciseCard, { SetRow } from './ExerciseCard';

export interface TodayExerciseItem {
  key: string;
  name: string;
  category?: string;
  type?: string;
  sets: SetRow[];
}

interface TodayWorkoutTabProps {
  exercises: TodayExerciseItem[];
  onToggleSet: (exerciseKey: string, setId: string) => void;
  onRemoveExercise: (exerciseKey: string) => void;
  onNavigateToLibrary: () => void;
  onCompleteSession: () => void;
}

const TodayWorkoutTab: React.FC<TodayWorkoutTabProps> = ({
  exercises,
  onToggleSet,
  onRemoveExercise,
  onNavigateToLibrary,
  onCompleteSession,
}) => {
  return (
    <View className="mt-1">
      {/* Header & Add Workout Button Row */}
      <View className="flex-row items-center justify-between mb-3.5">
        <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
          Today's Exercises ({exercises.length})
        </Text>

        <TouchableOpacity
          onPress={onNavigateToLibrary}
          activeOpacity={0.8}
          className="rounded-xl border border-accent/40 dark:border-accent-dark/40 bg-accent/10 dark:bg-accent-dark/15 px-3.5 py-2 flex-row items-center"
        >
          <Text className="text-accent dark:text-accent-dark font-extrabold text-xs">
            + Add Workout
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exercises List */}
      {exercises.length === 0 ? (
        <View className="rounded-2xl border border-dashed border-input-border dark:border-input-border-dark p-6 items-center justify-center my-4 bg-surface/50 dark:bg-surface-dark/50">
          <Text className="text-2xl mb-2">🏋️‍♂️</Text>
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-base mb-1">
            No exercises added today
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center mb-4 max-w-[240px]">
            Browse the workout library to add exercises to your session.
          </Text>
          <TouchableOpacity
            onPress={onNavigateToLibrary}
            className="bg-accent dark:bg-accent-dark px-4 py-2.5 rounded-xl"
          >
            <Text className="text-background dark:text-background-dark font-bold text-xs">
              Explore Library
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        exercises.map((item) => (
          <ExerciseCard
            key={item.key}
            name={item.name}
            category={item.category}
            type={item.type}
            sets={item.sets}
            onToggleSet={(setId) => onToggleSet(item.key, setId)}
            onRemoveExercise={() => onRemoveExercise(item.key)}
          />
        ))
      )}

      {/* Complete Session Button */}
      {exercises.length > 0 ? (
        <TouchableOpacity
          onPress={onCompleteSession}
          activeOpacity={0.9}
          className="mt-1 mb-4 items-center justify-center rounded-2xl bg-accent dark:bg-accent-dark py-4 shadow-md"
        >
          <Text className="text-base font-extrabold text-background dark:text-background-dark">
            Complete Workout Session
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* AI PLAN */}
      <View className="mt-2 rounded-2xl border border-accent/25 dark:border-accent-dark/30 bg-surface dark:bg-surface-dark p-4">
        <View className="mb-2.5 flex-row items-center">
          <View className="w-10 h-10 rounded-xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mr-3 border border-accent/30">
            <Text className="text-xl">🤖</Text>
          </View>
          <View className="flex-1">
            <Text className="font-bold text-text-primary dark:text-text-primary-dark text-sm">
              Today's AI-Generated Plan
            </Text>
            <View className="mt-1 self-start rounded-full bg-accent/20 dark:bg-accent-dark/20 px-2.5 py-0.5 border border-accent/40">
              <Text className="text-[10px] font-bold text-accent dark:text-accent-dark uppercase">
                Personalized
              </Text>
            </View>
          </View>
        </View>

        <Text className="leading-5 text-text-muted dark:text-text-muted-dark text-xs">
          <Text className="font-bold text-accent dark:text-accent-dark">
            Based on your muscle gain goal
          </Text>{' '}
          and yesterday's cardio, today is optimized for Upper Body Strength.
          Estimated calorie burn:{' '}
          <Text className="font-bold text-accent dark:text-accent-dark">
            380–420 kcal
          </Text>
          .
        </Text>
      </View>

      {/* SESSION STATS */}
      <View className="mt-5">
        <Text className="mb-2.5 text-base font-bold text-text-primary dark:text-text-primary-dark">
          Session Stats
        </Text>
        <View className="flex-row justify-between gap-x-3">
          <View className="flex-1 rounded-2xl border border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark p-3.5">
            <Text className="mb-1 text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
              DURATION
            </Text>
            <Text className="text-2xl font-black text-accent dark:text-accent-dark">
              34<Text className="text-xs font-normal text-text-muted dark:text-text-muted-dark"> min</Text>
            </Text>
          </View>
          <View className="flex-1 rounded-2xl border border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark p-3.5">
            <Text className="mb-1 text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
              ESTIMATED BURN
            </Text>
            <Text className="text-2xl font-black text-[#3B9EFF]">
              210<Text className="text-xs font-normal text-text-muted dark:text-text-muted-dark"> kcal</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* PERSONAL RECORDS */}
      <View className="mt-5 mb-2">
        <Text className="mb-2.5 text-base font-bold text-text-primary dark:text-text-primary-dark">
          Personal Records
        </Text>
        <View className="rounded-2xl border border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark p-3.5">
          {[
            ['🏆', '#FFD166', 'Bench Press', 'PR: 80kg × 6 reps'],
            ['🏆', '#9AD3FF', 'Pull-ups', 'PR: 15 reps'],
            ['🏆', '#E6B89C', 'Squat', 'PR: 100kg × 5 reps'],
          ].map(([icon, color, name, record], index) => (
            <React.Fragment key={name}>
              <View className="flex-row items-center py-2.5">
                <View
                  style={{ backgroundColor: color }}
                  className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
                >
                  <Text>{icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
                    {name}
                  </Text>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                    {record}
                  </Text>
                </View>
              </View>
              {index !== 2 && (
                <View className="h-px bg-input-border/50 dark:bg-input-border-dark/50" />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
};

export default TodayWorkoutTab;
