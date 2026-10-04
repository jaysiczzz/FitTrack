import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { LibraryExercise } from './workoutTypes';
import { getMuscleTheme } from './ExerciseVisual';

interface ExerciseMovementGuideProps {
  exercise: LibraryExercise;
}

export default function ExerciseMovementGuide({ exercise }: ExerciseMovementGuideProps) {
  const { colors } = useThemeColors();
  const theme = getMuscleTheme(exercise.primaryMuscle || exercise.muscleGroup, exercise.category, exercise.name);

  const instructionsList = Array.isArray(exercise.instructions) ? exercise.instructions : [];
  const formTipsList = Array.isArray(exercise.formTips) ? exercise.formTips : [];
  const mistakesList = Array.isArray(exercise.commonMistakes) ? exercise.commonMistakes : [];
  
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

  const isCardio =
    exercise.category?.toLowerCase() === 'cardio' ||
    exercise.type?.toLowerCase() === 'cardio' ||
    exercise.muscleGroup?.toLowerCase() === 'cardio' ||
    exercise.name?.toLowerCase().includes('run') ||
    exercise.name?.toLowerCase().includes('bike') ||
    exercise.name?.toLowerCase().includes('rowing') ||
    exercise.name?.toLowerCase().includes('jump') ||
    exercise.name?.toLowerCase().includes('burpee') ||
    exercise.name?.toLowerCase().includes('climber');

  const isIsometric =
    exercise.name?.toLowerCase().includes('plank') ||
    exercise.name?.toLowerCase().includes('hold') ||
    exercise.type?.toLowerCase() === 'isometric';

  const kinematicCycle = isCardio
    ? [
        { num: '1', title: 'Cadence', sub: 'Steady Pace', icon: 'speedometer-outline' as const, color: '#38BDF8', bg: 'bg-sky-500/15' },
        { num: '2', title: 'Inhale', sub: 'Oxygen Flow', icon: 'heart-outline' as const, color: '#10B981', bg: 'bg-emerald-500/15' },
        { num: '3', title: 'Drive', sub: 'Aerobic Power', icon: 'flash-outline' as const, color: '#F59E0B', bg: 'bg-amber-500/15' },
        { num: '4', title: 'Recovery', sub: 'Active Flow', icon: 'flame-outline' as const, color: '#EC4899', bg: 'bg-pink-500/15' },
      ]
    : isIsometric
    ? [
        { num: '1', title: 'Setup', sub: 'Plant & Align', icon: 'body-outline' as const, color: colors.accent, bg: 'bg-accent/15' },
        { num: '2', title: 'Brace', sub: 'Lock Core', icon: 'shield-outline' as const, color: '#F59E0B', bg: 'bg-amber-500/15' },
        { num: '3', title: 'Tension', sub: 'Hold Steady', icon: 'stopwatch-outline' as const, color: '#10B981', bg: 'bg-emerald-500/15' },
        { num: '4', title: 'Breathe', sub: 'Steady Cadence', icon: 'fitness-outline' as const, color: '#38BDF8', bg: 'bg-sky-500/15' },
      ]
    : isPull
    ? [
        { num: '1', title: 'Grip', sub: 'Set Scapulae', icon: 'hand-left-outline' as const, color: colors.accent, bg: 'bg-accent/15' },
        { num: '2', title: 'Stretch', sub: 'Full Length', icon: 'arrow-down-circle-outline' as const, color: '#38BDF8', bg: 'bg-sky-500/15' },
        { num: '3', title: 'Drive', sub: 'Elbows Back', icon: 'flash-outline' as const, color: '#10B981', bg: 'bg-emerald-500/15' },
        { num: '4', title: 'Squeeze', sub: 'Peak Pull', icon: 'flame-outline' as const, color: '#F59E0B', bg: 'bg-amber-500/15' },
      ]
    : [
        { num: '1', title: 'Stance', sub: 'Plant & Brace', icon: 'body-outline' as const, color: colors.accent, bg: 'bg-accent/15' },
        { num: '2', title: 'Negative', sub: 'Control Down', icon: 'arrow-down-circle-outline' as const, color: '#38BDF8', bg: 'bg-sky-500/15' },
        { num: '3', title: 'Drive', sub: 'Press Up', icon: 'flash-outline' as const, color: '#10B981', bg: 'bg-emerald-500/15' },
        { num: '4', title: 'Lockout', sub: 'Peak Squeeze', icon: 'flame-outline' as const, color: '#F59E0B', bg: 'bg-amber-500/15' },
      ];

  const movementTypeLabel = isCardio
    ? 'Cardiovascular Endurance Pattern'
    : isIsometric
    ? 'Isometric Anti-Extension Hold'
    : isPush
    ? 'Push Pattern (Concentric Force Drive)'
    : isPull
    ? 'Pull Pattern (Concentric Force Retraction)'
    : `${exercise.type || 'Compound'} Movement`;

  return (
    <View className="gap-3.5">
      {/* 1. HOW IT LOOKS: MOVEMENT BLUEPRINT & SETUP */}
      <View className="rounded-2xl p-4 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark overflow-hidden">
        <View className="flex-row items-center gap-2 mb-3">
          <View className={`w-8 h-8 rounded-xl items-center justify-center border ${theme.borderClass} ${theme.bgClass} shrink-0`}>
            <Ionicons name="eye-outline" size={18} color={theme.color} />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
              Movement Blueprint & Form Look
            </Text>
            <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
              Visual biomechanics, posture & equipment configuration
            </Text>
          </View>
        </View>

        {/* Visual Movement Flow Diagram */}
        <View className="rounded-xl p-3 bg-input dark:bg-input-dark border border-input-border/70 dark:border-input-border-dark/70 mb-3 overflow-hidden">
          <Text className="text-[10px] font-bold text-accent dark:text-accent-dark uppercase tracking-wider mb-2.5">
            Kinematic Movement Cycle
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {kinematicCycle.map((phase, idx) => (
              <View
                key={idx}
                className="flex-1 min-w-[45%] flex-row items-center p-2.5 rounded-lg bg-surface/80 dark:bg-surface-dark/80 border border-input-border/50 gap-2"
              >
                <View className={`w-7 h-7 rounded-lg ${phase.bg} items-center justify-center shrink-0`}>
                  <Ionicons name={phase.icon} size={15} color={phase.color} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark" numberOfLines={1}>
                    {phase.num}. {phase.title}
                  </Text>
                  <Text className="text-[10px] text-text-muted dark:text-text-muted-dark leading-3.5" numberOfLines={1}>
                    {phase.sub}
                  </Text>
                </View>
              </View>
            ))}
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
      <View className="rounded-2xl p-4 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark overflow-hidden">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-8 h-8 rounded-xl items-center justify-center bg-accent/15 border border-accent/30 shrink-0">
            <Ionicons name="list-outline" size={18} color={colors.accent} />
          </View>
          <View className="flex-1 min-w-0">
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
              <View className="w-6 h-6 rounded-full bg-accent/20 border border-accent/40 items-center justify-center mr-3 mt-0.5 shrink-0">
                <Text className="text-xs font-black text-accent dark:text-accent-dark">
                  {idx + 1}
                </Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-xs font-medium text-text-primary dark:text-text-primary-dark leading-5">
                  {step}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Breathing Synchronization */}
        {exercise.breathingTechnique && (
          <View className="p-3 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/30 flex-row items-start gap-2.5">
            <Ionicons name="fitness-outline" size={18} color="#0EA5E9" style={{ marginTop: 2 }} />
            <View className="flex-1 min-w-0">
              <Text className="text-xs font-bold text-sky-600 dark:text-sky-400 mb-0.5">
                Breathing Cadence:
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-5">
                {exercise.breathingTechnique}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 3. PRO FORM TIPS & COMMON MISTAKES */}
      <View className="rounded-2xl p-4 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark overflow-hidden">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="w-8 h-8 rounded-xl items-center justify-center bg-emerald-500/15 border border-emerald-500/30 shrink-0">
            <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
          </View>
          <View className="flex-1 min-w-0">
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
                  <Text className="text-emerald-500 font-bold shrink-0">•</Text>
                  <View className="flex-1 min-w-0">
                    <Text className="text-xs text-text-primary dark:text-text-primary-dark leading-5">
                      {tip}
                    </Text>
                  </View>
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
                  <Text className="text-danger font-bold shrink-0">•</Text>
                  <View className="flex-1 min-w-0">
                    <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-5">
                      {mistake}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* 4. PROGRESSIONS & ALTERNATIVES */}
      {(exercise.beginnerModification || exercise.advancedVariation || exercise.equipmentFreeAlternative) && (
        <View className="rounded-2xl p-4 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark overflow-hidden">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-8 h-8 rounded-xl items-center justify-center bg-purple-500/15 border border-purple-500/30 shrink-0">
              <Ionicons name="swap-horizontal-outline" size={18} color="#A855F7" />
            </View>
            <View className="flex-1 min-w-0">
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
                <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-5">
                  {exercise.beginnerModification}
                </Text>
              </View>
            ) : null}

            {exercise.advancedVariation ? (
              <View className="p-2.5 rounded-xl bg-input dark:bg-input-dark border border-input-border/60">
                <Text className="text-[11px] font-bold text-purple-500 dark:text-purple-400 mb-0.5">
                  Advanced Progression:
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-5">
                  {exercise.advancedVariation}
                </Text>
              </View>
            ) : null}

            {exercise.equipmentFreeAlternative ? (
              <View className="p-2.5 rounded-xl bg-input dark:bg-input-dark border border-input-border/60">
                <Text className="text-[11px] font-bold text-sky-500 dark:text-sky-400 mb-0.5">
                  No Equipment Alternative:
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-5">
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
