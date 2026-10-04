import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import WorkoutTabs, { WorkoutTabType } from '@/components/workouts/WorkoutTabs';
import TodayWorkoutTab, { TodayExerciseItem } from '@/components/workouts/TodayWorkoutTab';
import WorkoutPlannerTab from '@/components/workouts/WorkoutPlannerTab';
import WorkoutLibraryTab from '@/components/workouts/WorkoutLibraryTab';
import WorkoutHistoryTab from '@/components/workouts/WorkoutHistoryTab';
import { useWorkoutTimer } from '@/context/WorkoutTimerContext';
import { LibraryExercise, CompletedSession, WorkoutRoutineTemplate, getTodayDateString } from '@/components/workouts/workoutTypes';
import { DEFAULT_ROUTINE_TEMPLATES, DEFAULT_WEEKLY_SPLIT, getTodayDayOfWeek } from '@/components/workouts/plannerPresets';
import { ExerciseDetailsModal } from '@/components/workouts/ExerciseDetailsModal';
import { getDifficultyPreset } from '@/components/workouts/workoutPresets';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AiWorkoutGeneratorModal from '@/components/workouts/AiWorkoutGeneratorModal';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import { screenCache } from '@/utils/screenCache';
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
import { COMMON_EXERCISES_CATALOG } from '@/data/commonExercises';
import { hapticFeedback } from '@/utils/haptics';
import { useThemeColors } from '@/constants/colors';

const EXERCISE_CATALOG_MAP = new Map<string, LibraryExercise>();
COMMON_EXERCISES_CATALOG.forEach((ex) => {
  if (ex.id) EXERCISE_CATALOG_MAP.set(ex.id.toLowerCase().trim(), ex);
  if (ex.name) EXERCISE_CATALOG_MAP.set(ex.name.toLowerCase().trim(), ex);
});

const EXERCISE_ALIASES: Record<string, string> = {
  'barbell bench press': 'ex-bench-press',
  'flat bench press': 'ex-bench-press',
  'flat dumbbell press': 'ex-dumbbell-bench-press',
  'dumbbell press': 'ex-dumbbell-bench-press',
  'overhead press': 'ex-overhead-shoulder-press',
  'military press': 'ex-overhead-shoulder-press',
  'barbell back squat': 'ex-barbell-squat',
  'squats': 'ex-barbell-squat',
  'squat': 'ex-barbell-squat',
  'walking lunges': 'ex-walking-dumbbell-lunges',
  'dumbbell lunges': 'ex-walking-dumbbell-lunges',
  'lunges': 'ex-walking-dumbbell-lunges',
  'goblet squats': 'ex-goblet-squat',
  'goblet squat': 'ex-goblet-squat',
  'dumbbell bicep curl': 'ex-barbell-bicep-curl',
  'bicep curls': 'ex-barbell-bicep-curl',
  'bicep curl': 'ex-barbell-bicep-curl',
  'curls': 'ex-barbell-bicep-curl',
  'lat pulldowns': 'ex-lat-pulldown',
  'pulldowns': 'ex-lat-pulldown',
  'pushups': 'ex-push-ups',
  'push ups': 'ex-push-ups',
  'pushup': 'ex-push-ups',
  'pullups': 'ex-pull-ups',
  'pull ups': 'ex-pull-ups',
  'pullup': 'ex-pull-ups',
  'chinups': 'ex-chin-ups',
  'chin ups': 'ex-chin-ups',
  'deadlifts': 'ex-conventional-barbell-deadlift',
  'deadlift': 'ex-conventional-barbell-deadlift',
  'romanian deadlifts': 'ex-romanian-deadlift',
  'rdl': 'ex-romanian-deadlift',
  'leg press': 'ex-45-degree-leg-press',
  'dips': 'ex-chest-dips',
  'seated cable rows': 'ex-seated-cable-row',
  'cable row': 'ex-seated-cable-row',
  'barbell row': 'ex-bent-over-barbell-row',
  'bent over row': 'ex-bent-over-barbell-row',
  'lateral raises': 'ex-lateral-dumbbell-raises',
  'side raises': 'ex-lateral-dumbbell-raises',
};

