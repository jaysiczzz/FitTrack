import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import ExerciseCard, { SetRow } from './ExerciseCard';
import { ExerciseDetailsModal } from './ExerciseDetailsModal';
import { LibraryExercise } from './mockData';
import { getPersonalRecordsApi, getExerciseDetails } from '@/api/workout';
import { useToast } from '@/context/ToastContext';

export interface TodayExerciseItem {
  key: string;
  exerciseId?: string;
  name: string;
  category?: string;
  difficulty?: string;
  primaryMuscle?: string;
  secondaryMuscles?: string[];
  equipment?: string;
  type?: string;
  recommendedSets?: number;
  recommendedReps?: number;
  recommendedRest?: number;
  sets: SetRow[];
}

export interface PersonalRecordItem {
  name: string;
  value: string;
  date: string;
}

interface TodayWorkoutTabProps {
  exercises: TodayExerciseItem[];
  completedSessionsCount?: number;
  completedStats?: { duration: number; caloriesBurned: number } | null;
  onToggleSet: (exerciseKey: string, setId: string) => void;
  onUpdateSet?: (exerciseKey: string, setId: string, field: 'weight' | 'reps', newValue: number) => void;
  onAddSet?: (exerciseKey: string) => void;
  onDeleteSet?: (exerciseKey: string, setId: string) => void;
  onRemoveExercise: (exerciseKey: string) => void;
  onUpdateExercisePreset?: (exerciseKey: string, customized: LibraryExercise) => void;
  onNavigateToLibrary: () => void;
  onCompleteSession: () => void;
}

