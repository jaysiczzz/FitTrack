import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import WorkoutTabs, { WorkoutTabType } from '@/components/workouts/WorkoutTabs';
import TodayWorkoutTab, { TodayExerciseItem } from '@/components/workouts/TodayWorkoutTab';
import WorkoutLibraryTab from '@/components/workouts/WorkoutLibraryTab';
import WorkoutHistoryTab from '@/components/workouts/WorkoutHistoryTab';
import { LibraryExercise } from '@/components/workouts/mockData';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  getTodayWorkoutSession,
  addExerciseToTodaySession,
  toggleExerciseSetApi,
  deleteWorkoutExerciseApi,
  completeWorkoutSessionApi,
  ApiWorkoutExercise,
} from '@/api/workout';

const INITIAL_TODAY_EXERCISES: TodayExerciseItem[] = [
  {
    key: 'bench-press',
    name: 'Bench Press',
    category: 'Chest · Primary',
    type: 'Strength',
    sets: [
      { id: '1', weight: '60', reps: '10', done: true },
      { id: '2', weight: '65', reps: '8', done: true },
      { id: '3', weight: '', reps: '', done: false },
    ],
  },
  {
    key: 'pull-ups',
    name: 'Pull-ups',
    category: 'Back · Primary',
    type: 'Strength',
    sets: [
      { id: '1', bodyweight: true, reps: '12', done: true },
      { id: '2', bodyweight: true, reps: '', done: false },
    ],
  },
];

export default function Workouts() {
  const [activeTab, setActiveTab] = useState<WorkoutTabType>('today');
  const [todayExercises, setTodayExercises] = useState<TodayExerciseItem[]>(INITIAL_TODAY_EXERCISES);
  const [loading, setLoading] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const fetchTodaySession = async () => {
    try {
      setLoading(true);
      const res = await getTodayWorkoutSession();
      if (res.session && res.session.exercises) {
        const formatted: TodayExerciseItem[] = res.session.exercises.map((e: ApiWorkoutExercise) => ({
          key: e.id,
          name: e.name,
          category: e.category || undefined,
          type: e.type || 'Strength',
          sets: (e.sets || []).map((s) => ({
            id: s.id,
            weight: s.weight ? String(s.weight) : undefined,
            reps: s.reps ? String(s.reps) : undefined,
            bodyweight: s.bodyweight || false,
            done: s.done,
          })),
        }));
        setTodayExercises(formatted);
      }
    } catch (err) {
      console.log('Using default today session exercises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaySession();
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

  const handleRemoveExercise = async (exerciseKey: string) => {
    setTodayExercises((prev) => prev.filter((ex) => ex.key !== exerciseKey));
    try {
      await deleteWorkoutExerciseApi(exerciseKey);
    } catch (err) {
      console.log('Failed to delete exercise on API server');
    }
  };

  const handleAddExerciseFromLibrary = async (libEx: LibraryExercise) => {
    try {
      const res = await addExerciseToTodaySession({
        exerciseId: libEx.id,
        name: libEx.name,
        category: libEx.category,
        type: libEx.type,
        defaultSets: libEx.defaultSets,
      });

      if (res.exercise) {
        const newEx: TodayExerciseItem = {
          key: res.exercise.id,
          name: res.exercise.name,
          category: res.exercise.category || undefined,
          type: res.exercise.type || 'Strength',
          sets: (res.exercise.sets || []).map((s: any) => ({
            id: s.id,
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
          name: libEx.name,
          category: libEx.category,
          type: libEx.type,
          sets: (libEx.defaultSets || []).map((s, idx) => ({
            id: String(idx + 1),
            weight: s.weight ? String(s.weight) : '',
            reps: s.reps ? String(s.reps) : '',
            bodyweight: s.bodyweight || false,
            done: false,
          })),
        },
      ]);
    }
    setActiveTab('today');
  };

  const handleConfirmCompleteSession = async () => {
    setShowCompleteModal(false);
    try {
      await completeWorkoutSessionApi();
      setSessionCompleted(true);
      fetchTodaySession();
    } catch (err) {
      setSessionCompleted(true);
    }
    setTimeout(() => {
      setSessionCompleted(false);
    }, 4000);
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        {/* Header */}
        <Text className="mb-1 text-[28px] font-extrabold text-text-primary dark:text-text-primary-dark">
          Workouts
        </Text>
        <Text className="mb-4 text-xs text-text-muted dark:text-text-muted-dark">
          Track your exercise completion and performance
        </Text>

        {/* Top Segmented Tabs */}
        <WorkoutTabs activeTab={activeTab} onChange={setActiveTab} />

        {/* Feedback Alert Banner */}
        {sessionCompleted ? (
          <View className="mb-4 rounded-xl border border-accent/40 bg-accent/15 dark:bg-accent-dark/20 p-3 items-center">
            <Text className="text-xs font-bold text-accent dark:text-accent-dark text-center">
              🎉 Workout session completed and saved to history!
            </Text>
          </View>
        ) : null}

        {/* Tab Content */}
        {activeTab === 'today' && (
          <TodayWorkoutTab
            exercises={todayExercises}
            onToggleSet={handleToggleSet}
            onRemoveExercise={handleRemoveExercise}
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