function inferMuscleGroup(name: string): { primaryMuscle: string; muscleGroup: string; bodyPart: string } {
  const n = (name || '').toLowerCase();
  if (n.includes('chest') || n.includes('pec') || n.includes('bench') || n.includes('push-up') || n.includes('push up') || n.includes('pushup') || n.includes('dip')) {
    return { primaryMuscle: 'Chest', muscleGroup: 'Chest', bodyPart: 'Upper Body' };
  }
  if (n.includes('lat') || n.includes('pull-up') || n.includes('pull up') || n.includes('pullup') || n.includes('row') || n.includes('deadlift') || n.includes('back') || n.includes('pulldown') || n.includes('chin-up') || n.includes('chinup')) {
    return { primaryMuscle: 'Back', muscleGroup: 'Back', bodyPart: 'Upper Body' };
  }
  if (n.includes('squat') || n.includes('lunge') || n.includes('leg press') || n.includes('quad') || n.includes('hamstring') || n.includes('calf') || n.includes('glute')) {
    return { primaryMuscle: n.includes('glute') ? 'Glutes' : n.includes('calf') ? 'Calves' : n.includes('hamstring') ? 'Hamstrings' : 'Quadriceps', muscleGroup: 'Legs', bodyPart: 'Lower Body' };
  }
  if (n.includes('shoulder') || n.includes('delt') || n.includes('overhead') || n.includes('military') || n.includes('lateral raise') || n.includes('arnold') || n.includes('shrug')) {
    return { primaryMuscle: n.includes('shrug') ? 'Traps' : 'Shoulders', muscleGroup: 'Shoulders', bodyPart: 'Upper Body' };
  }
  if (n.includes('bicep') || n.includes('tricep') || n.includes('curl') || n.includes('skull crusher') || n.includes('pushdown') || n.includes('arm')) {
    return { primaryMuscle: n.includes('tricep') || n.includes('skull') || n.includes('pushdown') ? 'Triceps' : 'Biceps', muscleGroup: 'Arms', bodyPart: 'Upper Body' };
  }
  if (n.includes('plank') || n.includes('crunch') || n.includes('ab') || n.includes('core') || n.includes('twist') || n.includes('knee raise') || n.includes('rollout')) {
    return { primaryMuscle: 'Core', muscleGroup: 'Core', bodyPart: 'Core' };
  }
  if (n.includes('run') || n.includes('cycle') || n.includes('bike') || n.includes('treadmill') || n.includes('cardio') || n.includes('rowing') || n.includes('jump')) {
    return { primaryMuscle: 'Cardio', muscleGroup: 'Cardio', bodyPart: 'Full Body' };
  }
  return { primaryMuscle: 'Chest', muscleGroup: 'Chest', bodyPart: 'Upper Body' };
}

function getExerciseMetadata(nameOrId?: string, fallbackName?: string): Partial<LibraryExercise> {
  const searchTerms = [nameOrId, fallbackName].filter(Boolean) as string[];

  for (const raw of searchTerms) {
    const key = raw.toLowerCase().trim();
    if (!key) continue;

    // 1. Direct match on ID or exact name
    if (EXERCISE_CATALOG_MAP.has(key)) return EXERCISE_CATALOG_MAP.get(key)!;

    // 2. Direct alias match
    const aliasId = EXERCISE_ALIASES[key];
    if (aliasId && EXERCISE_CATALOG_MAP.has(aliasId)) return EXERCISE_CATALOG_MAP.get(aliasId)!;

    // 3. Normalized string match (strip parenthetical notes, prefixes)
    const clean = key.replace(/\(.*?\)/g, '').replace(/[^a-z0-9\s-]/g, '').trim();
    if (EXERCISE_CATALOG_MAP.has(clean)) return EXERCISE_CATALOG_MAP.get(clean)!;

    const unPrefixed = clean.replace(/^(barbell|dumbbell|cable|machine|seated|lying|standing|incline|decline|flat|wide-grip|close-grip)\s+/i, '').trim();
    if (EXERCISE_CATALOG_MAP.has(unPrefixed)) return EXERCISE_CATALOG_MAP.get(unPrefixed)!;

    // 4. Substring search in catalog
    for (const [mapKey, catEx] of EXERCISE_CATALOG_MAP.entries()) {
      if (mapKey.length > 3 && (key.includes(mapKey) || mapKey.includes(key) || (unPrefixed.length > 3 && mapKey.includes(unPrefixed)))) {
        return catEx;
      }
    }
  }

  // 5. Intelligent fallback inference so it NEVER defaults to generic 'Full Body'
  const targetName = fallbackName || nameOrId || '';
  const inferred = inferMuscleGroup(targetName);
  return {
    name: targetName,
    primaryMuscle: inferred.primaryMuscle,
    muscleGroup: inferred.muscleGroup,
    bodyPart: inferred.bodyPart,
    category: 'Strength',
    type: 'Compound',
    difficulty: 'Intermediate',
    recommendedSets: 3,
    recommendedReps: 10,
    recommendedRest: 90,
    recommendedTempo: '2-0-1-0',
  };
}

