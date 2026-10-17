import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { generateAIWorkout, AIWorkoutPlan } from '@/api/ai';
import { useToast } from '@/context/ToastContext';
import { useThemeColors } from '@/constants/colors';
import ModalCloseButton from '../ui/ModalCloseButton';
import ModalErrorBanner from '../ui/ModalErrorBanner';
import SubscriptionModal from '../subscription/SubscriptionModal';
import { getFriendlyErrorMessage } from '@/utils/errorMapper';
import { getCurrentSubscriptionApi, getSubscriptionPlansApi } from '@/api/subscription';
import QuotaUsageMeter from '../ui/QuotaUsageMeter';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStorage } from '@/utils/authStorage';
import { hapticFeedback } from '@/utils/haptics';
import { WorkoutRoutineTemplate } from './workoutTypes';

interface AiWorkoutGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  onAddExercises: (exercises: AIWorkoutPlan['exercises']) => Promise<void>;
  onSaveRoutine?: (routine: WorkoutRoutineTemplate) => Promise<void> | void;
  userGoal?: string;
}

const TARGET_AREAS = [
  'Full Body',
  'Chest & Triceps',
  'Back & Biceps',
  'Legs & Glutes',
  'Shoulders & Arms',
  'Core & Cardio',
];

export const createRoutineTemplateFromPlan = (
  plan: AIWorkoutPlan,
  area: string
): WorkoutRoutineTemplate => {
  return {
    id: `ai-routine-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: plan.title || `AI ${area} Routine`,
    description: `AI-customized workout plan targeting ${plan.targetMuscleGroup || area}.`,
    category: plan.targetMuscleGroup?.toLowerCase().includes('cardio') ? 'Conditioning' : 'Hypertrophy',
    difficulty: 'Intermediate',
    targetMuscleGroup: plan.targetMuscleGroup || area,
    estimatedDurationMinutes: plan.estimatedDurationMinutes || 45,
    exercises: plan.exercises.map((ex) => {
      const isBw =
        ex.category?.toLowerCase().includes('bodyweight') ||
        ex.name.toLowerCase().includes('push-up') ||
        ex.name.toLowerCase().includes('pull-up') ||
        ex.name.toLowerCase().includes('plank') ||
        (!ex.suggestedWeightKg || ex.suggestedWeightKg === 0);
      const defaultSets = Array.from({ length: ex.sets || 3 }).map(() => ({
        weight: ex.suggestedWeightKg && ex.suggestedWeightKg > 0 ? ex.suggestedWeightKg : (isBw ? 0 : 20),
        reps: ex.reps || 10,
        bodyweight: isBw,
      }));
      return {
        name: ex.name,
        category: ex.category || 'Strength',
        type: 'Compound',
        primaryMuscle: plan.targetMuscleGroup || area,
        muscleGroup: plan.targetMuscleGroup || area,
        defaultSets,
      };
    }),
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
};

export default function AiWorkoutGeneratorModal({
  visible,
  onClose,
  onAddExercises,
  onSaveRoutine,
  userGoal = 'MUSCLE_GAIN',
}: AiWorkoutGeneratorModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const { showToast, showError } = useToast();
  const { user } = useAuth();
  const [selectedArea, setSelectedArea] = useState('Full Body');
  const [loading, setLoading] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<AIWorkoutPlan | null>(null);
  const [addingToWorkout, setAddingToWorkout] = useState(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [saveToRoutines, setSaveToRoutines] = useState(true);
  const [savedAsRoutine, setSavedAsRoutine] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Quota & tier tracking
  const [isPro, setIsPro] = useState(false);
  const [routineUsed, setRoutineUsed] = useState(0);
  const [routineLimit, setRoutineLimit] = useState(5);
  const [routineResetsAt, setRoutineResetsAt] = useState<string | null>(null);

  // Unmount safety: immediately abort any in-flight AI requests when modal unmounts
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    onClose();
  };

  const quotaCacheKey = authStorage.getScopedKey(user?.id, 'fittrack_ai_workout_quota_cache');

  useEffect(() => {
    if (visible) {
      // 1. Instant local cache load (0ms - eliminates quota pop-in)
      AsyncStorage.getItem(quotaCacheKey)
        .then((cached) => {
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed.used === 'number') {
              setRoutineUsed(parsed.used);
              if (parsed.limit) setRoutineLimit(parsed.limit);
              if (parsed.resetsAt) setRoutineResetsAt(parsed.resetsAt);
              if (typeof parsed.isPro === 'boolean') setIsPro(parsed.isPro);
            }
          }
        })
        .catch(() => {});

      // 2. Background fresh fetch from API server (Stale-While-Revalidate)
      getCurrentSubscriptionApi()
        .then((res) => {
          if (res?.success && res.isPro) setIsPro(true);
        })
        .catch(() => {});

      getSubscriptionPlansApi()
        .then((res) => {
          let updatedQuota: any = null;
          if (res?.userUsage?.usage?.WORKOUT_GENERATOR) {
            const u = res.userUsage.usage.WORKOUT_GENERATOR;
            setRoutineUsed(u.used);
            setRoutineLimit(u.limit);
            if (u.resetsAt) setRoutineResetsAt(u.resetsAt);
            updatedQuota = { used: u.used, limit: u.limit, resetsAt: u.resetsAt, isPro };
          } else if (res?.limits) {
            const maxL = isPro ? res.limits.PRO.WORKOUT_GENERATOR.max : res.limits.FREE.WORKOUT_GENERATOR.max;
            setRoutineLimit(maxL);
            updatedQuota = { used: routineUsed, limit: maxL, isPro };
          }
          if (updatedQuota) {
            AsyncStorage.setItem(quotaCacheKey, JSON.stringify(updatedQuota)).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [visible, isPro, quotaCacheKey]);

  const handleGenerate = async (areaToUse?: string) => {
    if (routineUsed >= routineLimit) {
      setGeneratorError(`Monthly limit of ${routineLimit} routines reached. Resets on the 1st of next month.`);
      return;
    }
    const area = areaToUse || selectedArea;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setWorkoutPlan(null);
    setSavedAsRoutine(false);
    setGeneratorError(null);
    try {
      const res = await generateAIWorkout({
        targetArea: area,
        activityLevel: user?.activityLevel,
        signal: controller.signal,
      });
      if (res.success && res.workoutPlan && res.workoutPlan.exercises?.length > 0) {
        setWorkoutPlan(res.workoutPlan);
        setRoutineUsed((prev) => prev + 1);
      } else {
        setGeneratorError('No workout plan generated. Please try a different focus or try again.');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        // User aborted workout generation or closed modal; return cleanly
        return;
      }
      console.log('AI Workout Generation Error:', err?.message);
      const errText = err?.message || '';
      if (
        errText.includes('LIMIT_REACHED') ||
        errText.includes('MONTHLY_ROUTINE_LIMIT_REACHED') ||
        err?.status === 429
      ) {
        setRoutineUsed(routineLimit);
        setGeneratorError(`Monthly limit of ${routineLimit} routines reached. Resets on the 1st of next month.`);
      } else {
        setGeneratorError(
          getFriendlyErrorMessage(
            err,
            'Unable to generate workout right now. Please check your connection and try again.'
          )
        );
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setLoading(false);
    }
  };

  const handleSelectArea = (area: string) => {
    if (area === selectedArea) return;
    hapticFeedback.light();
    setSelectedArea(area);
  };

  const handleSaveOnly = async () => {
    if (!workoutPlan || !workoutPlan.exercises?.length || !onSaveRoutine || savedAsRoutine) return;
    setSavingRoutine(true);
    try {
      const template = createRoutineTemplateFromPlan(workoutPlan, selectedArea);
      await onSaveRoutine(template);
      setSavedAsRoutine(true);
      hapticFeedback.success();
    } catch (err) {
      console.log('Error saving routine template only:', err);
    } finally {
      setSavingRoutine(false);
    }
  };

  const handleCommitToWorkout = async () => {
    if (!workoutPlan || !workoutPlan.exercises?.length) return;
    setAddingToWorkout(true);
    try {
      if (saveToRoutines && !savedAsRoutine && onSaveRoutine) {
        const template = createRoutineTemplateFromPlan(workoutPlan, selectedArea);
        await onSaveRoutine(template);
        setSavedAsRoutine(true);
      }
      await onAddExercises(workoutPlan.exercises);
      onClose();
    } catch (err) {
      console.log('Error adding AI exercises to workout session:', err);
    } finally {
      setAddingToWorkout(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View
          style={[
            styles.modalContent,
            { paddingBottom: Math.max(32, insets.bottom + 12) },
            Platform.select({
              web: {
                boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.25)',
              } as any,
              default: {
                elevation: 16,
              },
            }),
          ]}
          className="bg-surface dark:bg-surface-dark border-t border-input-border dark:border-input-border-dark rounded-t-3xl p-5 pb-8 max-h-[88%]"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center">
                <Ionicons name="sparkles" size={18} color={colors.accent} />
              </View>
              <View>
                <Text className="text-base font-bold text-text-primary dark:text-text-primary-dark">
                  AI Routine Generator
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  {userGoal === 'WEIGHT_LOSS' ? 'Calorie Burn & Tone' : 'Hypertrophy & Strength'}
                </Text>
              </View>
            </View>
            <ModalCloseButton onClose={handleClose} />
          </View>

          {/* Reusable Quota Usage Meter */}
          <QuotaUsageMeter
            isPro={isPro}
            used={routineUsed}
            limit={routineLimit}
            unit="routines"
            period="month"
            resetsAt={routineResetsAt || undefined}
            onUpgradePress={() => setShowSubscriptionModal(true)}
            className="mb-3"
          />

          {/* Inline Error Banner */}
          <ModalErrorBanner
            error={generatorError}
            onDismiss={() => setGeneratorError(null)}
          />

          {generatorError &&
          (generatorError.includes('routines reached') ||
            generatorError.includes('LIMIT_REACHED') ||
            generatorError.includes('MONTHLY_ROUTINE_LIMIT_REACHED')) ? (
            <TouchableOpacity
              onPress={() => setShowSubscriptionModal(true)}
              activeOpacity={0.8}
              className="mb-3 py-2.5 px-3 bg-accent/15 dark:bg-accent-dark/20 border border-accent dark:border-accent-dark rounded-xl flex-row items-center justify-center gap-2"
            >
              <Ionicons name="sparkles" size={15} color={colors.accent} />
              <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                {isPro ? 'View Pro Plan' : 'See Pro plan'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Target Focus Chip Selector */}
          <View className="mb-3">
            <Text className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-2">
              Target Muscle Focus
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {TARGET_AREAS.map((area) => {
                const isActive = selectedArea === area;
                return (
                  <TouchableOpacity
                    key={area}
                    onPress={() => handleSelectArea(area)}
                    disabled={loading || addingToWorkout}
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full border justify-center items-center ${
                      isActive
                        ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
                        : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isActive
                          ? 'text-accent-contrast dark:text-accent-contrast-dark font-bold'
                          : 'text-text-muted dark:text-text-muted-dark'
                      }`}
                    >
                      {area}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Content Area */}
          {loading ? (
            <View className="py-16 items-center justify-center">
              <ActivityIndicator size="large" color={colors.accent} />
              <Text className="mt-4 font-bold text-sm text-text-primary dark:text-text-primary-dark">
                Designing your routine...
              </Text>
              <Text className="mt-1 text-xs text-text-muted dark:text-text-muted-dark text-center max-w-[260px] mb-4">
                Calibrating optimal exercises and rep ranges.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  abortControllerRef.current?.abort();
                  abortControllerRef.current = null;
                  setLoading(false);
                }}
                activeOpacity={0.7}
                className="bg-rose-500/15 dark:bg-rose-500/25 border border-rose-500/40 px-5 py-2.5 rounded-xl items-center justify-center"
              >
                <Text className="text-rose-500 dark:text-rose-400 font-bold text-xs">
                  Cancel Generation
                </Text>
              </TouchableOpacity>
            </View>
          ) : workoutPlan ? (
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {/* Routine Summary */}
              <View className="bg-input dark:bg-input-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark mb-3">
                <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark mb-1">
                  {workoutPlan.title}
                </Text>
                <View className="flex-row flex-wrap gap-2 mt-1">
                  <View className="bg-surface dark:bg-surface-dark rounded-md px-2 py-0.5 border border-input-border dark:border-input-border-dark">
                    <Text className="text-[11px] font-medium text-text-muted dark:text-text-muted-dark">
                      ~{workoutPlan.estimatedDurationMinutes || 45} mins
                    </Text>
                  </View>
                  <View className="bg-surface dark:bg-surface-dark rounded-md px-2 py-0.5 border border-input-border dark:border-input-border-dark">
                    <Text className="text-[11px] font-medium text-text-muted dark:text-text-muted-dark">
                      {workoutPlan.targetMuscleGroup || selectedArea}
                    </Text>
                  </View>
                  <View className="bg-surface dark:bg-surface-dark rounded-md px-2 py-0.5 border border-input-border dark:border-input-border-dark">
                    <Text className="text-[11px] font-medium text-text-muted dark:text-text-muted-dark">
                      {workoutPlan.exercises.length} Exercises
                    </Text>
                  </View>
                </View>
              </View>

              {/* Exercises List */}
              <View className="gap-y-2 mb-4">
                {workoutPlan.exercises.map((ex, idx) => (
                  <View
                    key={`${ex.name}-${idx}`}
                    className="p-3 bg-surface dark:bg-surface-dark rounded-xl border border-input-border dark:border-input-border-dark flex-row items-center justify-between"
                  >
                    <View className="flex-1 mr-2">
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-0.5" numberOfLines={1}>
                        {ex.name}
                      </Text>
                      <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                        {ex.category || 'Strength'}
                      </Text>
                    </View>

                    <View className="items-end bg-input dark:bg-input-dark px-2.5 py-1 rounded-lg border border-input-border dark:border-input-border-dark">
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                        {ex.sets || 3} sets × {ex.reps || 10} reps
                      </Text>
                      {ex.suggestedWeightKg && ex.suggestedWeightKg > 0 ? (
                        <Text className="text-[10px] font-medium text-text-muted dark:text-text-muted-dark">
                          ~{ex.suggestedWeightKg} kg
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>

              {/* Save to Routine Library Checkbox / Banner */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  hapticFeedback.light();
                  setSaveToRoutines(!saveToRoutines);
                }}
                className={`p-3 rounded-2xl border flex-row items-center justify-between mb-2 ${
                  saveToRoutines
                    ? 'bg-accent/10 dark:bg-accent-dark/15 border-accent/40 dark:border-accent-dark/40'
                    : 'bg-surface dark:bg-surface-dark border-input-border dark:border-input-border-dark'
                }`}
              >
                <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                  <View
                    className={`w-8 h-8 rounded-xl items-center justify-center ${
                      saveToRoutines ? 'bg-accent/20 dark:bg-accent-dark/30' : 'bg-input dark:bg-input-dark'
                    }`}
                  >
                    <Ionicons
                      name={saveToRoutines ? 'bookmark' : 'bookmark-outline'}
                      size={16}
                      color={saveToRoutines ? colors.accent : colors.textMuted}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                      Save to Routine Library
                    </Text>
                    <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                      Keep in Routines tab to repeat anytime without using AI quota
                    </Text>
                  </View>
                </View>
                <View
                  className={`w-5 h-5 rounded-md border items-center justify-center ${
                    saveToRoutines
                      ? 'bg-accent border-accent dark:bg-accent-dark dark:border-accent-dark'
                      : 'border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark'
                  }`}
                >
                  {saveToRoutines && <Ionicons name="checkmark" size={13} color={colors.accentContrast} />}
                </View>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View className="py-12 items-center justify-center">
              <View className="w-12 h-12 rounded-full bg-input dark:bg-input-dark items-center justify-center mb-3">
                <Ionicons name="sparkles" size={26} color={colors.accent} />
              </View>
              <Text className="font-bold text-text-primary dark:text-text-primary-dark text-sm">
                Ready to generate your workout
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-1 mb-4 text-center">
                Focus: <Text className="font-bold text-accent dark:text-accent-dark">{selectedArea}</Text>
              </Text>
              <TouchableOpacity
                onPress={() => handleGenerate(selectedArea)}
                activeOpacity={0.8}
                className="px-6 py-3 min-h-[44px] bg-accent dark:bg-accent-dark rounded-2xl items-center justify-center flex-row gap-2"
              >
                <Ionicons name="sparkles" size={16} color={colors.accentContrast} />
                <Text className="text-accent-contrast dark:text-accent-contrast-dark font-bold text-xs">
                  Generate Routine
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Footer Buttons */}
          {workoutPlan && !loading ? (
            <View className="pt-3 border-t border-input-border dark:border-input-border-dark gap-2">
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => handleGenerate(selectedArea)}
                  disabled={addingToWorkout || savingRoutine}
                  activeOpacity={0.7}
                  className="h-11 min-h-[44px] px-3.5 bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-2xl items-center justify-center flex-row gap-1.5"
                >
                  <Ionicons name="refresh-outline" size={14} color={colors.textPrimary} />
                  <Text className="font-semibold text-xs text-text-primary dark:text-text-primary-dark">
                    {workoutPlan.targetMuscleGroup && workoutPlan.targetMuscleGroup !== selectedArea
                      ? `Generate ${selectedArea}`
                      : 'Regenerate'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveOnly}
                  disabled={addingToWorkout || savingRoutine || savedAsRoutine}
                  activeOpacity={0.8}
                  className="flex-1 h-11 min-h-[44px] px-3 bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-2xl items-center justify-center flex-row gap-1.5"
                >
                  {savingRoutine ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <>
                      <Ionicons
                        name={savedAsRoutine ? 'checkmark-circle' : 'bookmark-outline'}
                        size={15}
                        color={savedAsRoutine ? colors.accent : colors.textPrimary}
                      />
                      <Text
                        className={`font-bold text-xs ${
                          savedAsRoutine
                            ? 'text-accent dark:text-accent-dark'
                            : 'text-text-primary dark:text-text-primary-dark'
                        }`}
                      >
                        {savedAsRoutine ? 'Saved to Routines' : 'Save Routine Only'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleCommitToWorkout}
                disabled={addingToWorkout || savingRoutine}
                activeOpacity={0.85}
                className="w-full h-11 min-h-[44px] bg-accent dark:bg-accent-dark rounded-2xl items-center justify-center flex-row gap-1.5"
              >
                {addingToWorkout ? (
                  <ActivityIndicator size="small" color={colors.accentContrast} />
                ) : (
                  <>
                    <Ionicons name="barbell-outline" size={15} color={colors.accentContrast} />
                    <Text className="font-bold text-xs text-accent-contrast dark:text-accent-contrast-dark">
                      {saveToRoutines && !savedAsRoutine
                        ? 'Add to Today & Save Routine'
                        : "Add to Today's Workout"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </Modal>
  );
}

const styles = {
  modalContent: {
    maxHeight: '85%',
  },
};
