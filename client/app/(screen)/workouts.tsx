import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import WorkoutTabs, { WorkoutTabType } from '@/components/workouts/WorkoutTabs';
import TodayWorkoutTab, { TodayExerciseItem } from '@/components/workouts/TodayWorkoutTab';
import WorkoutPlannerTab from '@/components/workouts/WorkoutPlannerTab';
import WorkoutLibraryTab from '@/components/workouts/WorkoutLibraryTab';
import WorkoutHistoryTab from '@/components/workouts/WorkoutHistoryTab';
import { LibraryExercise, CompletedSession, WorkoutRoutineTemplate } from '@/components/workouts/workoutTypes';
import { DEFAULT_ROUTINE_TEMPLATES, DEFAULT_WEEKLY_SPLIT, getTodayDayOfWeek } from '@/components/workouts/plannerPresets';
import { ExerciseDetailsModal } from '@/components/workouts/ExerciseDetailsModal';
import { getDifficultyPreset } from '@/components/workouts/workoutPresets';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AiWorkoutGeneratorModal from '@/components/workouts/AiWorkoutGeneratorModal';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import { AIWorkoutPlan } from '@/api/ai';
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
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<WorkoutTabType>('today');
  const [todayExercises, setTodayExercises] = useState<TodayExerciseItem[]>([]);
  const [todayScheduledRoutine, setTodayScheduledRoutine] = useState<WorkoutRoutineTemplate | null>(null);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const [completedStats, setCompletedStats] = useState<{ duration: number; caloriesBurned: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [exerciseToRemove, setExerciseToRemove] = useState<TodayExerciseItem | null>(null);
  const updateTimersRef = useRef<Record<string, any>>({});

  const fetchScheduledRoutine = async () => {
    try {
      const templatesKey = authStorage.getScopedKey(user?.id, 'workout_planner_templates');
      const splitKey = authStorage.getScopedKey(user?.id, 'workout_planner_split');

      const [savedTemplates, savedSplit] = await Promise.all([
        AsyncStorage.getItem(templatesKey),
        AsyncStorage.getItem(splitKey),
      ]);

      let templates = DEFAULT_ROUTINE_TEMPLATES;
      if (savedTemplates) {
        try {
          const parsed = JSON.parse(savedTemplates);
          if (Array.isArray(parsed) && parsed.length > 0) templates = parsed;
        } catch {}
      }

      let split = DEFAULT_WEEKLY_SPLIT;
      if (savedSplit) {
        try {
          const parsed = JSON.parse(savedSplit);
          if (parsed && typeof parsed === 'object') split = parsed;
        } catch {}
      }

      const todayDay = getTodayDayOfWeek();
      const routineId = split[todayDay];
      const matched = templates.find((r) => r.id === routineId) || null;
      setTodayScheduledRoutine(matched);
    } catch {
      setTodayScheduledRoutine(null);
    }
  };

  const fetchTodaySession = async () => {
    try {
      setLoading(true);
      const res = await getTodayWorkoutSession();
      if (res.session && res.session.exercises) {
        const formatted: TodayExerciseItem[] = res.session.exercises.map((e: any) => ({
          key: e.id,
          exerciseId: e.exerciseId || e.id,
          name: e.name,
          description: e.description || null,
          category: e.category || 'Strength',
          type: e.type || 'Compound',
          difficulty: e.difficulty || 'Intermediate',
          primaryMuscle: e.primaryMuscle || 'Chest',
          muscleGroup: e.muscleGroup || e.primaryMuscle || 'Chest',
          secondaryMuscles: e.secondaryMuscles || [],
          bodyPart: e.bodyPart || 'Upper Body',
          equipment: e.equipment ? (Array.isArray(e.equipment) ? e.equipment.join(', ') : e.equipment) : 'Barbell',
          equipmentAlternatives: e.equipmentAlternatives || [],
          startingPosition: e.startingPosition || null,
          instructions: e.instructions || [],
          formTips: e.formTips || [],
          commonMistakes: e.commonMistakes || [],
          breathingTechnique: e.breathingTechnique || null,
          recommendedSets: e.recommendedSets || 3,
          recommendedReps: e.recommendedReps || 10,
          recommendedDuration: e.recommendedDuration,
          recommendedRest: e.recommendedRest || 90,
          recommendedTempo: e.recommendedTempo || '2-0-1-0',
          safetyInstructions: e.safetyInstructions || null,
          injuryPreventionTips: e.injuryPreventionTips || null,
          beginnerModification: e.beginnerModification || null,
          advancedVariation: e.advancedVariation || null,
          easierAlternative: e.easierAlternative || null,
          harderAlternative: e.harderAlternative || null,
          equipmentFreeAlternative: e.equipmentFreeAlternative || null,
          similarExercises: e.similarExercises || [],
          tags: e.tags || [],
          difficultyPresets: e.difficultyPresets || null,
          imageUrl: e.imageUrl || null,
          thumbnailUrl: e.thumbnailUrl || null,
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
    fetchScheduledRoutine();
  }, [user?.id]);

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

  const handleUpdateSet = (exerciseKey: string, setId: string, field: 'weight' | 'reps', newValue: number) => {
    // 1. Instant optimistic UI update
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

    // 2. Debounced API sync per set and field (450ms)
    const timerKey = `${setId}_${field}`;
    if (updateTimersRef.current[timerKey]) {
      clearTimeout(updateTimersRef.current[timerKey]);
    }

    updateTimersRef.current[timerKey] = setTimeout(async () => {
      try {
        await updateExerciseSetValuesApi(setId, { [field]: newValue });
      } catch (err) {
        console.log('Failed to update set values on API server');
      } finally {
        delete updateTimersRef.current[timerKey];
      }
    }, 450);
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

  const promptRemoveExercise = (exerciseKey: string) => {
    const ex = todayExercises.find((e) => e.key === exerciseKey);
    if (ex) {
      setExerciseToRemove(ex);
    }
  };

  const handleConfirmRemoveExercise = async () => {
    if (!exerciseToRemove) return;
    const exToRemove = exerciseToRemove;
    const keyToDelete = exerciseToRemove.key;
    setExerciseToRemove(null);

    setTodayExercises((prev) => prev.filter((ex) => ex.key !== keyToDelete));
    try {
      await deleteWorkoutExerciseApi(keyToDelete);
    } catch (err) {
      console.log('Failed to delete exercise on API server');
    }
    showToast({
      message: 'Exercise Removed',
      description: `Removed "${exToRemove.name}" from today's workout`,
      type: 'info',
      iconName: 'trash',
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
      iconName: 'options',
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
          description: libEx.description || null,
          category: res.exercise.category || libEx.category,
          difficulty: libEx.difficulty || preset.difficulty,
          type: res.exercise.type || libEx.type || 'Compound',
          primaryMuscle: libEx.primaryMuscle || libEx.muscleGroup || 'Chest',
          muscleGroup: libEx.muscleGroup || libEx.primaryMuscle || 'Chest',
          secondaryMuscles: libEx.secondaryMuscles || [],
          bodyPart: libEx.bodyPart || 'Upper Body',
          equipment: Array.isArray(libEx.equipment) ? libEx.equipment.join(', ') : libEx.equipment || 'Barbell',
          equipmentAlternatives: libEx.equipmentAlternatives || [],
          startingPosition: libEx.startingPosition || null,
          instructions: libEx.instructions || [],
          formTips: libEx.formTips || [],
          commonMistakes: libEx.commonMistakes || [],
          breathingTechnique: libEx.breathingTechnique || null,
          recommendedSets: preset.recommendedSets,
          recommendedReps: preset.recommendedReps,
          recommendedDuration: libEx.recommendedDuration,
          recommendedRest: libEx.recommendedRest || preset.recommendedRest,
          recommendedTempo: libEx.recommendedTempo || '2-0-1-0',
          safetyInstructions: libEx.safetyInstructions || null,
          injuryPreventionTips: libEx.injuryPreventionTips || null,
          beginnerModification: libEx.beginnerModification || null,
          advancedVariation: libEx.advancedVariation || null,
          easierAlternative: libEx.easierAlternative || null,
          harderAlternative: libEx.harderAlternative || null,
          equipmentFreeAlternative: libEx.equipmentFreeAlternative || null,
          similarExercises: libEx.similarExercises || [],
          tags: libEx.tags || [],
          difficultyPresets: libEx.difficultyPresets || null,
          imageUrl: libEx.imageUrl || null,
          thumbnailUrl: libEx.thumbnailUrl || null,
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
          description: libEx.description || null,
          category: libEx.category,
          difficulty: preset.difficulty,
          type: libEx.type || 'Compound',
          primaryMuscle: libEx.primaryMuscle || libEx.muscleGroup || 'Chest',
          muscleGroup: libEx.muscleGroup || libEx.primaryMuscle || 'Chest',
          secondaryMuscles: libEx.secondaryMuscles || [],
          bodyPart: libEx.bodyPart || 'Upper Body',
          equipment: Array.isArray(libEx.equipment) ? libEx.equipment.join(', ') : libEx.equipment || 'Barbell',
          equipmentAlternatives: libEx.equipmentAlternatives || [],
          startingPosition: libEx.startingPosition || null,
          instructions: libEx.instructions || [],
          formTips: libEx.formTips || [],
          commonMistakes: libEx.commonMistakes || [],
          breathingTechnique: libEx.breathingTechnique || null,
          recommendedSets: preset.recommendedSets,
          recommendedReps: preset.recommendedReps,
          recommendedDuration: libEx.recommendedDuration,
          recommendedRest: libEx.recommendedRest || preset.recommendedRest,
          recommendedTempo: libEx.recommendedTempo || '2-0-1-0',
          safetyInstructions: libEx.safetyInstructions || null,
          injuryPreventionTips: libEx.injuryPreventionTips || null,
          beginnerModification: libEx.beginnerModification || null,
          advancedVariation: libEx.advancedVariation || null,
          easierAlternative: libEx.easierAlternative || null,
          harderAlternative: libEx.harderAlternative || null,
          equipmentFreeAlternative: libEx.equipmentFreeAlternative || null,
          similarExercises: libEx.similarExercises || [],
          tags: libEx.tags || [],
          difficultyPresets: libEx.difficultyPresets || null,
          imageUrl: libEx.imageUrl || null,
          thumbnailUrl: libEx.thumbnailUrl || null,
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
      iconName: 'barbell',
    });
  };

  const handleConfirmCompleteSession = async () => {
    setShowCompleteModal(false);
    const exerciseCount = todayExercises.length;
    const totalSets = todayExercises.reduce((acc, ex) => acc + ex.sets.length, 0);

    // 1. Instantly clear active UI state & show notification (0ms delay)
    setTodayExercises([]);

    showToast({
      message: 'Workout Session Completed',
      description: `Logged ${exerciseCount} exercises (${totalSets} sets) into your History.`,
      type: 'success',
      iconName: 'checkmark-circle',
      actionLabel: 'View History',
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

  const handleAddAiExercises = async (exercises: AIWorkoutPlan['exercises']) => {
    for (const ex of exercises) {
      const defaultSets = Array.from({ length: ex.sets || 3 }).map((_, i) => ({
        weight: ex.suggestedWeightKg || (i === 0 ? 30 : 35),
        reps: ex.reps || 10,
        bodyweight: ex.category?.toLowerCase().includes('bodyweight') || false,
      }));
      await addExerciseToTodaySession({
        name: ex.name,
        category: ex.category || 'Strength',
        type: 'Compound',
        defaultSets,
      });
    }
    await fetchTodaySession();
    showToast({
      message: 'AI Routine Added',
      description: `Added ${exercises.length} exercises to today's workout`,
      type: 'success',
      iconName: 'sparkles',
    });
  };

  const handleRepeatWorkoutSession = async (session: CompletedSession) => {
    if (!session.exercises || session.exercises.length === 0) {
      showToast({
        message: 'No Exercises in Routine',
        description: 'This past session does not contain any exercises.',
        type: 'warning',
        iconName: 'alert-circle',
      });
      return;
    }

    try {
      for (const ex of session.exercises) {
        const defaultSets = ex.sets && ex.sets.length > 0
          ? ex.sets.map((s) => ({
              weight: s.weight !== undefined && s.weight !== '' ? Number(s.weight) : undefined,
              reps: s.reps !== undefined && s.reps !== '' ? Number(s.reps) : undefined,
              bodyweight: Boolean(s.bodyweight),
            }))
          : undefined;

        await addExerciseToTodaySession({
          exerciseId: ex.exerciseId,
          name: ex.name,
          category: ex.category || 'Strength',
          type: 'Compound',
          defaultSets,
        });
      }

      await fetchTodaySession();
      setActiveTab('today');
      showToast({
        message: 'Routine Added to Today! 💪',
        description: `Loaded ${session.exercises.length} exercises from "${session.title}"`,
        type: 'success',
        iconName: 'barbell',
      });
    } catch (err) {
      console.log('Error repeating session routine:', err);
      showToast({
        message: 'Failed to Repeat Routine',
        description: 'Could not add exercises to today\'s session.',
        type: 'error',
        iconName: 'alert-circle',
      });
    }
  };

  const handleStartRoutine = async (routine: WorkoutRoutineTemplate) => {
    if (!routine.exercises || routine.exercises.length === 0) {
      showToast({
        message: 'No Exercises in Routine',
        description: 'This routine template does not have any exercises.',
        type: 'warning',
        iconName: 'alert-circle',
      });
      return;
    }

    try {
      for (const ex of routine.exercises) {
        const defaultSets = ex.defaultSets && ex.defaultSets.length > 0
          ? ex.defaultSets.map((s) => ({
              weight: s.weight !== undefined && s.weight !== '' ? Number(s.weight) : undefined,
              reps: s.reps !== undefined && s.reps !== '' ? Number(s.reps) : undefined,
              bodyweight: Boolean(s.bodyweight),
            }))
          : undefined;

        await addExerciseToTodaySession({
          exerciseId: ex.exerciseId,
          name: ex.name,
          category: ex.category || 'Strength',
          type: ex.type || 'Compound',
          defaultSets,
        });
      }

      await fetchTodaySession();
      setActiveTab('today');
      showToast({
        message: `${routine.title} Loaded! 💪`,
        description: `Added ${routine.exercises.length} exercises to today's workout`,
        type: 'success',
        iconName: 'barbell',
      });
    } catch (err) {
      console.log('Error starting routine:', err);
      showToast({
        message: 'Failed to Start Routine',
        description: 'Could not load exercises into today\'s session.',
        type: 'error',
        iconName: 'alert-circle',
      });
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 115 }}>
        {/* Header */}
        <Text className="text-3xl font-black text-text-primary dark:text-text-primary-dark tracking-tight">
          Workouts
        </Text>
        <Text className="mt-1 mb-4 text-xs text-text-muted dark:text-text-muted-dark font-normal">
          Track your exercise completion and performance
        </Text>

        {/* Top Segmented Tabs */}
        <WorkoutTabs
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            if (tab === 'today') fetchScheduledRoutine();
          }}
          historyCount={completedSessionsCount}
        />

        {/* Tab Content */}
        {activeTab === 'today' && (
          <TodayWorkoutTab
            exercises={todayExercises}
            completedSessionsCount={completedSessionsCount}
            completedStats={completedStats}
            scheduledRoutine={todayScheduledRoutine}
            onLoadScheduledRoutine={() => todayScheduledRoutine && handleStartRoutine(todayScheduledRoutine)}
            onNavigateToPlanner={() => setActiveTab('planner')}
            onToggleSet={handleToggleSet}
            onUpdateSet={handleUpdateSet}
            onAddSet={handleAddSet}
            onDeleteSet={handleDeleteSet}
            onRemoveExercise={promptRemoveExercise}
            onUpdateExercisePreset={handleUpdateExercisePreset}
            onNavigateToLibrary={() => setActiveTab('library')}
            onOpenAiGenerator={() => setShowAiModal(true)}
            onCompleteSession={() => setShowCompleteModal(true)}
          />
        )}

        {activeTab === 'planner' && (
          <WorkoutPlannerTab
            onStartRoutine={handleStartRoutine}
            onSwitchToToday={() => setActiveTab('today')}
          />
        )}

        {activeTab === 'library' && (
          <WorkoutLibraryTab onAddExercise={handleAddExerciseFromLibrary} />
        )}

        {activeTab === 'history' && (
          <WorkoutHistoryTab
            onRepeatSession={handleRepeatWorkoutSession}
            onSwitchToToday={() => setActiveTab('today')}
          />
        )}
      </ScrollView>

      {/* AI Workout Generator Modal */}
      <AiWorkoutGeneratorModal
        visible={showAiModal}
        onClose={() => setShowAiModal(false)}
        onAddExercises={handleAddAiExercises}
        userGoal={user?.goal}
      />

      {/* Completion Modal */}
      <ConfirmModal
        visible={showCompleteModal}
        title="Complete Session"
        message="Ready to log and complete today's workout session?"
        iconName="trophy"
        confirmText="Finish & Save"
        cancelText="Keep Training"
        onConfirm={handleConfirmCompleteSession}
        onCancel={() => setShowCompleteModal(false)}
      />

      {/* Remove Exercise Confirmation Modal */}
      <ConfirmModal
        visible={Boolean(exerciseToRemove)}
        title="Remove Exercise"
        message={`Are you sure you want to remove "${exerciseToRemove?.name}" and all its logged sets from today's workout?`}
        confirmText="Remove"
        cancelText="Keep"
        isDanger
        iconName="trash-outline"
        onConfirm={handleConfirmRemoveExercise}
        onCancel={() => setExerciseToRemove(null)}
      />
    </SafeAreaView>
  );
}