export default function Workouts() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<WorkoutTabType>('today');
  const [todayExercises, setTodayExercises] = useState<TodayExerciseItem[]>([]);
  const [todayScheduledRoutine, setTodayScheduledRoutine] = useState<WorkoutRoutineTemplate | null>(null);
  const [isRestDay, setIsRestDay] = useState(false);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const [completedStats, setCompletedStats] = useState<{ duration: number; caloriesBurned: number } | null>(null);
  const [loading, setLoading] = useState(!screenCache.workoutsLoaded);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [exerciseToRemove, setExerciseToRemove] = useState<TodayExerciseItem | null>(null);
  const { startRestTimer } = useWorkoutTimer();
  const updateTimersRef = useRef<Record<string, any>>({});

  const getTodayCacheKey = () => {
    return authStorage.getScopedKey(user?.id, `fittrack_today_exercises_${getTodayDateString()}`);
  };

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
        } catch { }
      }

      let split = DEFAULT_WEEKLY_SPLIT;
      if (savedSplit) {
        try {
          const parsed = JSON.parse(savedSplit);
          if (parsed && typeof parsed === 'object') split = parsed;
        } catch { }
      }

      const todayDay = getTodayDayOfWeek();
      const routineId = split[todayDay];
      const matched = templates.find((r) => r.id === routineId) || null;
      setTodayScheduledRoutine(matched);
      setIsRestDay(!matched && routineId === null);
    } catch {
      setTodayScheduledRoutine(null);
      setIsRestDay(false);
    }
  };

  const fetchTodaySession = async () => {
    const cacheKey = getTodayCacheKey();
    try {
      // 1. Read local storage cache first to eliminate empty state flicker
      const enrichWithCatalogGif = (items: TodayExerciseItem[]): TodayExerciseItem[] => {
        const localMap = new Map(COMMON_EXERCISES_CATALOG.map((c) => [c.name.toLowerCase(), c]));
        return items.map((item) => {
          const local = localMap.get((item.name || '').toLowerCase());
          return {
            ...item,
            gifUrl: item.gifUrl || local?.gifUrl || null,
          };
        });
      };

      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTodayExercises(enrichWithCatalogGif(parsed));
            setLoading(false);
          }
        } catch { }
      }

      // 2. Fetch fresh session from server
      const res = await getTodayWorkoutSession();
      if (res.session && res.session.exercises) {
        const formatted: TodayExerciseItem[] = res.session.exercises.map((e: any) => {
          const meta = getExerciseMetadata(e.exerciseId, e.name);
          const rawPrimary = e.primaryMuscle && e.primaryMuscle !== 'Full Body' ? e.primaryMuscle : null;
          const resolvedPrimary = rawPrimary || meta.primaryMuscle || 'Chest';
          const rawGroup = e.muscleGroup && e.muscleGroup !== 'Full Body' ? e.muscleGroup : null;
          const resolvedGroup = rawGroup || meta.muscleGroup || resolvedPrimary;

          return {
            key: e.id,
            exerciseId: e.exerciseId || e.id,
            name: e.name,
            description: e.description || meta.description || null,
            category: e.category || meta.category || 'Strength',
            type: e.type || meta.type || 'Compound',
            difficulty: e.difficulty || meta.difficulty || 'Intermediate',
            primaryMuscle: resolvedPrimary,
            muscleGroup: resolvedGroup,
            secondaryMuscles: e.secondaryMuscles && e.secondaryMuscles.length > 0 ? e.secondaryMuscles : (meta.secondaryMuscles || []),
            bodyPart: e.bodyPart || meta.bodyPart || 'Upper Body',
            equipment: e.equipment ? (Array.isArray(e.equipment) ? e.equipment.join(', ') : e.equipment) : (meta.equipment ? (Array.isArray(meta.equipment) ? meta.equipment.join(', ') : meta.equipment) : 'Barbell'),
            equipmentAlternatives: e.equipmentAlternatives || meta.equipmentAlternatives || [],
            startingPosition: e.startingPosition || meta.startingPosition || null,
            instructions: e.instructions && e.instructions.length > 0 ? e.instructions : (meta.instructions || []),
            formTips: e.formTips && e.formTips.length > 0 ? e.formTips : (meta.formTips || []),
            commonMistakes: e.commonMistakes && e.commonMistakes.length > 0 ? e.commonMistakes : (meta.commonMistakes || []),
            breathingTechnique: e.breathingTechnique || meta.breathingTechnique || null,
            recommendedSets: e.recommendedSets || meta.recommendedSets || 3,
            recommendedReps: e.recommendedReps || meta.recommendedReps || 10,
            recommendedDuration: e.recommendedDuration || meta.recommendedDuration,
            recommendedRest: e.recommendedRest || meta.recommendedRest || 90,
            recommendedTempo: e.recommendedTempo || meta.recommendedTempo || '2-0-1-0',
            safetyInstructions: e.safetyInstructions || meta.safetyInstructions || null,
            injuryPreventionTips: e.injuryPreventionTips || meta.injuryPreventionTips || null,
            beginnerModification: e.beginnerModification || meta.beginnerModification || null,
            advancedVariation: e.advancedVariation || meta.advancedVariation || null,
            easierAlternative: e.easierAlternative || meta.easierAlternative || null,
            harderAlternative: e.harderAlternative || meta.harderAlternative || null,
            equipmentFreeAlternative: e.equipmentFreeAlternative || meta.equipmentFreeAlternative || null,
            similarExercises: e.similarExercises || meta.similarExercises || [],
            tags: e.tags || meta.tags || [],
            difficultyPresets: e.difficultyPresets || meta.difficultyPresets || null,
            imageUrl: e.imageUrl || meta.imageUrl || null,
            thumbnailUrl: e.thumbnailUrl || meta.thumbnailUrl || null,
            gifUrl: e.gifUrl || meta.gifUrl || null,
            sets: (e.sets || []).map((s: any, idx: number) => ({
              id: s.id,
              setNumber: s.setNumber || idx + 1,
              weight: s.weight ? String(s.weight) : undefined,
              reps: s.reps ? String(s.reps) : undefined,
              bodyweight: s.bodyweight || false,
              done: s.done,
            })),
          };
        });
        setTodayExercises(formatted);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(formatted));
      } else {
        setTodayExercises([]);
        await AsyncStorage.removeItem(cacheKey);
      }
    } catch (err) {
      console.log('Using clean active session state');
    } finally {
      screenCache.setWorkoutsLoaded(true);
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
    hapticFeedback.light();
    // Optimistic UI update & immediate cache persist
    setTodayExercises((prev) => {
      const next = prev.map((ex) => {
        if (ex.key !== exerciseKey) return ex;
        return {
          ...ex,
          sets: ex.sets.map((set) =>
            set.id === setId ? { ...set, done: !set.done } : set
          ),
        };
      });
      AsyncStorage.setItem(getTodayCacheKey(), JSON.stringify(next)).catch(() => { });
      return next;
    });

    if (!setId.startsWith('temp-')) {
      try {
        await toggleExerciseSetApi(setId);
      } catch (err) {
        console.log('Failed to toggle set on API server');
      }
    }
  };

  const handleUpdateSet = (
    exerciseKey: string,
    setId: string,
    field: 'weight' | 'reps',
    newValue: number,
    bodyweightOverride?: boolean
  ) => {
    // 1. Instant optimistic UI update & immediate cache persist
    setTodayExercises((prev) => {
      const next = prev.map((ex) => {
        if (ex.key !== exerciseKey) return ex;
        const isBwExercise =
          ex.type?.toLowerCase() === 'bodyweight' ||
          ex.type?.toLowerCase() === 'calisthenics' ||
          ex.name?.toLowerCase().includes('pull-up') ||
          ex.name?.toLowerCase().includes('push-up') ||
          ex.name?.toLowerCase().includes('chin-up') ||
          ex.name?.toLowerCase().includes('dip') ||
          ex.sets.some((s) => s.bodyweight);

        return {
          ...ex,
          sets: ex.sets.map((set) => {
            if (set.id !== setId) return set;
            if (field === 'weight') {
              const newBw = bodyweightOverride !== undefined
                ? bodyweightOverride
                : (newValue === 0 ? isBwExercise : false);
              return {
                ...set,
                weight: String(newValue),
                bodyweight: newBw,
              };
            }
            return { ...set, [field]: String(newValue) };
          }),
        };
      });
      AsyncStorage.setItem(getTodayCacheKey(), JSON.stringify(next)).catch(() => { });
      return next;
    });

    if (setId.startsWith('temp-')) return;

    // 2. Debounced API sync per set and field (450ms)
    const timerKey = `${setId}_${field}`;
    if (updateTimersRef.current[timerKey]) {
      clearTimeout(updateTimersRef.current[timerKey]);
    }

    updateTimersRef.current[timerKey] = setTimeout(async () => {
      try {
        const payload: any = { [field]: newValue };
        if (field === 'weight') {
          payload.bodyweight = bodyweightOverride !== undefined
            ? bodyweightOverride
            : (newValue === 0);
        }
        await updateExerciseSetValuesApi(setId, payload);
      } catch (err) {
        console.log('Failed to update set values on API server');
      } finally {
        delete updateTimersRef.current[timerKey];
      }
    }, 450);
  };

  const handleAddSet = async (exerciseKey: string) => {
    const tempSetId = `temp-set-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let nextSetNum = 1;

    // 1. Instant optimistic UI update & cache
    setTodayExercises((prev) => {
      const next = prev.map((ex) => {
        if (ex.key !== exerciseKey) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        nextSetNum = ex.sets.length + 1;
        const isBw = lastSet
          ? Boolean(lastSet.bodyweight)
          : Boolean(
            ex.type?.toLowerCase() === 'bodyweight' ||
            ex.type?.toLowerCase() === 'calisthenics' ||
            ex.name?.toLowerCase().includes('pull-up') ||
            ex.name?.toLowerCase().includes('push-up') ||
            ex.name?.toLowerCase().includes('dip')
          );
        const defaultWeight = isBw
          ? (lastSet?.weight ? String(lastSet.weight) : '0')
          : (lastSet?.weight ? String(lastSet.weight) : '20');

        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              id: tempSetId,
              setNumber: nextSetNum,
              weight: defaultWeight,
              reps: lastSet?.reps ? String(lastSet.reps) : '10',
              bodyweight: isBw,
              done: false,
            },
          ],
        };
      });
      AsyncStorage.setItem(getTodayCacheKey(), JSON.stringify(next)).catch(() => { });
      return next;
    });

    // 2. Instant feedback (0ms delay)
    showToast({
      message: 'Set Added',
      description: `Added Set ${nextSetNum}`,
      type: 'success',
      iconName: 'add-circle',
    });

    // 3. Sync to API server in background if exercise is persistent
    if (!exerciseKey.startsWith('temp-')) {
      try {
        const res = await addSetToWorkoutExerciseApi(exerciseKey);
        if (res.set) {
          setTodayExercises((prev) => {
            const next = prev.map((ex) => {
              if (ex.key !== exerciseKey) return ex;
              return {
                ...ex,
                sets: ex.sets.map((s) => (s.id === tempSetId ? { ...s, id: res.set.id } : s)),
              };
            });
            AsyncStorage.setItem(getTodayCacheKey(), JSON.stringify(next)).catch(() => { });
            return next;
          });
        }
      } catch (err) {
        console.log('Failed to add set on API server:', err);
      }
    }
  };

  const handleDeleteSet = async (exerciseKey: string, setId: string) => {
    // 1. Instant optimistic UI update & cache
    setTodayExercises((prev) => {
      const next = prev.map((ex) => {
        if (ex.key !== exerciseKey) return ex;
        return {
          ...ex,
          sets: ex.sets
            .filter((set) => set.id !== setId)
            .map((s, idx) => ({ ...s, setNumber: idx + 1 })),
        };
      });
      AsyncStorage.setItem(getTodayCacheKey(), JSON.stringify(next)).catch(() => { });
      return next;
    });

    // 2. Instant feedback (0ms delay)
    showToast({
      message: 'Set Deleted',
      description: 'Set removed from exercise',
      type: 'info',
      iconName: 'trash',
    });

    // 3. Sync deletion to API server in background
    if (!setId.startsWith('temp-')) {
      try {
        await deleteExerciseSetApi(setId);
      } catch (err) {
        console.log('Failed to delete set on API server:', err);
      }
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

    // 1. Instant optimistic UI update & cache
    const updated = todayExercises.filter((ex) => ex.key !== keyToDelete);
    setTodayExercises(updated);
    AsyncStorage.setItem(getTodayCacheKey(), JSON.stringify(updated)).catch(() => { });

    // 2. Instant notification (0ms delay)
    showToast({
      message: 'Exercise Removed',
      description: `Removed "${exToRemove.name}" from today's workout`,
      type: 'info',
      iconName: 'trash',
    });

    // 3. Sync deletion to API server in background
    if (!keyToDelete.startsWith('temp-')) {
      try {
        await deleteWorkoutExerciseApi(keyToDelete);
      } catch (err) {
        console.log('Failed to delete exercise on API server:', err);
      }
    }
  };

  const handleUpdateExercisePreset = async (exerciseKey: string, customized: LibraryExercise) => {
    const targetTier = ((customized.difficulty || 'Intermediate').toLowerCase()) as 'beginner' | 'intermediate' | 'advanced';
    const preset = getDifficultyPreset(customized, targetTier);
    const targetSets = preset.defaultSets;

    setTodayExercises((prev) => {
      const next = prev.map((ex) => {
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
      });
      AsyncStorage.setItem(getTodayCacheKey(), JSON.stringify(next)).catch(() => { });
      return next;
    });

    // Sync set values to backend only for this specific workout instance
    const targetEx = todayExercises.find((ex) => ex.key === exerciseKey);

    if (targetEx) {
      targetEx.sets.forEach((setRow, idx) => {
        const pSet = targetSets[idx];
        if (pSet && setRow.id && !setRow.id.startsWith('temp-')) {
          updateExerciseSetValuesApi(setRow.id, {
            weight: pSet.weight ? Number(pSet.weight) : undefined,
            reps: pSet.reps ? Number(pSet.reps) : undefined,
            done: false,
          }).catch(() => { });
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

    const tempKey = `temp-ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimisticSets = activeDefaultSets.map((s, idx) => ({
      id: `${tempKey}-set-${idx + 1}`,
      setNumber: idx + 1,
      weight: s.weight ? String(s.weight) : undefined,
      reps: s.reps ? String(s.reps) : undefined,
      bodyweight: Boolean(s.bodyweight),
      done: false,
    }));

    const newEx: TodayExerciseItem = {
      key: tempKey,
      exerciseId: libEx.id,
      name: libEx.name,
      description: libEx.description || null,
      category: libEx.category,
      difficulty: libEx.difficulty || preset.difficulty,
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
      gifUrl: libEx.gifUrl || null,
      sets: optimisticSets,
    };

    // 1. Instant optimistic state update & cache
    setTodayExercises((prev) => {
      const updated = [...prev, newEx];
      AsyncStorage.setItem(getTodayCacheKey(), JSON.stringify(updated)).catch(() => { });
      return updated;
    });

    // 2. Instant notification (0ms delay)
    const currentCount = todayExercises.filter((ex) => ex.name.toLowerCase() === libEx.name.toLowerCase() || ex.exerciseId === libEx.id).length + 1;
    const countSuffix = currentCount > 1 ? ` (${currentCount}x)` : '';
    showToast({
      message: `Added ${libEx.name}${countSuffix}`,
      description: `Added to Today's Workout (${preset.difficulty.toUpperCase()} preset)`,
      type: 'success',
      iconName: 'barbell',
    });

    // 3. Fire API call in background and reconcile IDs seamlessly
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
        setTodayExercises((prev) => {
          const next = prev.map((ex) => {
            if (ex.key !== tempKey) return ex;
            return {
              ...ex,
              key: res.exercise.id,
              exerciseId: res.exercise.exerciseId || libEx.id,
              sets: (res.exercise.sets || []).map((s: any, idx: number) => ({
                id: s.id,
                setNumber: s.setNumber || idx + 1,
                weight: s.weight !== undefined && s.weight !== null ? String(s.weight) : ex.sets[idx]?.weight,
                reps: s.reps !== undefined && s.reps !== null ? String(s.reps) : ex.sets[idx]?.reps,
                bodyweight: s.bodyweight !== undefined ? Boolean(s.bodyweight) : ex.sets[idx]?.bodyweight || false,
                done: Boolean(s.done),
              })),
            };
          });
          AsyncStorage.setItem(getTodayCacheKey(), JSON.stringify(next)).catch(() => { });
          return next;
        });
      }
    } catch (err) {
      console.log('[Workouts] Offline mode - keeping optimistic exercise in local state');
    }
  };

  const handleConfirmCompleteSession = async () => {
    hapticFeedback.success();
    setShowCompleteModal(false);
    const exerciseCount = todayExercises.length;
    const totalSets = todayExercises.reduce((acc, ex) => acc + ex.sets.length, 0);

    // 1. Instantly clear active UI state & show notification (0ms delay)
    setTodayExercises([]);
    AsyncStorage.removeItem(getTodayCacheKey());

    showToast({
      message: '🎉 Workout Session Crushed!',
      description: `Great effort! Logged ${exerciseCount} exercises (${totalSets} sets) into your personal training history.`,
      type: 'success',
      iconName: 'trophy',
      actionLabel: 'View History',
      onAction: () => setActiveTab('history'),
    });

    // 2. Perform API sync and refresh counts in the background
    try {
      await completeWorkoutSessionApi();
      DeviceEventEmitter.emit('WORKOUT_SESSION_COMPLETED');
      fetchTodaySession();
      fetchHistoryCount();
    } catch (err) {
      console.log('Error completing workout session on server:', err);
      fetchTodaySession();
      fetchHistoryCount();
    }
  };

  const handleAddAiExercises = async (exercises: AIWorkoutPlan['exercises']) => {
    if (!exercises || exercises.length === 0) return;

    // 1. Instantly create optimistic items
    const optimisticItems: TodayExerciseItem[] = exercises.map((ex, exIdx) => {
      const tempKey = `temp-ai-${Date.now()}-${exIdx}-${Math.random().toString(36).slice(2, 6)}`;
      const setCount = ex.sets || 3;
      const sets = Array.from({ length: setCount }).map((_, i) => ({
        id: `${tempKey}-set-${i + 1}`,
        setNumber: i + 1,
        weight: String(ex.suggestedWeightKg || (i === 0 ? 30 : 35)),
        reps: String(ex.reps || 10),
        bodyweight: Boolean(ex.category?.toLowerCase().includes('bodyweight')),
        done: false,
      }));

      const meta = getExerciseMetadata(undefined, ex.name);

      return {
        key: tempKey,
        name: ex.name,
        category: ex.category || meta.category || 'Strength',
        type: (meta.type as any) || 'Compound',
        difficulty: (meta.difficulty as any) || 'Intermediate',
        primaryMuscle: meta.primaryMuscle || 'Chest',
        muscleGroup: meta.muscleGroup || meta.primaryMuscle || 'Chest',
        secondaryMuscles: meta.secondaryMuscles || [],
        bodyPart: meta.bodyPart || 'Upper Body',
        equipment: meta.equipment ? (Array.isArray(meta.equipment) ? meta.equipment[0] : meta.equipment) : 'Dumbbell',
        equipmentAlternatives: meta.equipmentAlternatives || [],
        instructions: meta.instructions || [],
        formTips: meta.formTips || [],
        commonMistakes: meta.commonMistakes || [],
        recommendedSets: setCount,
        recommendedReps: ex.reps || 10,
        recommendedRest: meta.recommendedRest || 90,
        recommendedTempo: meta.recommendedTempo || '2-0-1-0',
        similarExercises: meta.similarExercises || [],
        tags: meta.tags || ['AI Generated'],
        imageUrl: meta.imageUrl || null,
        thumbnailUrl: meta.thumbnailUrl || null,
        gifUrl: meta.gifUrl || null,
        sets,
      };
    });

    // 2. Instant state update & cache (0ms delay)
    setTodayExercises((prev) => {
      const updated = [...prev, ...optimisticItems];
      AsyncStorage.setItem(getTodayCacheKey(), JSON.stringify(updated)).catch(() => { });
      return updated;
    });

    // 3. Instant toast notification
    showToast({
      message: 'AI Routine Added',
      description: `Added ${exercises.length} exercises to today's workout`,
      type: 'success',
      iconName: 'sparkles',
    });

    // 4. Background sequential sync to preserve exact exercise order
    try {
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
    } catch (err) {
      console.log('Error syncing AI exercises in background:', err);
    }
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

    // 1. Create optimistic items
    const optimisticItems: TodayExerciseItem[] = session.exercises.map((ex, exIdx) => {
      const tempKey = `temp-repeat-${Date.now()}-${exIdx}-${Math.random().toString(36).slice(2, 6)}`;
      const sets = (ex.sets && ex.sets.length > 0 ? ex.sets : [{ id: '1', setNumber: 1, reps: 10 }]).map((s, idx) => ({
        id: `${tempKey}-set-${idx + 1}`,
        setNumber: s.setNumber || idx + 1,
        weight: s.weight !== undefined && s.weight !== null ? String(s.weight) : undefined,
        reps: s.reps !== undefined && s.reps !== null ? String(s.reps) : undefined,
        bodyweight: Boolean(s.bodyweight),
        done: false,
      }));

      const meta = getExerciseMetadata(ex.exerciseId, ex.name);

      return {
        key: tempKey,
        exerciseId: ex.exerciseId || ex.id || meta.id,
        name: ex.name,
        category: ex.category || meta.category || 'Strength',
        type: (meta.type as any) || 'Compound',
        difficulty: (meta.difficulty as any) || 'Intermediate',
        primaryMuscle: (ex as any).primaryMuscle && (ex as any).primaryMuscle !== 'Full Body' ? (ex as any).primaryMuscle : meta.primaryMuscle || 'Chest',
        muscleGroup: (ex as any).muscleGroup && (ex as any).muscleGroup !== 'Full Body' ? (ex as any).muscleGroup : meta.muscleGroup || 'Chest',
        secondaryMuscles: meta.secondaryMuscles || (ex as any).secondaryMuscles || [],
        bodyPart: meta.bodyPart || (ex as any).bodyPart || 'Upper Body',
        equipment: meta.equipment ? (Array.isArray(meta.equipment) ? meta.equipment[0] : meta.equipment) : 'Barbell',
        equipmentAlternatives: meta.equipmentAlternatives || [],
        instructions: meta.instructions || [],
        formTips: meta.formTips || [],
        commonMistakes: meta.commonMistakes || [],
        recommendedSets: sets.length,
        recommendedReps: 10,
        recommendedRest: meta.recommendedRest || 90,
        recommendedTempo: meta.recommendedTempo || '2-0-1-0',
        similarExercises: meta.similarExercises || [],
        tags: meta.tags || [],
        imageUrl: meta.imageUrl || null,
        thumbnailUrl: meta.thumbnailUrl || null,
        gifUrl: meta.gifUrl || null,
        sets,
      };
    });

    // 2. Instant state update & switch tab & toast (0ms delay)
    setTodayExercises((prev) => {
      const updated = [...prev, ...optimisticItems];
      AsyncStorage.setItem(getTodayCacheKey(), JSON.stringify(updated)).catch(() => { });
      return updated;
    });

    setActiveTab('today');

    showToast({
      message: 'Routine Added to Today! 💪',
      description: `Loaded ${session.exercises.length} exercises from "${session.title}"`,
      type: 'success',
      iconName: 'barbell',
    });

    // 3. Background sequential sync to preserve exact exercise order
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
    } catch (err) {
      console.log('Error syncing repeated routine in background:', err);
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

    // 1. Create optimistic items
    const optimisticItems: TodayExerciseItem[] = routine.exercises.map((ex, exIdx) => {
      const tempKey = `temp-routine-${Date.now()}-${exIdx}-${Math.random().toString(36).slice(2, 6)}`;
      const defaultSets = ex.defaultSets && ex.defaultSets.length > 0
        ? ex.defaultSets
        : [
          { reps: 10, weight: 20, bodyweight: false },
          { reps: 10, weight: 20, bodyweight: false },
          { reps: 10, weight: 20, bodyweight: false },
        ];

      const sets = defaultSets.map((s, idx) => ({
        id: `${tempKey}-set-${idx + 1}`,
        setNumber: idx + 1,
        weight: s.weight !== undefined && s.weight !== null ? String(s.weight) : undefined,
        reps: s.reps !== undefined && s.reps !== null ? String(s.reps) : undefined,
        bodyweight: Boolean(s.bodyweight),
        done: false,
      }));

      const meta = getExerciseMetadata(ex.exerciseId, ex.name);

      return {
        key: tempKey,
        exerciseId: ex.exerciseId || meta?.id,
        name: ex.name,
        category: ex.category || meta.category || routine.category || 'Strength',
        type: ex.type || (meta.type as any) || 'Compound',
        difficulty: (meta.difficulty as any) || 'Intermediate',
        primaryMuscle: (ex.primaryMuscle && ex.primaryMuscle !== 'Full Body' ? ex.primaryMuscle : null) || meta.primaryMuscle || (routine.title?.includes('Push') ? 'Chest' : routine.title?.includes('Pull') ? 'Back' : routine.title?.includes('Leg') ? 'Quadriceps' : 'Chest'),
        muscleGroup: (ex.muscleGroup && ex.muscleGroup !== 'Full Body' ? ex.muscleGroup : null) || meta.muscleGroup || meta.primaryMuscle || 'Upper Body',
        secondaryMuscles: meta.secondaryMuscles || [],
        bodyPart: meta.bodyPart || (ex as any).bodyPart || (routine.category?.includes('Leg') ? 'Lower Body' : 'Upper Body'),
        equipment: meta.equipment ? (Array.isArray(meta.equipment) ? meta.equipment[0] : meta.equipment) : 'Barbell',
        equipmentAlternatives: meta.equipmentAlternatives || [],
        instructions: meta.instructions || [],
        formTips: meta.formTips || [],
        commonMistakes: meta.commonMistakes || [],
        recommendedSets: sets.length,
        recommendedReps: 10,
        recommendedRest: meta.recommendedRest || 90,
        recommendedTempo: meta.recommendedTempo || '2-0-1-0',
        similarExercises: meta.similarExercises || [],
        tags: meta.tags || [],
        imageUrl: meta.imageUrl || null,
        thumbnailUrl: meta.thumbnailUrl || null,
        gifUrl: meta.gifUrl || null,
        sets,
      };
    });

    // 2. Instant state update & switch tab & toast (0ms delay)
    setTodayExercises((prev) => {
      const updated = [...prev, ...optimisticItems];
      AsyncStorage.setItem(getTodayCacheKey(), JSON.stringify(updated)).catch(() => { });
      return updated;
    });

    setActiveTab('today');

    showToast({
      message: `${routine.title} Loaded! 💪`,
      description: `Added ${routine.exercises.length} exercises to today's workout`,
      type: 'success',
      iconName: 'barbell',
    });

    // 3. Sequential background sync to guarantee exact order preserved on server
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
          category: ex.category || routine.category || 'Strength',
          type: ex.type || 'Compound',
          defaultSets,
        });
      }
      await fetchTodaySession();
    } catch (err) {
      console.log('Error syncing started routine in background:', err);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 115 }}>
        <View className="w-full max-w-5xl self-center mx-auto">
          {/* Header */}
          <View className="mb-4">
            <Text className="text-2xl font-black text-text-primary dark:text-text-primary-dark tracking-tight">
              Workouts
            </Text>
          </View>

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
              loading={loading}
              isRestDay={isRestDay}
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
              onStartRestTimer={(seconds, exerciseName) =>
                startRestTimer(seconds, exerciseName)
              }
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
        </View>
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