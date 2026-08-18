import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LibraryExercise } from './mockData';

interface ExerciseDetailsModalProps {
  visible: boolean;
  exercise: LibraryExercise | null;
  mode?: 'add' | 'update';
  onClose: () => void;
  onAddExercise: (exercise: LibraryExercise) => void;
  onUpdateExercisePreset?: (exercise: LibraryExercise) => void;
}

export interface DifficultyPreset {
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  recommendedSets: number;
  recommendedReps: number;
  recommendedDuration?: number;
  recommendedRest: number;
  recommendedTempo?: string;
  cue: string;
  defaultSets: { weight?: number; reps?: number; bodyweight?: boolean }[];
}

export const getDifficultyPreset = (
  exercise: any,
  tier: 'beginner' | 'intermediate' | 'advanced'
): DifficultyPreset => {
  const existingPresets = exercise?.difficultyPresets || {};
  if (
    existingPresets[tier] &&
    Array.isArray(existingPresets[tier].defaultSets) &&
    existingPresets[tier].defaultSets.length > 0
  ) {
    return existingPresets[tier];
  }

  const baseSets = exercise?.defaultSets || [];
  const firstSetWeight = baseSets[0]?.weight ? Number(baseSets[0].weight) : 40;
  const isBW = Boolean(baseSets[0]?.bodyweight);

  if (tier === 'beginner') {
    const begWeight = Math.max(5, Math.round((firstSetWeight * 0.6) / 2.5) * 2.5);
    return {
      difficulty: 'Beginner',
      recommendedSets: 3,
      recommendedReps: 12,
      recommendedRest: 60,
      recommendedTempo: '3-1-1-0',
      cue: '🟢 Beginner Focus: Safe light weight, controlled form & full range of motion.',
      defaultSets: [
        { weight: isBW ? undefined : begWeight, reps: 12, bodyweight: isBW },
        { weight: isBW ? undefined : begWeight, reps: 12, bodyweight: isBW },
        { weight: isBW ? undefined : begWeight, reps: 12, bodyweight: isBW },
      ],
    };
  }

  if (tier === 'advanced') {
    const advWeight = Math.round((firstSetWeight * 1.35) / 2.5) * 2.5;
    return {
      difficulty: 'Advanced',
      recommendedSets: 4,
      recommendedReps: 6,
      recommendedRest: 120,
      recommendedTempo: '2-0-1-0',
      cue: '🔴 Advanced Focus: Heavy progressive overload for maximum power & density.',
      defaultSets: [
        { weight: isBW ? undefined : advWeight, reps: 6, bodyweight: isBW },
        { weight: isBW ? undefined : Math.round((advWeight * 1.05) / 2.5) * 2.5, reps: 6, bodyweight: isBW },
        { weight: isBW ? undefined : Math.round((advWeight * 1.10) / 2.5) * 2.5, reps: 5, bodyweight: isBW },
        { weight: isBW ? undefined : Math.round((advWeight * 1.15) / 2.5) * 2.5, reps: 4, bodyweight: isBW },
      ],
    };
  }

  const intWeight = firstSetWeight;
  return {
    difficulty: 'Intermediate',
    recommendedSets: 3,
    recommendedReps: 10,
    recommendedRest: 90,
    recommendedTempo: '2-0-1-0',
    cue: '🟡 Intermediate Focus: Standard working load for steady hypertrophy and stamina.',
    defaultSets: [
      { weight: isBW ? undefined : intWeight, reps: 10, bodyweight: isBW },
      { weight: isBW ? undefined : Math.round((intWeight * 1.08) / 2.5) * 2.5, reps: 10, bodyweight: isBW },
      { weight: isBW ? undefined : Math.round((intWeight * 1.15) / 2.5) * 2.5, reps: 8, bodyweight: isBW },
    ],
  };
};

