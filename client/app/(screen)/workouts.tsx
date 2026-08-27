import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import WorkoutTabs, { WorkoutTabType } from '@/components/workouts/WorkoutTabs';
import TodayWorkoutTab, { TodayExerciseItem } from '@/components/workouts/TodayWorkoutTab';
import WorkoutLibraryTab from '@/components/workouts/WorkoutLibraryTab';
import WorkoutHistoryTab from '@/components/workouts/WorkoutHistoryTab';
import { LibraryExercise } from '@/components/workouts/mockData';
import { ExerciseDetailsModal, getDifficultyPreset } from '@/components/workouts/ExerciseDetailsModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/context/ToastContext';
import {
  getTodayWorkoutSession,
  addExerciseToTodaySession,
  toggleExerciseSetApi,
  updateExerciseSetValuesApi,
  addSetToWorkoutExerciseApi,
  deleteExerciseSetApi,
  deleteWorkoutExerciseApi,
  completeWorkoutSessionApi,
  getWorkoutHistory,
  ApiWorkoutExercise,
} from '@/api/workout';

export default function Workouts() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<WorkoutTabType>('today');
  const [todayExercises, setTodayExercises] = useState<TodayExerciseItem[]>([]);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const [completedStats, setCompletedStats] = useState<{ duration: number; caloriesBurned: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const fetchTodaySession = async () => {
    try {
      setLoading(true);
      const res = await getTodayWorkoutSession();
      if (res.session && res.session.exercises) {
        const formatted: TodayExerciseItem[] = res.session.exercises.map((e: any) => ({
          key: e.id,
          exerciseId: e.exerciseId || e.id,
          name: e.name,
          category: e.category || 'Strength',
          type: e.type || 'Compound',
          difficulty: e.difficulty || 'Intermediate',
          primaryMuscle: e.primaryMuscle || 'Chest',
          secondaryMuscles: e.secondaryMuscles,
          equipment: e.equipment || 'Barbell',
          recommendedSets: e.recommendedSets || 3,
          recommendedReps: e.recommendedReps || 10,
          recommendedRest: e.recommendedRest || 90,
          sets: (e.sets || []).map((s: any, idx: number) => ({
            id: s.id,
            setNumber: s.setNumber || idx + 1,
            weight: s.weight ? String(s.weight) : undefined,
            reps: s.reps ? String(s.reps) : undefined,
            bodyweight: s.bodyweight || false,
            done: s.done,
          })),
        }));
        setTodayExercises(formatted);
      } else {
        setTodayExercises([]);
      }
    } catch (err) {
      console.log('Using clean active session state');
      setTodayExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryCount = async () => {
    try {
      const res = await getWorkoutHistory();
      if (res.sessions) {
        setCompletedSessionsCount(res.sessions.length);
        if (res.sessions.length > 0) {
          const lastSession = res.sessions[0];
          setCompletedStats({
            duration: lastSession.duration || 35,
            caloriesBurned: lastSession.caloriesBurned || 240,
          });
        } else {
          setCompletedStats(null);
        }
      }
    } catch (err) {
      setCompletedSessionsCount(0);
      setCompletedStats(null);
    }
  };

  useEffect(() => {
    fetchTodaySession();
    fetchHistoryCount();
  }, []);

  const handleToggleSet = async (exerciseKey: string, setId: string) => {
    // Optimistic UI update
    setTodayExercises((prev) =>
      prev.map((ex) => {
        if (ex.key !== exerciseKey) return ex;
        return {
          ...ex,
          sets: ex.sets.map((set) =>
            set.id === setId ? { ...set, done: !set.done } : set
          ),
        };
      })
    );

    try {
      await toggleExerciseSetApi(setId);
    } catch (err) {
      console.log('Failed to toggle set on API server');
    }
  };

  const handleUpdateSet = async (exerciseKey: string, setId: string, field: 'weight' | 'reps', newValue: number) => {
    setTodayExercises((prev) =>
      prev.map((ex) => {
        if (ex.key !== exerciseKey) return ex;
        return {
          ...ex,
          sets: ex.sets.map((set) =>
            set.id === setId ? { ...set, [field]: String(newValue) } : set
          ),
        };
      })
    );

    try {
      await updateExerciseSetValuesApi(setId, { [field]: newValue });
    } catch (err) {
      console.log('Failed to update set values on API server');
    }
  };

  const handleAddSet = async (exerciseKey: string) => {
    try {
      const res = await addSetToWorkoutExerciseApi(exerciseKey);
      if (res.set) {
        setTodayExercises((prev) =>
          prev.map((ex) => {
            if (ex.key !== exerciseKey) return ex;
            return {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  id: res.set.id,
                  setNumber: res.set.setNumber,
                  weight: res.set.weight ? String(res.set.weight) : '20',
                  reps: res.set.reps ? String(res.set.reps) : '10',
                  bodyweight: res.set.bodyweight,
                  done: false,
                },
              ],
            };
          })
        );
      }
    } catch (err) {
      console.log('Failed to add set on API server');
    }
  };

  const handleDeleteSet = async (exerciseKey: string, setId: string) => {
    setTodayExercises((prev) =>
      prev.map((ex) => {
        if (ex.key !== exerciseKey) return ex;
        return {
          ...ex,
          sets: ex.sets.filter((set) => set.id !== setId),
        };
      })
    );

    try {
      await deleteExerciseSetApi(setId);
    } catch (err) {
      console.log('Failed to delete set on API server');
    }
  };

  const handleRemoveExercise = async (exerciseKey: string) => {
    const exToRemove = todayExercises.find((e) => e.key === exerciseKey);
    setTodayExercises((prev) => prev.filter((ex) => ex.key !== exerciseKey));
    try {
      await deleteWorkoutExerciseApi(exerciseKey);
    } catch (err) {
      console.log('Failed to delete exercise on API server');
    }
    showToast({
      message: 'Exercise Removed',
      description: exToRemove ? `Removed "${exToRemove.name}" from today's session` : undefined,
      type: 'info',
      icon: '🗑️',
    });
  };

  const handleUpdateExercisePreset = async (exerciseKey: string, customized: LibraryExercise) => {
    const targetTier = ((customized.difficulty || 'Intermediate').toLowerCase()) as 'beginner' | 'intermediate' | 'advanced';
    const preset = getDifficultyPreset(customized, targetTier);
    const targetSets = preset.defaultSets;

    setTodayExercises((prev) =>
      prev.map((ex) => {
        // Match strictly by unique instance key
        if (ex.key !== exerciseKey) {
          return ex;
        }

        const newSets = targetSets.map((s: any, idx: number) => ({
          id: ex.sets[idx]?.id || `${ex.key}-preset-${idx + 1}`,
          setNumber: idx + 1,
          weight: s.weight !== undefined && s.weight !== null ? String(s.weight) : undefined,
          reps: s.reps !== undefined && s.reps !== null ? String(s.reps) : undefined,
          bodyweight: Boolean(s.bodyweight),
          done: false,
        }));

        return {
          ...ex,
          difficulty: preset.difficulty,
          recommendedSets: preset.recommendedSets,
          recommendedReps: preset.recommendedReps,
          recommendedRest: preset.recommendedRest,
          sets: newSets,
        };
      })
    );

    // Sync set values to backend only for this specific workout instance
    const targetEx = todayExercises.find((ex) => ex.key === exerciseKey);

    if (targetEx) {
      targetEx.sets.forEach((setRow, idx) => {
        const pSet = targetSets[idx];
        if (pSet && setRow.id) {
          updateExerciseSetValuesApi(setRow.id, {
            weight: pSet.weight ? Number(pSet.weight) : undefined,
            reps: pSet.reps ? Number(pSet.reps) : undefined,
            done: false,
          }).catch(() => {});
        }
      });
    }

    showToast({
      message: `${customized.name} Updated`,
      description: `Preset set to ${preset.difficulty.toUpperCase()} (${targetSets.length} sets)`,
      type: 'info',
      icon: '⚙️',
    });
  };

  const handleAddExerciseFromLibrary = async (libEx: LibraryExercise) => {
    const targetTier = ((libEx.difficulty || 'Intermediate').toLowerCase()) as 'beginner' | 'intermediate' | 'advanced';
    const preset = getDifficultyPreset(libEx, targetTier);
    const activeDefaultSets = preset.defaultSets;

    try {
      const res = await addExerciseToTodaySession({
        exerciseId: libEx.id,
        name: libEx.name,
        category: libEx.category,
        type: libEx.type,
        defaultSets: activeDefaultSets.map((s) => ({
          weight: s.weight ? Number(s.weight) : undefined,
          reps: s.reps ? Number(s.reps) : undefined,
          bodyweight: Boolean(s.bodyweight),
        })),
      });

      if (res.exercise) {
        const newEx: TodayExerciseItem = {
          key: res.exercise.id,
          exerciseId: libEx.id,
          name: res.exercise.name,
          category: res.exercise.category || libEx.category,
          difficulty: libEx.difficulty || preset.difficulty,
          type: res.exercise.type || libEx.type || 'Compound',
          primaryMuscle: libEx.primaryMuscle || libEx.muscleGroup || 'Chest',
          secondaryMuscles: libEx.secondaryMuscles,
          equipment: Array.isArray(libEx.equipment) ? libEx.equipment.join(', ') : libEx.equipment || 'Barbell',
          recommendedSets: preset.recommendedSets,
          recommendedReps: preset.recommendedReps,
          recommendedRest: libEx.recommendedRest || preset.recommendedRest,
          sets: (res.exercise.sets || []).map((s: any, idx: number) => ({
            id: s.id,
            setNumber: s.setNumber || idx + 1,
            weight: s.weight ? String(s.weight) : undefined,
            reps: s.reps ? String(s.reps) : undefined,
            bodyweight: s.bodyweight || false,
            done: s.done,
          })),
        };
        setTodayExercises((prev) => [...prev, newEx]);
      } else {
        fetchTodaySession();
      }
    } catch (err) {
      // Fallback local addition if server offline
      const fallbackKey = `${libEx.id}-${Date.now()}`;
      setTodayExercises((prev) => [
        ...prev,
        {
          key: fallbackKey,
          exerciseId: libEx.id,
          name: libEx.name,
          category: libEx.category,
          difficulty: preset.difficulty,
          type: libEx.type || 'Compound',
          primaryMuscle: libEx.primaryMuscle || libEx.muscleGroup || 'Chest',
          secondaryMuscles: libEx.secondaryMuscles,
          equipment: Array.isArray(libEx.equipment) ? libEx.equipment.join(', ') : libEx.equipment || 'Barbell',
          recommendedSets: preset.recommendedSets,
          recommendedReps: preset.recommendedReps,
          recommendedRest: libEx.recommendedRest || preset.recommendedRest,
          sets: activeDefaultSets.map((s, idx) => ({
            id: String(idx + 1),
            setNumber: idx + 1,
            weight: s.weight ? String(s.weight) : '',
            reps: s.reps ? String(s.reps) : '',
            bodyweight: Boolean(s.bodyweight),
            done: false,
          })),
        },
      ]);
    }

    const currentCount = todayExercises.filter((ex) => ex.name.toLowerCase() === libEx.name.toLowerCase() || ex.exerciseId === libEx.id).length + 1;
    const countSuffix = currentCount > 1 ? ` (${currentCount}x)` : '';
    showToast({
      message: `Added ${libEx.name}${countSuffix}`,
      description: `Added to Today's Workout (${preset.difficulty.toUpperCase()} preset)`,
      type: 'success',
      icon: '🏋️‍♂️',
    });
  };

  const handleConfirmCompleteSession = async () => {
    setShowCompleteModal(false);
    const exerciseCount = todayExercises.length;
    const totalSets = todayExercises.reduce((acc, ex) => acc + ex.sets.length, 0);

    // 1. Instantly clear active UI state & show notification (0ms delay)
    setTodayExercises([]);

    showToast({
      message: '🎉 Workout Session Completed!',
      description: `Great job! Logged ${exerciseCount} exercises (${totalSets} sets) into your History.`,
      type: 'success',
      icon: '🔥',
      actionLabel: 'View History 📅',
      onAction: () => setActiveTab('history'),
    });

    // 2. Perform API sync and refresh counts in the background
    try {
      await completeWorkoutSessionApi();
      fetchTodaySession();
      fetchHistoryCount();
    } catch (err) {
      console.log('Error completing workout session on server:', err);
      fetchTodaySession();
      fetchHistoryCount();
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 }}>
        {/* Header */}
        <Text className="mb-1 text-[28px] font-extrabold text-text-primary dark:text-text-primary-dark">
          Workouts 🏋️‍♂️
        </Text>
        <Text className="mb-4 text-xs text-text-muted dark:text-text-muted-dark">
          Track your exercise completion and performance
        </Text>

        {/* Top Segmented Tabs */}
        <WorkoutTabs activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'today' && (
          <TodayWorkoutTab
            exercises={todayExercises}
            completedSessionsCount={completedSessionsCount}
            completedStats={completedStats}
            onToggleSet={handleToggleSet}
            onUpdateSet={handleUpdateSet}
            onAddSet={handleAddSet}
            onDeleteSet={handleDeleteSet}
            onRemoveExercise={handleRemoveExercise}
            onUpdateExercisePreset={handleUpdateExercisePreset}
            onNavigateToLibrary={() => setActiveTab('library')}
            onCompleteSession={() => setShowCompleteModal(true)}
          />
        )}

        {activeTab === 'library' && (
          <WorkoutLibraryTab onAddExercise={handleAddExerciseFromLibrary} />
        )}

        {activeTab === 'history' && <WorkoutHistoryTab />}
      </ScrollView>

      {/* Completion Modal */}
      <ConfirmModal
        visible={showCompleteModal}
        title="Complete Session"
        message="Great job! Ready to log and complete today's workout session?"
        icon="🏆"
        confirmText="Finish & Save"
        cancelText="Keep Training"
        onConfirm={handleConfirmCompleteSession}
        onCancel={() => setShowCompleteModal(false)}
      />
    </SafeAreaView>
  );
}