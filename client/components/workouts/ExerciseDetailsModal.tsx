import React, { useState, useMemo } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { LibraryExercise } from './workoutTypes';
import ModalCloseButton from '../ui/ModalCloseButton';
import ExerciseVisual from './ExerciseVisual';
import BodyAnatomyMap from './BodyAnatomyMap';
import ExerciseMovementGuide from './ExerciseMovementGuide';
import ExerciseVideoModal from './ExerciseVideoModal';
import { DifficultyPreset, getDifficultyPreset } from './workoutPresets';

export { DifficultyPreset, getDifficultyPreset };

interface ExerciseDetailsModalProps {
  visible: boolean;
  exercise: LibraryExercise | null;
  mode?: 'add' | 'update';
  onClose: () => void;
  onAddExercise: (exercise: LibraryExercise) => void;
  onUpdateExercisePreset?: (exercise: LibraryExercise) => void;
}

type DetailsTab = 'all' | 'body' | 'looks' | 'guide' | 'presets';

export const ExerciseDetailsModal: React.FC<ExerciseDetailsModalProps> = ({
  visible,
  exercise,
  mode = 'add',
  onClose,
  onAddExercise,
  onUpdateExercisePreset,
}) => {
  const { colors } = useThemeColors();
  const [activeTab, setActiveTab] = useState<DetailsTab>('all');

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
    setActiveTab('all');
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

  const secondaryMusclesStr = Array.isArray(exercise.secondaryMuscles)
    ? exercise.secondaryMuscles.join(', ')
    : exercise.secondaryMuscles;

  const equipmentStr = Array.isArray(exercise.equipment)
    ? exercise.equipment.join(', ')
    : exercise.equipment;

  const equipmentAltStr = Array.isArray(exercise.equipmentAlternatives)
    ? exercise.equipmentAlternatives.join(', ')
    : exercise.equipmentAlternatives;

  const tagsList: string[] = Array.isArray(exercise.tags) ? exercise.tags : [];
  const similarList: string[] = Array.isArray(exercise.similarExercises)
    ? exercise.similarExercises
    : [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-background dark:bg-background-dark rounded-t-3xl h-[92%] border-t border-input-border dark:border-input-border-dark overflow-hidden">
          {/* Header */}
          <View className="px-5 py-4 border-b border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1 pr-3">
                <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark">
                  {exercise.name}
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                  {exercise.category} • {exercise.bodyPart || 'Upper Body'} • {exercise.difficulty || 'Intermediate'}
                </Text>
              </View>
              <ModalCloseButton onClose={onClose} />
            </View>

            {/* Navigation Tabs for Targeted Viewing */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row -mb-1 mt-1"
              contentContainerStyle={{ paddingRight: 10 }}
            >
              {[
                { key: 'all', label: 'All Details', icon: 'grid-outline' as const },
                { key: 'body', label: 'Body Target', icon: 'body-outline' as const },
                { key: 'looks', label: 'How It Looks', icon: 'eye-outline' as const },
                { key: 'guide', label: 'How To Do It', icon: 'list-outline' as const },
                { key: 'presets', label: 'Prescriptions', icon: 'speedometer-outline' as const },
              ].map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    activeOpacity={0.8}
                    onPress={() => setActiveTab(tab.key as DetailsTab)}
                    className={`mr-2 px-3 py-1.5 rounded-xl border flex-row items-center gap-1.5 ${
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
                          : 'text-text-muted dark:text-text-muted-dark font-medium'
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
            {/* Target Muscle & Movement Showcase Banner */}
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
              gifUrl={exercise.gifUrl}
              tempo={exercise.recommendedTempo}
              size="banner"
              onOpenVideo={() => setIsVideoModalVisible(true)}
            />

            {/* Description */}
            {exercise.description ? (
              <View className="mb-4 bg-surface dark:bg-surface-dark p-3.5 rounded-xl border border-input-border dark:border-input-border-dark">
                <Text className="text-xs leading-5 text-text-muted dark:text-text-muted-dark">
                  {exercise.description}
                </Text>
              </View>
            ) : null}

            {/* SECTION 1: WHICH PART OF THE BODY IT HITS (ANATOMY MAP) */}
            {(activeTab === 'all' || activeTab === 'body') && (
              <View className="mb-4">
                <BodyAnatomyMap
                  primaryMuscle={exercise.primaryMuscle || exercise.muscleGroup || ''}
                  secondaryMuscles={exercise.secondaryMuscles || []}
                  category={exercise.category}
                  size="md"
                  showToggle={true}
                />
              </View>
            )}

            {/* SECTION 2 & 3: HOW IT LOOKS & HOW TO DO IT */}
            {(activeTab === 'all' || activeTab === 'looks' || activeTab === 'guide') && (
              <View className="mb-4">
                <ExerciseMovementGuide exercise={exercise} />
              </View>
            )}

            {/* SECTION 4: WORKOUT PRESCRIPTION TIERS & SETS */}
            {(activeTab === 'all' || activeTab === 'presets') && (
              <View className="mb-4 bg-surface dark:bg-surface-dark p-4 rounded-2xl border border-input-border dark:border-input-border-dark">
                <Text className="text-xs font-bold text-accent dark:text-accent-dark uppercase tracking-wider mb-2.5">
                  Target Intensity & Rep Scheme Presets
                </Text>

                {/* Segmented Level Selector */}
                <View className="flex-row rounded-xl bg-input dark:bg-input-dark p-1 mb-3.5 border border-input-border/60 dark:border-input-border-dark/60">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((tier) => {
                    const active = activeTier === tier;
                    const label = tier.charAt(0).toUpperCase() + tier.slice(1);
                    const activeColor =
                      tier === 'beginner'
                        ? 'bg-accent text-white'
                        : tier === 'advanced'
                        ? 'bg-danger text-white'
                        : 'bg-warning text-white';

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
                          {label}
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
                    <Text className="text-xs text-text-muted dark:text-text-muted-dark">Reps / Duration</Text>
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
                  <Text className="text-[11px] font-medium text-accent dark:text-accent-dark text-center mt-2 p-2 rounded-xl bg-accent/10 border border-accent/20">
                    {currentPreset.cue}
                  </Text>
                ) : null}

                {currentPreset.recommendedTempo ? (
                  <Text className="text-[10px] text-text-muted dark:text-text-muted-dark text-center mt-1.5 italic">
                    Tempo: {currentPreset.recommendedTempo} (Eccentric-Pause-Concentric-Pause)
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
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-1">
                    <Text className="font-semibold">├── Easier: </Text>
                    {exercise.easierAlternative}
                  </Text>
                ) : null}

                {exercise.harderAlternative ? (
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-1">
                    <Text className="font-semibold">├── Harder: </Text>
                    {exercise.harderAlternative}
                  </Text>
                ) : null}

                {exercise.equipmentFreeAlternative ? (
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-1">
                    <Text className="font-semibold">└── Equipment-free: </Text>
                    {exercise.equipmentFreeAlternative}
                  </Text>
                ) : null}

                {similarList.length > 0 ? (
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-1.5">
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
                  <View key={idx} className="bg-input dark:bg-input-dark px-2.5 py-1 rounded-lg border border-input-border dark:border-input-border-dark">
                    <Text className="text-[10px] text-text-muted dark:text-text-muted-dark font-medium">#{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>

          {/* Bottom Action */}
          <View className="p-4 border-t border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark">
            <TouchableOpacity
              onPress={handleApplyPreset}
              className="bg-accent dark:bg-accent-dark py-3.5 rounded-2xl items-center"
            >
              <Text className="text-white font-bold text-sm">
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