export const ExerciseDetailsModal: React.FC<ExerciseDetailsModalProps> = ({
  visible,
  exercise,
  mode = 'add',
  onClose,
  onAddExercise,
  onUpdateExercisePreset,
}) => {
  const initialTier = React.useMemo(() => {
    const d = (exercise?.difficulty || '').toLowerCase();
    if (d.includes('beginner')) return 'beginner';
    if (d.includes('advanced')) return 'advanced';
    return 'intermediate';
  }, [exercise]);

  const [activeTier, setActiveTier] = React.useState<'beginner' | 'intermediate' | 'advanced'>(initialTier);

  React.useEffect(() => {
    setActiveTier(initialTier);
  }, [initialTier]);

  if (!exercise) return null;

  const currentPreset = getDifficultyPreset(exercise, activeTier);

  const handleApplyPreset = () => {
    if (!exercise) return;
    const preset = getDifficultyPreset(exercise, activeTier);
    const customized: LibraryExercise = {
      ...exercise,
      difficulty: preset.difficulty,
      recommendedSets: preset.recommendedSets,
      recommendedReps: preset.recommendedReps,
      recommendedRest: preset.recommendedRest,
      recommendedTempo: preset.recommendedTempo,
      defaultSets: preset.defaultSets,
    };

    if (mode === 'update' && onUpdateExercisePreset) {
      onUpdateExercisePreset(customized);
    } else {
      onAddExercise(customized);
    }
    onClose();
  };

  const secondaryMusclesStr = Array.isArray(exercise.secondaryMuscles)
    ? exercise.secondaryMuscles.join(', ')
    : exercise.secondaryMuscles;

  const equipmentStr = Array.isArray(exercise.equipment)
    ? exercise.equipment.join(', ')
    : exercise.equipment;

  const equipmentAltStr = Array.isArray(exercise.equipmentAlternatives)
    ? exercise.equipmentAlternatives.join(', ')
    : exercise.equipmentAlternatives;

  const instructionsList: string[] = Array.isArray(exercise.instructions)
    ? exercise.instructions
    : [];

  const formTipsList: string[] = Array.isArray(exercise.formTips)
    ? exercise.formTips
    : [];

  const mistakesList: string[] = Array.isArray(exercise.commonMistakes)
    ? exercise.commonMistakes
    : [];

  const tagsList: string[] = Array.isArray(exercise.tags)
    ? exercise.tags
    : [];

  const similarList: string[] = Array.isArray(exercise.similarExercises)
    ? exercise.similarExercises
    : [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-background dark:bg-background-dark rounded-t-3xl h-[88%] border-t border-input-border dark:border-input-border-dark overflow-hidden">
          {/* Header */}
          <View className="px-5 py-4 flex-row items-center justify-between border-b border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark">
            <View className="flex-1 pr-3">
              <Text className="text-xl font-extrabold text-text-primary dark:text-text-primary-dark">
                {exercise.name}
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                {exercise.category} • {exercise.difficulty || 'Intermediate'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark"
            >
              <Text className="text-text-primary dark:text-text-primary-dark text-sm font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Media Header */}
            {exercise.imageUrl ? (
              <Image
                source={{ uri: exercise.imageUrl }}
                className="w-full h-44 rounded-2xl mb-4 bg-input dark:bg-input-dark"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-28 rounded-2xl mb-4 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center">
                <Text className="text-3xl">🏋️‍♂️</Text>
                <Text className="text-xs text-text-muted mt-1">{exercise.name}</Text>
              </View>
            )}

            {/* Badges Row */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              <View className="rounded-lg bg-accent/15 px-3 py-1 border border-accent/40">
                <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                  Target: {exercise.primaryMuscle || exercise.muscleGroup}
                </Text>
              </View>
              <View className="rounded-lg bg-input dark:bg-input-dark px-3 py-1 border border-input-border dark:border-input-border-dark">
                <Text className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">
                  {exercise.type}
                </Text>
              </View>
              <View className="rounded-lg bg-input dark:bg-input-dark px-3 py-1 border border-input-border dark:border-input-border-dark">
                <Text className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">
                  {exercise.bodyPart || 'Upper Body'}
                </Text>
              </View>
            </View>

            {/* Description */}
            {exercise.description ? (
              <View className="mb-4 bg-surface dark:bg-surface-dark p-3.5 rounded-xl border border-input-border dark:border-input-border-dark">
                <Text className="text-xs leading-5 text-text-muted dark:text-text-muted-dark">
                  {exercise.description}
                </Text>
              </View>
            ) : null}

            {/* Workout Prescription Tiers & Recommendations */}
            <View className="mb-4 bg-surface dark:bg-surface-dark p-4 rounded-2xl border border-input-border dark:border-input-border-dark">
              <Text className="text-xs font-bold text-accent dark:text-accent-dark uppercase tracking-wider mb-2.5">
                Target Intensity Preset
              </Text>

              {/* Segmented Level Selector */}
              <View className="flex-row rounded-xl bg-input dark:bg-input-dark p-1 mb-3.5 border border-input-border/60">
                {(['beginner', 'intermediate', 'advanced'] as const).map((tier) => {
                  const active = activeTier === tier;
                  const label = tier.charAt(0).toUpperCase() + tier.slice(1);
                  const activeColor =
                    tier === 'beginner'
                      ? 'bg-emerald-500 text-white'
                      : tier === 'advanced'
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-500 text-white';

                  return (
                    <TouchableOpacity
                      key={tier}
                      activeOpacity={0.8}
                      onPress={() => setActiveTier(tier)}
                      className={`flex-1 py-1.5 rounded-lg items-center justify-center ${
                        active ? activeColor : ''
                      }`}
                    >
                      <Text
                        className={`text-xs font-extrabold ${
                          active ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'
                        }`}
                      >
                        {tier === 'beginner' ? '🟢 ' : tier === 'intermediate' ? '🟡 ' : '🔴 '}
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Dynamic Preset Metrics */}
              <View className="flex-row justify-between mb-2">
                <View className="items-center flex-1">
                  <Text className="text-xs text-text-muted">Target Sets</Text>
                  <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark mt-0.5">
                    {currentPreset.recommendedSets || 3}
                  </Text>
                </View>
                <View className="items-center flex-1 border-x border-input-border dark:border-input-border-dark">
                  <Text className="text-xs text-text-muted">Reps / Duration</Text>
                  <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark mt-0.5">
                    {currentPreset.recommendedDuration
                      ? `${currentPreset.recommendedDuration}s`
                      : currentPreset.recommendedReps
                      ? `${currentPreset.recommendedReps} reps`
                      : '10 reps'}
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-xs text-text-muted">Rest</Text>
                  <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark mt-0.5">
                    {currentPreset.recommendedRest || 60}s
                  </Text>
                </View>
              </View>

              {currentPreset.cue ? (
                <Text className="text-[11px] font-medium text-accent dark:text-accent-dark text-center mt-2 p-2 rounded-xl bg-accent/10 border border-accent/20">
                  💡 {currentPreset.cue}
                </Text>
              ) : null}

              {currentPreset.recommendedTempo ? (
                <Text className="text-[10px] text-text-muted text-center mt-1.5 italic">
                  Tempo: {currentPreset.recommendedTempo} (Eccentric-Pause-Concentric-Pause)
                </Text>
              ) : null}
            </View>

            {/* Muscle & Equipment Details */}
            <View className="mb-4 bg-surface dark:bg-surface-dark p-4 rounded-2xl border border-input-border dark:border-input-border-dark">
              <Text className="text-xs font-bold text-accent dark:text-accent-dark uppercase tracking-wider mb-2">
                Muscles & Equipment
              </Text>
              <Text className="text-xs text-text-primary dark:text-text-primary-dark mb-1">
                <Text className="font-bold">Primary Muscle: </Text>
                {exercise.primaryMuscle || exercise.muscleGroup}
              </Text>
              {secondaryMusclesStr ? (
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-2">
                  <Text className="font-semibold">Secondary Muscles: </Text>
                  {secondaryMusclesStr}
                </Text>
              ) : null}

              <Text className="text-xs text-text-primary dark:text-text-primary-dark mb-1 mt-1">
                <Text className="font-bold">Required Equipment: </Text>
                {equipmentStr || 'No Equipment'}
              </Text>
              {equipmentAltStr ? (
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  <Text className="font-semibold">Alternatives: </Text>
                  {equipmentAltStr}
                </Text>
              ) : null}
            </View>

            {/* Instructions & Form */}
            {(exercise.startingPosition || instructionsList.length > 0) && (
              <View className="mb-4 bg-surface dark:bg-surface-dark p-4 rounded-2xl border border-input-border dark:border-input-border-dark">
                <Text className="text-xs font-bold text-accent dark:text-accent-dark uppercase tracking-wider mb-2.5">
                  Exercise Instructions
                </Text>

                {exercise.startingPosition ? (
                  <View className="mb-3 p-2.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark">
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
                      Starting Position:
                    </Text>
                    <Text className="text-xs text-text-muted leading-4">
                      {exercise.startingPosition}
                    </Text>
                  </View>
                ) : null}

                {instructionsList.map((step, idx) => (
                  <View key={idx} className="flex-row mb-2">
                    <Text className="text-xs font-bold text-accent dark:text-accent-dark mr-2">
                      {idx + 1}.
                    </Text>
                    <Text className="flex-1 text-xs text-text-primary dark:text-text-primary-dark leading-4">
                      {step}
                    </Text>
                  </View>
                ))}

                {exercise.breathingTechnique ? (
                  <View className="mt-2.5 pt-2.5 border-t border-input-border dark:border-input-border-dark">
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-0.5">
                      🫁 Breathing Technique:
                    </Text>
                    <Text className="text-xs text-text-muted leading-4">
                      {exercise.breathingTechnique}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Form Tips & Common Mistakes */}
            {(formTipsList.length > 0 || mistakesList.length > 0) && (
              <View className="mb-4 bg-surface dark:bg-surface-dark p-4 rounded-2xl border border-input-border dark:border-input-border-dark">
                <Text className="text-xs font-bold text-accent dark:text-accent-dark uppercase tracking-wider mb-2">
                  Form & Common Mistakes
                </Text>

                {formTipsList.length > 0 ? (
                  <View className="mb-2.5">
                    <Text className="text-xs font-bold text-emerald-500 mb-1">💡 Proper Form Tips:</Text>
                    {formTipsList.map((tip, idx) => (
                      <Text key={idx} className="text-xs text-text-muted mb-1 leading-4">
                        • {tip}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {mistakesList.length > 0 ? (
                  <View>
                    <Text className="text-xs font-bold text-red-400 mb-1">⚠️ Common Mistakes:</Text>
                    {mistakesList.map((mistake, idx) => (
                      <Text key={idx} className="text-xs text-text-muted mb-1 leading-4">
                        • {mistake}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            )}

            {/* Safety & Variations */}
            {(exercise.safetyInstructions || exercise.beginnerModification || exercise.advancedVariation) && (
              <View className="mb-4 bg-surface dark:bg-surface-dark p-4 rounded-2xl border border-input-border dark:border-input-border-dark">
                <Text className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">
                  Safety & Variations
                </Text>

                {exercise.safetyInstructions ? (
                  <Text className="text-xs text-text-muted mb-2 leading-4">
                    <Text className="font-bold text-text-primary dark:text-text-primary-dark">Safety: </Text>
                    {exercise.safetyInstructions}
                  </Text>
                ) : null}

                {exercise.beginnerModification ? (
                  <Text className="text-xs text-text-muted mb-1.5 leading-4">
                    <Text className="font-bold text-emerald-400">Easier Modification: </Text>
                    {exercise.beginnerModification}
                  </Text>
                ) : null}

                {exercise.advancedVariation ? (
                  <Text className="text-xs text-text-muted leading-4">
                    <Text className="font-bold text-purple-400">Advanced Variation: </Text>
                    {exercise.advancedVariation}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Alternatives Tree */}
            {(exercise.easierAlternative || exercise.harderAlternative || exercise.equipmentFreeAlternative || similarList.length > 0) && (
              <View className="mb-4 bg-surface dark:bg-surface-dark p-4 rounded-2xl border border-input-border dark:border-input-border-dark">
                <Text className="text-xs font-bold text-accent dark:text-accent-dark uppercase tracking-wider mb-2">
                  Exercise Alternatives
                </Text>

                {exercise.easierAlternative ? (
                  <Text className="text-xs text-text-muted mb-1">
                    <Text className="font-semibold">├── Easier: </Text>
                    {exercise.easierAlternative}
                  </Text>
                ) : null}

                {exercise.harderAlternative ? (
                  <Text className="text-xs text-text-muted mb-1">
                    <Text className="font-semibold">├── Harder: </Text>
                    {exercise.harderAlternative}
                  </Text>
                ) : null}

                {exercise.equipmentFreeAlternative ? (
                  <Text className="text-xs text-text-muted mb-1">
                    <Text className="font-semibold">└── Equipment-free: </Text>
                    {exercise.equipmentFreeAlternative}
                  </Text>
                ) : null}

                {similarList.length > 0 ? (
                  <Text className="text-xs text-text-muted mt-1.5">
                    <Text className="font-semibold">Similar Exercises: </Text>
                    {similarList.join(', ')}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Tags */}
            {tagsList.length > 0 ? (
              <View className="flex-row flex-wrap gap-1.5 mb-6">
                {tagsList.map((tag, idx) => (
                  <View key={idx} className="bg-input dark:bg-input-dark px-2.5 py-1 rounded-md border border-input-border dark:border-input-border-dark">
                    <Text className="text-[10px] text-text-muted font-medium">#{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>

          {/* Bottom Action */}
          <View className="p-4 border-t border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark">
            <TouchableOpacity
              onPress={handleApplyPreset}
              className="bg-accent dark:bg-accent-dark py-3.5 rounded-xl items-center"
            >
              <Text className="text-background dark:text-background-dark font-extrabold text-sm">
                {mode === 'update'
                  ? `✓ Apply ${activeTier.toUpperCase()} Preset to Workout`
                  : `+ Add (${activeTier.toUpperCase()}) to Today's Workout`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
