import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateAIWorkout, AIWorkoutPlan } from '@/api/ai';
import { useToast } from '@/context/ToastContext';
import { useThemeColors } from '@/constants/colors';
import ModalCloseButton from '../ui/ModalCloseButton';

interface AiWorkoutGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  onAddExercises: (exercises: AIWorkoutPlan['exercises']) => Promise<void>;
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

export default function AiWorkoutGeneratorModal({
  visible,
  onClose,
  onAddExercises,
  userGoal = 'MUSCLE_GAIN',
}: AiWorkoutGeneratorModalProps) {
  const { colors } = useThemeColors();
  const { showToast, showError } = useToast();
  const [selectedArea, setSelectedArea] = useState('Full Body');
  const [loading, setLoading] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<AIWorkoutPlan | null>(null);
  const [addingToWorkout, setAddingToWorkout] = useState(false);

  const handleGenerate = async (areaToUse?: string) => {
    const area = areaToUse || selectedArea;
    setLoading(true);
    setWorkoutPlan(null);
    try {
      const res = await generateAIWorkout({ targetArea: area });
      if (res.success && res.workoutPlan && res.workoutPlan.exercises?.length > 0) {
        setWorkoutPlan(res.workoutPlan);
      } else {
        showError('Generation Notice', 'No workout plan generated. Please try again.');
      }
    } catch (err: any) {
      console.log('AI Workout Generation Error:', err?.message);
      showError('AI Service Notice', err?.message || 'Unable to generate workout right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArea = (area: string) => {
    setSelectedArea(area);
    handleGenerate(area);
  };

  const handleCommitToWorkout = async () => {
    if (!workoutPlan || !workoutPlan.exercises?.length) return;
    setAddingToWorkout(true);
    try {
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
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View
          style={[
            styles.modalContent,
            Platform.select({
              web: {
                boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.25)',
              } as any,
              default: {
                elevation: 16,
              },
            }),
          ]}
          className="bg-surface dark:bg-surface-dark border-t border-input-border dark:border-input-border-dark rounded-t-3xl p-5 max-h-[88%]"
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
            <ModalCloseButton onClose={onClose} />
          </View>

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
                    className={`px-3 py-1.5 rounded-full border ${
                      isActive
                        ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
                        : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isActive
                          ? 'text-white font-bold'
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
              <Text className="mt-1 text-xs text-text-muted dark:text-text-muted-dark text-center max-w-[260px]">
                Calibrating optimal exercises and rep ranges.
              </Text>
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
            </ScrollView>
          ) : (
            <View className="py-12 items-center justify-center">
              <View className="w-12 h-12 rounded-full bg-input dark:bg-input-dark items-center justify-center mb-3">
                <Ionicons name="sparkles" size={26} color={colors.accent} />
              </View>
              <Text className="font-bold text-text-primary dark:text-text-primary-dark text-sm">
                Ready to generate your workout
              </Text>
              <TouchableOpacity
                onPress={() => handleGenerate()}
                className="mt-3 px-5 py-3 bg-accent dark:bg-accent-dark rounded-2xl"
              >
                <Text className="text-white font-bold text-xs">
                  Generate Routine
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Footer Buttons */}
          {workoutPlan && !loading ? (
            <View className="pt-3 border-t border-input-border dark:border-input-border-dark flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleGenerate()}
                disabled={addingToWorkout}
                activeOpacity={0.7}
                className="h-11 px-4 bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-2xl items-center justify-center"
              >
                <Text className="font-semibold text-xs text-text-primary dark:text-text-primary-dark">
                  Regenerate
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCommitToWorkout}
                disabled={addingToWorkout}
                activeOpacity={0.85}
                className="flex-1 h-11 bg-accent dark:bg-accent-dark rounded-2xl items-center justify-center"
              >
                {addingToWorkout ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="font-bold text-xs text-white">
                    Add to Today's Workout
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = {
  modalContent: {
    maxHeight: '85%',
  },
};
