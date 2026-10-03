import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { LibraryExercise } from './workoutTypes';
import { getMuscleTheme } from './ExerciseVisual';

interface ExerciseMovementGuideProps {
  exercise: LibraryExercise;
}

export default function ExerciseMovementGuide({ exercise }: ExerciseMovementGuideProps) {
  const { colors, isDark } = useThemeColors();
  const theme = getMuscleTheme(exercise.primaryMuscle || exercise.muscleGroup, exercise.category, exercise.name);

  const instructionsList = Array.isArray(exercise.instructions) ? exercise.instructions : [];
  const formTipsList = Array.isArray(exercise.formTips) ? exercise.formTips : [];
  const mistakesList = Array.isArray(exercise.commonMistakes) ? exercise.commonMistakes : [];
  const eqAlternatives = Array.isArray(exercise.equipmentAlternatives) ? exercise.equipmentAlternatives : [];

  // Determine movement mechanics
  const isPush =
    exercise.name.toLowerCase().includes('press') ||
    exercise.name.toLowerCase().includes('push') ||
    exercise.name.toLowerCase().includes('squat') ||
    exercise.name.toLowerCase().includes('dip') ||
    exercise.name.toLowerCase().includes('extension') ||
    exercise.tags?.some((t: string) => t.toLowerCase() === 'push');

  const isPull =
    exercise.name.toLowerCase().includes('pull') ||
    exercise.name.toLowerCase().includes('row') ||
    exercise.name.toLowerCase().includes('curl') ||
    exercise.name.toLowerCase().includes('chin') ||
    exercise.name.toLowerCase().includes('deadlift') ||
    exercise.tags?.some((t: string) => t.toLowerCase() === 'pull');

  const movementTypeLabel = isPush
    ? 'Push Pattern (Concentric Force Drive)'
    : isPull
    ? 'Pull Pattern (Concentric Force Retraction)'
    : `${exercise.type || 'Compound'} Movement`;

  const primaryMuscle = exercise.primaryMuscle || exercise.muscleGroup || 'Full Body';
  const secondaryMuscles = Array.isArray(exercise.secondaryMuscles)
    ? exercise.secondaryMuscles.join(', ')
    : exercise.secondaryMuscles;

  return (
    <View className="gap-3.5">
      {/* 1. HOW IT LOOKS: MOVEMENT BLUEPRINT & SETUP */}
      <View className="rounded-2xl p-4 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark">
        <View className="flex-row items-center gap-2 mb-3">
          <View className={`w-8 h-8 rounded-xl items-center justify-center border ${theme.borderClass} ${theme.bgClass}`}>
            <Ionicons name="eye-outline" size={18} color={theme.color} />
          </View>
          <View>
            <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
              Movement Blueprint & Form Look
            </Text>
            <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
              Visual biomechanics, posture & equipment configuration
            </Text>
          </View>
        </View>

        {/* Visual Movement Flow Diagram */}
        <View className="rounded-xl p-3 bg-input dark:bg-input-dark border border-input-border/70 dark:border-input-border-dark/70 mb-3">
          <Text className="text-[10px] font-bold text-accent dark:text-accent-dark uppercase tracking-wider mb-2">
            Kinematic Movement Cycle
          </Text>
          <View className="flex-row items-center justify-between gap-1">
            <View className="flex-1 items-center p-2 rounded-lg bg-surface/80 dark:bg-surface-dark/80 border border-input-border/50">
              <Ionicons name="body-outline" size={16} color={colors.accent} />
              <Text className="text-[10px] font-bold text-text-primary dark:text-text-primary-dark mt-1 text-center">
                1. Stance
              </Text>
              <Text className="text-[8px] text-text-muted dark:text-text-muted-dark text-center" numberOfLines={1}>
                Plant & Brace
              </Text>
            </View>

            <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />

            <View className="flex-1 items-center p-2 rounded-lg bg-surface/80 dark:bg-surface-dark/80 border border-input-border/50">
              <Ionicons name="arrow-down-circle-outline" size={16} color="#38BDF8" />
              <Text className="text-[10px] font-bold text-text-primary dark:text-text-primary-dark mt-1 text-center">
                2. Stretch
              </Text>
              <Text className="text-[8px] text-text-muted dark:text-text-muted-dark text-center" numberOfLines={1}>
                Controlled Negative
              </Text>
            </View>

            <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />

            <View className="flex-1 items-center p-2 rounded-lg bg-surface/80 dark:bg-surface-dark/80 border border-input-border/50">
              <Ionicons name="flash-outline" size={16} color="#10B981" />
              <Text className="text-[10px] font-bold text-text-primary dark:text-text-primary-dark mt-1 text-center">
                3. Drive
              </Text>
              <Text className="text-[8px] text-text-muted dark:text-text-muted-dark text-center" numberOfLines={1}>
                Explosive Push/Pull
              </Text>
            </View>

            <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />

            <View className="flex-1 items-center p-2 rounded-lg bg-surface/80 dark:bg-surface-dark/80 border border-input-border/50">
              <Ionicons name="flame-outline" size={16} color="#F59E0B" />
              <Text className="text-[10px] font-bold text-text-primary dark:text-text-primary-dark mt-1 text-center">
                4. Squeeze
              </Text>
              <Text className="text-[8px] text-text-muted dark:text-text-muted-dark text-center" numberOfLines={1}>
                Peak Contraction
              </Text>
            </View>
          </View>
        </View>

        {/* Setup & Stance Card */}
        {exercise.startingPosition && (
          <View className="rounded-xl p-3 bg-surface/60 dark:bg-surface-dark/60 border border-input-border/60 dark:border-input-border-dark/60 mb-3">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Ionicons name="locate-outline" size={14} color={theme.color} />
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                Starting Setup & Posture
              </Text>
            </View>
            <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-5">
              {exercise.startingPosition}
            </Text>
          </View>
        )}

        {/* Equipment & Movement Meta Badges */}
        <View className="flex-row flex-wrap gap-2">
          <View className="px-2.5 py-1 rounded-lg bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark flex-row items-center gap-1.5">
            <Ionicons name="barbell-outline" size={13} color={colors.accent} />
            <Text className="text-[11px] font-semibold text-text-primary dark:text-text-primary-dark">
              Equipment: {Array.isArray(exercise.equipment) ? exercise.equipment.join(', ') : exercise.equipment || 'Bodyweight'}
            </Text>
          </View>

          <View className="px-2.5 py-1 rounded-lg bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark flex-row items-center gap-1.5">
            <Ionicons name="git-branch-outline" size={13} color={theme.color} />
            <Text className="text-[11px] font-semibold text-text-primary dark:text-text-primary-dark">
              {movementTypeLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. HOW TO DO IT: STEP-BY-STEP EXECUTION GUIDE */}
      <View className="rounded-2xl p-4 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-8 h-8 rounded-xl items-center justify-center bg-accent/15 border border-accent/30">
            <Ionicons name="list-outline" size={18} color={colors.accent} />
          </View>
          <View>
            <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
              How To Do Each Rep (Step-by-Step)
            </Text>
            <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
              Follow these exact execution steps for optimal hypertrophy and joint safety
            </Text>
          </View>
        </View>

        {/* Numbered Steps */}
        <View className="gap-2.5 mb-3.5">
          {instructionsList.map((step, idx) => (
            <View
              key={idx}
              className="flex-row items-start p-3 rounded-xl bg-input dark:bg-input-dark border border-input-border/70 dark:border-input-border-dark/70"
            >
              <View className="w-6 h-6 rounded-full bg-accent/20 border border-accent/40 items-center justify-center mr-3 mt-0.5">
                <Text className="text-xs font-black text-accent dark:text-accent-dark">
                  {idx + 1}
                </Text>
              </View>
              <Text className="flex-1 text-xs font-medium text-text-primary dark:text-text-primary-dark leading-5">
                {step}
              </Text>
            </View>
          ))}
        </View>

        {/* Breathing Synchronization */}
        {exercise.breathingTechnique && (
          <View className="p-3 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/30 flex-row items-start gap-2.5">
            <Ionicons name="fitness-outline" size={18} color="#0EA5E9" style={{ marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-xs font-bold text-sky-600 dark:text-sky-400 mb-0.5">
                Breathing Cadence:
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-4">
                {exercise.breathingTechnique}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 3. PRO FORM TIPS & COMMON MISTAKES */}
      <View className="rounded-2xl p-4 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-8 h-8 rounded-xl items-center justify-center bg-emerald-500/15 border border-emerald-500/30">
            <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
          </View>
          <View>
            <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
              Trainer Form Cues & Common Mistakes
            </Text>
            <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
              Golden cues to prevent injury and maximize target muscle engagement
            </Text>
          </View>
        </View>

        {/* Form Tips */}
        {formTipsList.length > 0 && (
          <View className="mb-3">
            <Text className="text-xs font-bold text-emerald-500 dark:text-emerald-400 mb-2 flex-row items-center">
              ✓ What TO Do (Pro Form Cues):
            </Text>
            <View className="gap-1.5">
              {formTipsList.map((tip, idx) => (
                <View key={idx} className="flex-row items-start gap-2 pl-1">
                  <Text className="text-emerald-500 font-bold">•</Text>
                  <Text className="text-xs text-text-primary dark:text-text-primary-dark flex-1 leading-4">
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mistakes to Avoid */}
        {mistakesList.length > 0 && (
          <View className="pt-3 border-t border-input-border/50 dark:border-input-border-dark/50">
            <Text className="text-xs font-bold text-danger dark:text-danger-dark mb-2 flex-row items-center">
              ✕ What NOT To Do (Common Mistakes):
            </Text>
            <View className="gap-1.5">
              {mistakesList.map((mistake, idx) => (
                <View key={idx} className="flex-row items-start gap-2 pl-1">
                  <Text className="text-danger font-bold">•</Text>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark flex-1 leading-4">
                    {mistake}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* 4. PROGRESSIONS & ALTERNATIVES */}
      {(exercise.beginnerModification || exercise.advancedVariation || exercise.equipmentFreeAlternative) && (
        <View className="rounded-2xl p-4 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-8 h-8 rounded-xl items-center justify-center bg-purple-500/15 border border-purple-500/30">
              <Ionicons name="swap-horizontal-outline" size={18} color="#A855F7" />
            </View>
            <View>
              <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
                Progressions & Equipment Alternatives
              </Text>
              <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                Scale difficulty up or down depending on gym availability and experience
              </Text>
            </View>
          </View>

          <View className="gap-2">
            {exercise.beginnerModification ? (
              <View className="p-2.5 rounded-xl bg-input dark:bg-input-dark border border-input-border/60">
                <Text className="text-[11px] font-bold text-accent dark:text-accent-dark mb-0.5">
                  Beginner Modification:
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-4">
                  {exercise.beginnerModification}
                </Text>
              </View>
            ) : null}

            {exercise.advancedVariation ? (
              <View className="p-2.5 rounded-xl bg-input dark:bg-input-dark border border-input-border/60">
                <Text className="text-[11px] font-bold text-purple-500 dark:text-purple-400 mb-0.5">
                  Advanced Progression:
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-4">
                  {exercise.advancedVariation}
                </Text>
              </View>
            ) : null}

            {exercise.equipmentFreeAlternative ? (
              <View className="p-2.5 rounded-xl bg-input dark:bg-input-dark border border-input-border/60">
                <Text className="text-[11px] font-bold text-sky-500 dark:text-sky-400 mb-0.5">
                  No Equipment Alternative:
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-4">
                  {exercise.equipmentFreeAlternative}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}