const TodayWorkoutTab: React.FC<TodayWorkoutTabProps> = ({
  exercises,
  completedSessionsCount = 0,
  completedStats,
  onToggleSet,
  onUpdateSet,
  onAddSet,
  onDeleteSet,
  onRemoveExercise,
  onUpdateExercisePreset,
  onNavigateToLibrary,
  onCompleteSession,
}) => {
  const { showWarning } = useToast();
  const [personalRecords, setPersonalRecords] = useState<PersonalRecordItem[]>([]);
  const [loadingPrs, setLoadingPrs] = useState(false);

  // Exercise Detail Modal state
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<LibraryExercise | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const fetchPRs = async () => {
      try {
        setLoadingPrs(true);
        const res = await getPersonalRecordsApi();
        if (res.personalRecords) {
          setPersonalRecords(res.personalRecords);
        }
      } catch (err) {
        console.log('Failed to fetch personal records');
      } finally {
        setLoadingPrs(false);
      }
    };
    fetchPRs();
  }, [completedSessionsCount]);

  const [activeWorkoutKey, setActiveWorkoutKey] = useState<string | null>(null);

  const handleOpenDetailsByName = async (exercise: TodayExerciseItem) => {
    setActiveWorkoutKey(exercise.key);
    if (exercise.exerciseId) {
      try {
        const res = await getExerciseDetails(exercise.exerciseId);
        if (res.exercise) {
          setSelectedExerciseDetail({
            ...res.exercise,
            difficulty: exercise.difficulty || res.exercise.difficulty,
          });
          setShowDetailsModal(true);
          return;
        }
      } catch (err) {
        console.log('Error fetching exercise details by ID');
      }
    }

    // Fallback template constructed from exercise item metadata
    const fallbackDetails: LibraryExercise = {
      id: exercise.key,
      name: exercise.name,
      category: exercise.category || 'Strength',
      type: exercise.type || 'Compound',
      difficulty: exercise.difficulty || 'Intermediate',
      primaryMuscle: exercise.primaryMuscle || 'Chest',
      muscleGroup: exercise.primaryMuscle || 'Chest',
      secondaryMuscles: exercise.secondaryMuscles,
      equipment: exercise.equipment ? [exercise.equipment] : ['Barbell'],
      recommendedSets: exercise.recommendedSets || 3,
      recommendedReps: exercise.recommendedReps || 10,
      recommendedRest: exercise.recommendedRest || 90,
      instructions: [
        'Perform the exercise maintaining strict control and posture.',
        'Follow recommended set and repetition protocols.',
        'Keep core engaged throughout movement.',
      ],
      defaultSets: exercise.sets.map((s) => ({
        weight: s.weight ? String(s.weight) : '',
        reps: s.reps ? String(s.reps) : '',
        bodyweight: s.bodyweight,
      })),
    };

    setSelectedExerciseDetail(fallbackDetails);
    setShowDetailsModal(true);
  };

  const hasCompletedWorkouts = completedSessionsCount > 0;

  // Calculate set completion status
  const totalSetsCount = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSetsCount = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.done).length,
    0
  );
  const allSetsDone = totalSetsCount > 0 && completedSetsCount === totalSetsCount;

  const handleCompleteSessionPress = () => {
    if (!allSetsDone) {
      showWarning(
        'Incomplete Exercises',
        `Completed ${completedSetsCount} of ${totalSetsCount} sets. Mark all sets as done to finish!`
      );
      return;
    }
    onCompleteSession();
  };

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
            + Add Exercise
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exercises List / Empty State */}
      {exercises.length === 0 ? (
        <View className="rounded-2xl border border-dashed border-input-border dark:border-input-border-dark p-6 items-center justify-center my-2 bg-surface/50 dark:bg-surface-dark/50">
          <Text className="text-3xl mb-2">🏋️‍♂️</Text>
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-base mb-1">
            No exercises scheduled yet
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center mb-4 max-w-[240px]">
            Browse the Exercise Library to add workouts to your session.
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
            exerciseId={item.exerciseId}
            name={item.name}
            category={item.category}
            difficulty={item.difficulty}
            primaryMuscle={item.primaryMuscle}
            secondaryMuscles={item.secondaryMuscles}
            equipment={item.equipment}
            type={item.type}
            recommendedSets={item.recommendedSets}
            recommendedReps={item.recommendedReps}
            recommendedRest={item.recommendedRest}
            sets={item.sets}
            onToggleSet={(setId) => onToggleSet(item.key, setId)}
            onUpdateSet={(setId, field, val) => onUpdateSet && onUpdateSet(item.key, setId, field, val)}
            onAddSet={() => onAddSet && onAddSet(item.key)}
            onDeleteSet={(setId) => onDeleteSet && onDeleteSet(item.key, setId)}
            onRemoveExercise={() => onRemoveExercise(item.key)}
            onViewDetails={() => handleOpenDetailsByName(item)}
          />
        ))
      )}

      {/* Complete Session Button & Loophole Validation Banner */}
      {exercises.length > 0 ? (
        <View className="mt-1 mb-4">
          {!allSetsDone ? (
            <View className="mb-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex-row items-center">
              <Text className="text-base mr-2">⚠️</Text>
              <Text className="flex-1 text-xs text-amber-500 font-semibold leading-4">
                Completion Progress: {completedSetsCount} of {totalSetsCount} sets marked as done. Click "+ Mark Done" on each set before finishing.
              </Text>
            </View>
          ) : (
            <View className="mb-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex-row items-center">
              <Text className="text-base mr-2">🎉</Text>
              <Text className="flex-1 text-xs text-emerald-500 font-bold">
                All sets completed! Ready to finish and save your workout session.
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleCompleteSessionPress}
            activeOpacity={allSetsDone ? 0.9 : 0.6}
            className={`items-center justify-center rounded-2xl py-4 shadow-md ${
              allSetsDone
                ? 'bg-accent dark:bg-accent-dark'
                : 'bg-surface dark:bg-surface-dark border-2 border-input-border dark:border-input-border-dark opacity-80'
            }`}
          >
            <Text
              className={`text-base font-extrabold ${
                allSetsDone
                  ? 'text-background dark:text-background-dark'
                  : 'text-text-muted dark:text-text-muted-dark'
              }`}
            >
              {allSetsDone ? 'Complete Workout Session' : 'Complete Session (All Sets Required)'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* AI WORKOUT PLAN CARD */}
      <View className="mt-2 rounded-2xl border border-accent/25 dark:border-accent-dark/30 bg-surface dark:bg-surface-dark p-4">
        <View className="mb-2.5 flex-row items-center">
          <View className="w-10 h-10 rounded-xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mr-3 border border-accent/30">
            <Text className="text-xl">🤖</Text>
          </View>
          <View className="flex-1">
            <Text className="font-bold text-text-primary dark:text-text-primary-dark text-sm">
              Today's AI Workout Plan
            </Text>
            <View className="mt-1 self-start rounded-full bg-accent/20 dark:bg-accent-dark/20 px-2.5 py-0.5 border border-accent/40">
              <Text className="text-[10px] font-bold text-accent dark:text-accent-dark uppercase">
                {hasCompletedWorkouts ? 'Personalized' : 'Setup Plan'}
              </Text>
            </View>
          </View>
        </View>

        {hasCompletedWorkouts ? (
          <Text className="leading-5 text-text-muted dark:text-text-muted-dark text-xs">
            <Text className="font-bold text-accent dark:text-accent-dark">
              Based on your fitness profile and goals
            </Text>
            , your session is tailored to maximize strength and muscle building efficiently.
          </Text>
        ) : (
          <Text className="leading-5 text-text-muted dark:text-text-muted-dark text-xs">
            Complete your profile and workout preferences to receive a personalized AI recommendation plan.
          </Text>
        )}
      </View>

      {/* TODAY'S TARGET MUSCLE SPLIT */}
      <View className="mt-5 rounded-2xl border border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-base">💪</Text>
            <Text className="font-bold text-text-primary dark:text-text-primary-dark text-sm">
              Today's Target Muscle Focus
            </Text>
          </View>
          <View className="rounded-lg bg-accent/15 px-2.5 py-0.5 border border-accent/30">
            <Text className="text-[10px] font-extrabold text-accent dark:text-accent-dark">
              {exercises.length > 0 ? `${exercises.length} Exercises` : 'No Exercises Scheduled'}
            </Text>
          </View>
        </View>

        {exercises.length > 0 ? (
          <View className="gap-y-2.5">
            {/* Dynamic Muscle Distribution Breakdown */}
            {(() => {
              const muscleCounts: Record<string, number> = {};
              let total = 0;
              exercises.forEach((ex) => {
                const target = ex.primaryMuscle || ex.category || 'Full Body';
                muscleCounts[target] = (muscleCounts[target] || 0) + 1;
                total += 1;
              });

              return Object.entries(muscleCounts).map(([muscle, count]) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <View key={muscle}>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">
                        {muscle}
                      </Text>
                      <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                        {pct}% ({count} {count === 1 ? 'exercise' : 'exercises'})
                      </Text>
                    </View>
                    <View className="h-2.5 rounded-full bg-input dark:bg-input-dark overflow-hidden border border-input-border/50">
                      <View
                        className="h-full bg-accent dark:bg-accent-dark rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </View>
                  </View>
                );
              });
            })()}
          </View>
        ) : (
          <Text className="text-xs text-text-muted dark:text-text-muted-dark italic">
            Add exercises from the library to see today's targeted muscle group breakdown.
          </Text>
        )}
      </View>

      {/* RECOMMENDED 3-STEP WARM-UP & MOBILITY ROUTINE */}
      <View className="mt-4 mb-2 rounded-2xl border border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-base">🔥</Text>
            <Text className="font-bold text-text-primary dark:text-text-primary-dark text-sm">
              3-Step Warm-Up Routine
            </Text>
          </View>
          <Text className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
            Injury Prevention
          </Text>
        </View>

        {/* Dynamic Warm-Up Steps */}
        <View className="gap-y-2">
          {[
            {
              step: '1',
              title: 'Dynamic Joint Rotations & Arm Swings',
              desc: '60s continuous light arm & shoulder circles to lubricate joints.',
            },
            {
              step: '2',
              title: 'Spinal Mobility & Cat-Cow Flow',
              desc: '10 slow breathing cycles to activate core and relieve back stiffness.',
            },
            {
              step: '3',
              title: 'Light Warm-Up Pyramid Set',
              desc: 'Perform 1 set of 10 reps with 50% lighter weight before your main working sets.',
            },
          ].map((item) => (
            <View
              key={item.step}
              className="flex-row items-start p-3 rounded-xl bg-input/60 dark:bg-input-dark/60 border border-input-border/50 dark:border-input-border-dark/50"
            >
              <View className="w-6 h-6 rounded-full bg-accent/20 border border-accent/40 items-center justify-center mr-3 mt-0.5">
                <Text className="text-xs font-bold text-accent dark:text-accent-dark">{item.step}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-0.5">
                  {item.title}
                </Text>
                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark leading-4">
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Exercise Detail Modal */}
      <ExerciseDetailsModal
        visible={showDetailsModal}
        exercise={selectedExerciseDetail}
        mode="update"
        onClose={() => setShowDetailsModal(false)}
        onAddExercise={() => setShowDetailsModal(false)}
        onUpdateExercisePreset={(customized) => {
          if (activeWorkoutKey && onUpdateExercisePreset) {
            onUpdateExercisePreset(activeWorkoutKey, customized);
          }
          setShowDetailsModal(false);
        }}
      />
    </View>
  );
};

export default TodayWorkoutTab;
