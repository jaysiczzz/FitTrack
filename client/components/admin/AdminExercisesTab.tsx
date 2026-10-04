import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { triggerHapticFeedback } from '@/utils/haptics';
import SurfaceCard from '@/components/ui/SurfaceCard';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import FilterChip from '@/components/ui/FilterChip';
import {
  createLibraryExercise,
  deleteLibraryExercise,
  ApiLibraryExercise,
} from '@/api/workout';

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

interface AdminExercisesTabProps {
  exercises: ApiLibraryExercise[];
  loading: boolean;
  refreshing: boolean;
  selectedMuscle: string;
  onSelectMuscle: (m: string) => void;
  onReloadExercises: () => void;
}

export default function AdminExercisesTab({
  exercises,
  loading,
  refreshing,
  selectedMuscle,
  onSelectMuscle,
  onReloadExercises,
}: AdminExercisesTabProps) {
  const { colors } = useThemeColors();
  const { showSuccess, showError, showWarning } = useToast();

  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [savingExercise, setSavingExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('Chest');
  const [newExCategory] = useState('Strength');
  const [newExDifficulty] = useState('Intermediate');
  const [newExImageUrl, setNewExImageUrl] = useState('');
  const [newExInstructions, setNewExInstructions] = useState('');

  const handleCreateExercise = async () => {
    if (!newExName.trim()) {
      showWarning('Name Required', 'Please provide an exercise name.');
      return;
    }
    if (!newExInstructions.trim()) {
      showWarning('Instructions Required', 'Please provide execution instructions.');
      return;
    }

    try {
      setSavingExercise(true);
      triggerHapticFeedback();
      const res = await createLibraryExercise({
        name: newExName.trim(),
        primaryMuscle: newExMuscle,
        muscleGroup: newExMuscle,
        category: newExCategory,
        type: 'Compound',
        difficulty: newExDifficulty,
        imageUrl: newExImageUrl.trim() || undefined,
        instructions: [newExInstructions.trim()],
        defaultSets: [
          { weight: 20, reps: 10 },
          { weight: 20, reps: 10 },
          { weight: 20, reps: 10 },
        ],
      });

      if (res.success) {
        showSuccess('Exercise Created', `${newExName} added to the live library.`);
        setShowAddExerciseModal(false);
        setNewExName('');
        setNewExImageUrl('');
        setNewExInstructions('');
        onReloadExercises();
      }
    } catch (err: any) {
      showError('Creation Error', err?.message || 'Could not save exercise.');
    } finally {
      setSavingExercise(false);
    }
  };

  const handleDeleteExercise = (ex: ApiLibraryExercise) => {
    Alert.alert(
      'Remove Exercise',
      `Delete "${ex.name}" from the system library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              triggerHapticFeedback();
              const res = await deleteLibraryExercise(ex.id);
              if (res.success) {
                showSuccess('Exercise Removed', `"${ex.name}" deleted.`);
                onReloadExercises();
              }
            } catch (err: any) {
              showError('Delete Failed', err?.message || 'Could not delete exercise.');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="gap-3">
      {/* Header + Add button */}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
          Exercise Database ({exercises.length})
        </Text>
        <TouchableOpacity
          onPress={() => {
            triggerHapticFeedback();
            setShowAddExerciseModal(true);
          }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          className="bg-accent min-h-[44px] px-3.5 py-2 rounded-lg flex-row items-center gap-1.5"
        >
          <Ionicons name="add" size={18} color={colors.accentContrast} />
          <Text className="text-xs font-bold text-accent-contrast">Add Exercise</Text>
        </TouchableOpacity>
      </View>

      {/* Muscle Filter Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6 }}
      >
        {MUSCLE_GROUPS.map((m) => (
          <FilterChip
            key={m}
            label={m}
            selected={selectedMuscle === m}
            onPress={() => {
              triggerHapticFeedback();
              onSelectMuscle(m);
            }}
          />
        ))}
      </ScrollView>

      {/* Exercise List */}
      {loading && !refreshing ? (
        <View className="py-20 items-center justify-center">
          <ActivityIndicator size="small" color={colors.accent} />
          <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
            Fetching catalog from database...
          </Text>
        </View>
      ) : exercises.length === 0 ? (
        <SurfaceCard className="py-12 items-center justify-center">
          <Ionicons name="barbell-outline" size={36} color={colors.textMuted} />
          <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
            No exercises match this muscle group.
          </Text>
        </SurfaceCard>
      ) : (
        exercises.map((ex) => (
          <SurfaceCard key={ex.id} className="p-3">
            <View className="flex-row items-center gap-3">
              {ex.imageUrl ? (
                <Image
                  source={{ uri: ex.imageUrl }}
                  className="w-14 h-14 rounded-xl bg-surface-card dark:bg-surface-card-dark"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-14 h-14 rounded-xl bg-accent/10 dark:bg-accent-dark/15 border border-accent/20 items-center justify-center">
                  <Ionicons name="fitness" size={24} color={colors.accent} />
                </View>
              )}

              <View className="flex-1">
                <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
                  {ex.name}
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                  {ex.primaryMuscle || ex.muscleGroup} · {ex.category} · {ex.difficulty}
                </Text>
                {ex.instructions && ex.instructions[0] && (
                  <Text
                    className="text-[11px] text-text-muted dark:text-text-muted-dark mt-1"
                    numberOfLines={1}
                  >
                    {ex.instructions[0]}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => handleDeleteExercise(ex)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-11 h-11 rounded-xl bg-danger/10 border border-danger/20 items-center justify-center"
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </SurfaceCard>
        ))
      )}

      {/* ── Add Exercise Modal ── */}
      {showAddExerciseModal && (
        <Modal
          visible={showAddExerciseModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddExerciseModal(false)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-sm md:max-w-md rounded-2xl p-5 border border-input-border dark:border-input-border-dark max-h-[85%]">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                  Add Exercise to Catalog
                </Text>
                <ModalCloseButton onClose={() => setShowAddExerciseModal(false)} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingBottom: 10 }}
              >
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Exercise Name *
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. Incline Dumbbell Press"
                    placeholderTextColor={colors.textMuted}
                    value={newExName}
                    onChangeText={setNewExName}
                  />
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Muscle Group
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6 }}
                  >
                    {MUSCLE_GROUPS.filter((m) => m !== 'All').map((m) => (
                      <FilterChip
                        key={m}
                        label={m}
                        selected={newExMuscle === m}
                        onPress={() => {
                          triggerHapticFeedback();
                          setNewExMuscle(m);
                        }}
                      />
                    ))}
                  </ScrollView>
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Image URL (Unsplash or verified)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="https://images.unsplash.com/..."
                    placeholderTextColor={colors.textMuted}
                    value={newExImageUrl}
                    onChangeText={setNewExImageUrl}
                  />
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Execution Instructions *
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark min-h-[70px]"
                    placeholder="Describe proper posture, tempo, and form cues..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={newExInstructions}
                    onChangeText={setNewExInstructions}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleCreateExercise}
                  disabled={savingExercise}
                  className="bg-accent min-h-[48px] py-3.5 rounded-xl items-center justify-center mt-2"
                >
                  {savingExercise ? (
                    <ActivityIndicator size="small" color={colors.accentContrast} />
                  ) : (
                    <Text className="text-xs font-bold text-accent-contrast">Save to Database</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
