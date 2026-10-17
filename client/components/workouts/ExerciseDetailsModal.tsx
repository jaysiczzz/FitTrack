import React, { useState, useMemo } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/constants/colors';
import { LibraryExercise } from './workoutTypes';
import ModalCloseButton from '../ui/ModalCloseButton';
import ExerciseVisual, { getMuscleTheme } from './ExerciseVisual';
import BodyAnatomyMap from './BodyAnatomyMap';
import ExerciseMovementGuide from './ExerciseMovementGuide';
import ExerciseVideoModal from './ExerciseVideoModal';
import { DifficultyPreset, getDifficultyPreset } from './workoutPresets';
import { getDifficultyStyle } from '@/constants/difficulty';

export { DifficultyPreset, getDifficultyPreset };

interface ExerciseDetailsModalProps {
  visible: boolean;
  exercise: LibraryExercise | null;
  mode?: 'add' | 'update';
  onClose: () => void;
  onAddExercise: (exercise: LibraryExercise) => void;
  onUpdateExercisePreset?: (exercise: LibraryExercise) => void;
}

type DetailsTab = 'guide' | 'body' | 'presets' | 'all';

export const ExerciseDetailsModal: React.FC<ExerciseDetailsModalProps> = ({
  visible,
  exercise,
  mode = 'add',
  onClose,
  onAddExercise,
  onUpdateExercisePreset,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColors();
  const [activeTab, setActiveTab] = useState<DetailsTab>('guide');

  const initialTier = useMemo(() => {
    const d = (exercise?.difficulty || '').toLowerCase();
    if (d.includes('beginner')) return 'beginner';
    if (d.includes('advanced')) return 'advanced';
    return 'intermediate';
  }, [exercise]);

  const [activeTier, setActiveTier] = useState<'beginner' | 'intermediate' | 'advanced'>(initialTier);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);

  React.useEffect(() => {
    setActiveTier(initialTier);
    setActiveTab('guide');
  }, [initialTier, exercise?.id]);

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

  const secondaryMusclesList = Array.isArray(exercise.secondaryMuscles)
    ? exercise.secondaryMuscles
    : exercise.secondaryMuscles
    ? [exercise.secondaryMuscles]
    : [];

  const similarList: string[] = Array.isArray(exercise.similarExercises)
    ? exercise.similarExercises
    : [];

  // Consolidated scaling options without duplication
  const easierOption = exercise.easierAlternative || exercise.beginnerModification;
  const harderOption = exercise.harderAlternative || exercise.advancedVariation;
  const equipmentFreeOption = exercise.equipmentFreeAlternative;
  const theme = getMuscleTheme(exercise?.primaryMuscle || exercise?.muscleGroup, exercise?.category, exercise?.name);
  const diffStyle = getDifficultyStyle(exercise?.difficulty);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-background dark:bg-background-dark rounded-t-3xl h-[92%] border-t border-input-border dark:border-input-border-dark overflow-hidden">
          {/* Header */}
          <View className="px-5 py-4 border-b border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 pr-3">
                <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark">
                  {exercise.name}
                </Text>

                <View className="flex-row items-center gap-2 flex-wrap mt-1.5">
                  {/* Level / Difficulty Badge */}
                  {exercise.difficulty ? (
                    <View
                      className={`rounded-full px-2.5 py-0.5 border shrink-0 ${diffStyle.badgeContainer}`}
                    >
                      <Text
                        className={`text-[10px] font-extrabold uppercase tracking-wider ${diffStyle.badgeText}`}
                        style={{ color: isDark ? diffStyle.darkHexColor : diffStyle.hexColor }}
                      >
                        {exercise.difficulty}
                      </Text>
                    </View>
                  ) : null}

                  {/* Category Badge */}
                  <View className="px-2.5 py-0.5 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark shrink-0">
                    <Text className={`text-[10px] font-extrabold uppercase tracking-wider ${theme.textClass}`}>
                      {theme.label}
                    </Text>
                  </View>

                  {/* Subordinate Details: Body Part & Equipment */}
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark font-medium">
                    {exercise.bodyPart || 'Upper Body'}
                    {exercise.equipment
                      ? ` • ${Array.isArray(exercise.equipment) ? exercise.equipment.join(', ') : exercise.equipment}`
                      : ''}
                  </Text>
                </View>
              </View>
              <ModalCloseButton onClose={onClose} />
            </View>

            {/* Streamlined Navigation Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row -mb-1 mt-1"
              contentContainerStyle={{ paddingRight: 10, gap: 8 }}
            >
              {[
                { key: 'guide', label: 'Form Guide', icon: 'list-outline' as const },
                { key: 'body', label: 'Muscles & Anatomy', icon: 'body-outline' as const },
                { key: 'presets', label: 'Presets & Scaling', icon: 'speedometer-outline' as const },
                { key: 'all', label: 'All Details', icon: 'grid-outline' as const },
              ].map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    activeOpacity={0.8}
                    onPress={() => setActiveTab(tab.key as DetailsTab)}
                    className={`px-3.5 py-1.5 min-h-[36px] rounded-xl border flex-row items-center gap-1.5 ${
                      active
                        ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent dark:border-accent-dark'
                        : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                    }`}
                  >
                    <Ionicons
                      name={tab.icon}
                      size={13}
                      color={active ? colors.accent : colors.textMuted}
                    />
                    <Text
                      className={`text-xs ${
                        active
                          ? 'text-accent dark:text-accent-dark font-extrabold'
                          : 'text-text-muted dark:text-text-muted-dark font-semibold'
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Movement Demonstration Banner (Always visible across all tabs for instant visual reference) */}
            <ExerciseVisual
              name={exercise.name}
              muscle={exercise.primaryMuscle || exercise.muscleGroup}
              category={exercise.category}
              equipment={exercise.equipment}
              type={exercise.type}
              difficulty={exercise.difficulty}
              secondaryMuscles={exercise.secondaryMuscles}
              imageUrl={exercise.imageUrl}
              thumbnailUrl={exercise.thumbnailUrl}
              tempo={exercise.recommendedTempo}
              size="banner"
              onOpenVideo={() => setIsVideoModalVisible(true)}
            />

            {/* TAB 1: FORM & MOVEMENT EXECUTION */}
            {(activeTab === 'guide' || activeTab === 'all') && (
              <View className="mb-4">
                {/* Description */}
                {exercise.description ? (
                  <View className="mb-3.5 bg-surface dark:bg-surface-dark p-3.5 rounded-2xl border border-input-border dark:border-input-border-dark">
                    <Text className="text-xs leading-5 text-text-muted dark:text-text-muted-dark">
                      {exercise.description}
                    </Text>
                  </View>
                ) : null}

                {/* Step-by-step Movement Guide & Form Cues */}
                <ExerciseMovementGuide exercise={exercise} />
              </View>
            )}

            {/* TAB 2: TARGET MUSCLES & ANATOMY MAP */}
            {(activeTab === 'body' || activeTab === 'all') && (
              <View className="mb-4">
                <View className="mb-3">
                  <BodyAnatomyMap
                    primaryMuscle={exercise.primaryMuscle || exercise.muscleGroup || ''}
                    secondaryMuscles={exercise.secondaryMuscles || []}
                    category={exercise.category}
                    size="md"
                    showToggle={true}
                  />
                </View>

                {/* Muscle Target Summary Card */}
                <View className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark">
                  <Text className="text-xs font-bold text-accent dark:text-accent-dark uppercase tracking-wider mb-2.5">
                    Muscular Engagement
                  </Text>
                  <View className="gap-2">
                    <View className="flex-row items-center justify-between p-2.5 rounded-xl bg-input dark:bg-input-dark">
                      <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
                        Primary Target:
                      </Text>
                      <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                        {exercise.primaryMuscle || exercise.muscleGroup || 'Full Body'}
                      </Text>
                    </View>
                    {secondaryMusclesList.length > 0 && (
                      <View className="flex-row items-center justify-between p-2.5 rounded-xl bg-input dark:bg-input-dark">
                        <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
                          Assisting Muscles:
                        </Text>
                        <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                          {secondaryMusclesList.join(', ')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* TAB 3: WORKOUT PRESCRIPTIONS & SCALING ALTERNATIVES */}
            {(activeTab === 'presets' || activeTab === 'all') && (
              <View className="mb-4">
                <View className="mb-3.5 bg-surface dark:bg-surface-dark p-4 rounded-2xl border border-input-border dark:border-input-border-dark">
                  <Text className="text-xs font-bold text-accent dark:text-accent-dark uppercase tracking-wider mb-2.5">
                    Rep Scheme & Prescribed Intensity
                  </Text>

                  {/* Segmented Level Selector */}
                  <View className="flex-row rounded-xl bg-input dark:bg-input-dark p-1 mb-3.5 border border-input-border/60 dark:border-input-border-dark/60 gap-1">
                    {(['beginner', 'intermediate', 'advanced'] as const).map((tier) => {
                      const active = activeTier === tier;
                      const tierStyle = getDifficultyStyle(tier);

                      return (
                        <TouchableOpacity
                          key={tier}
                          activeOpacity={0.8}
                          onPress={() => setActiveTier(tier)}
                          className={`flex-1 py-1.5 min-h-[36px] rounded-lg items-center justify-center flex-row gap-1.5 ${
                            active ? tierStyle.activeButton : ''
                          }`}
                        >
                          <Ionicons
                            name={tierStyle.icon}
                            size={12}
                            color={active ? '#FFFFFF' : colors.textMuted}
                          />
                          <Text
                            className={`text-xs font-extrabold ${
                              active ? tierStyle.activeText : 'text-text-muted dark:text-text-muted-dark'
                            }`}
                          >
                            {tierStyle.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Dynamic Preset Metrics */}
                  <View className="flex-row justify-between mb-2">
                    <View className="items-center flex-1">
                      <Text className="text-xs text-text-muted dark:text-text-muted-dark">Target Sets</Text>
                      <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark mt-0.5">
                        {currentPreset.recommendedSets || 3}
                      </Text>
                    </View>
                    <View className="items-center flex-1 border-x border-input-border dark:border-input-border-dark">
                      <Text className="text-xs text-text-muted dark:text-text-muted-dark">Reps / Work</Text>
                      <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark mt-0.5">
                        {currentPreset.recommendedDuration
                          ? `${currentPreset.recommendedDuration}s`
                          : currentPreset.recommendedReps
                          ? `${currentPreset.recommendedReps} reps`
                          : '10 reps'}
                      </Text>
                    </View>
                    <View className="items-center flex-1">
                      <Text className="text-xs text-text-muted dark:text-text-muted-dark">Rest</Text>
                      <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark mt-0.5">
                        {currentPreset.recommendedRest || 60}s
                      </Text>
                    </View>
                  </View>

                  {currentPreset.cue ? (
                    <Text className="text-[11px] font-semibold text-accent dark:text-accent-dark text-center mt-2.5 p-2 rounded-xl bg-accent/10 border border-accent/20">
                      {currentPreset.cue}
                    </Text>
                  ) : null}
                </View>

                {/* Consolidated Scaling & Exercise Alternatives */}
                {(easierOption || harderOption || equipmentFreeOption || similarList.length > 0) && (
                  <View className="bg-surface dark:bg-surface-dark p-4 rounded-2xl border border-input-border dark:border-input-border-dark mb-4">
                    <Text className="text-xs font-bold text-accent dark:text-accent-dark uppercase tracking-wider mb-2.5">
                      Scaling & Alternatives
                    </Text>

                    <View className="gap-2">
                      {easierOption ? (
                        <View className="p-2.5 rounded-xl bg-input dark:bg-input-dark">
                          <Text
                            className="text-[11px] font-bold text-accent dark:text-accent-dark mb-0.5"
                            style={{ color: isDark ? '#10B981' : '#047857' }}
                          >
                            Easier / Beginner Modification:
                          </Text>
                          <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-5">
                            {easierOption}
                          </Text>
                        </View>
                      ) : null}

                      {harderOption ? (
                        <View className="p-2.5 rounded-xl bg-input dark:bg-input-dark">
                          <Text
                            className="text-[11px] font-bold text-danger dark:text-danger-dark mb-0.5"
                            style={{ color: isDark ? '#F87171' : '#DC2626' }}
                          >
                            Harder / Advanced Progression:
                          </Text>
                          <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-5">
                            {harderOption}
                          </Text>
                        </View>
                      ) : null}

                      {equipmentFreeOption ? (
                        <View className="p-2.5 rounded-xl bg-input dark:bg-input-dark">
                          <Text
                            className="text-[11px] font-bold text-info dark:text-info-dark mb-0.5"
                            style={{ color: isDark ? '#38BDF8' : '#0369A1' }}
                          >
                            Equipment-Free Alternative:
                          </Text>
                          <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-5">
                            {equipmentFreeOption}
                          </Text>
                        </View>
                      ) : null}

                      {similarList.length > 0 ? (
                        <View className="p-2.5 rounded-xl bg-input dark:bg-input-dark">
                          <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark mb-0.5">
                            Similar Movements:
                          </Text>
                          <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-5">
                            {similarList.join(', ')}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Button */}
          <View
            className="p-4 pb-8 border-t border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark"
            style={{ paddingBottom: Math.max(32, insets.bottom + 12) }}
          >
            <TouchableOpacity
              onPress={handleApplyPreset}
              activeOpacity={0.8}
              className="bg-accent dark:bg-accent-dark py-3.5 min-h-[48px] rounded-2xl items-center justify-center shadow-sm active:opacity-85"
            >
              <Text className="text-accent-contrast dark:text-accent-contrast-dark font-black text-sm">
                {mode === 'update'
                  ? `Apply ${activeTier.toUpperCase()} Preset to Workout`
                  : `Add (${activeTier.toUpperCase()}) to Today's Workout`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Video & Form Coaching Modal */}
      <ExerciseVideoModal
        visible={isVideoModalVisible}
        exercise={exercise}
        onClose={() => setIsVideoModalVisible(false)}
      />
    </Modal>
  );
};
export default ExerciseDetailsModal;
