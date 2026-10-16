import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  TextInput,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { triggerHapticFeedback } from '@/utils/haptics';
import SurfaceCard from '@/components/ui/SurfaceCard';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import FilterChip from '@/components/ui/FilterChip';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  createLibraryExercise,
  updateLibraryExercise,
  deleteLibraryExercise,
  ApiLibraryExercise,
} from '@/api/workout';
import { autocompleteExerciseApi } from '@/api/ai';

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'];
const CATEGORIES = ['Strength', 'Hypertrophy', 'Cardio', 'Mobility'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const EQUIPMENT_OPTIONS = ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Bands'];

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
  const insets = useSafeAreaInsets();
  const { showSuccess, showError, showWarning } = useToast();

  // ── Search State ──
  const [exerciseSearch, setExerciseSearch] = useState('');

  // ── Add Exercise State ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingExercise, setSavingExercise] = useState(false);
  const [autoFillingWithAi, setAutoFillingWithAi] = useState(false);
  const [addName, setAddName] = useState('');
  const [addMuscle, setAddMuscle] = useState('Chest');
  const [addSecondaryMuscles, setAddSecondaryMuscles] = useState('');
  const [addCategory, setAddCategory] = useState('Strength');
  const [addType, setAddType] = useState('Compound');
  const [addDifficulty, setAddDifficulty] = useState('Intermediate');
  const [addEquipment, setAddEquipment] = useState('Barbell');
  const [addEquipmentAlternatives, setAddEquipmentAlternatives] = useState('');
  const [addRecommendedRest, setAddRecommendedRest] = useState('90');
  const [addRecommendedTempo, setAddRecommendedTempo] = useState('');
  const [addVideoUrl, setAddVideoUrl] = useState('');
  const [addMediaUrl, setAddMediaUrl] = useState('');
  const [addInstructions, setAddInstructions] = useState('');
  const [addFormTips, setAddFormTips] = useState('');
  const [addCommonMistakes, setAddCommonMistakes] = useState('');
  const [addBreathingTechnique, setAddBreathingTechnique] = useState('');
  const [addErrors, setAddErrors] = useState<{ name?: string; instructions?: string }>({});

  // ── Edit Exercise State ──
  const [exerciseToEdit, setExerciseToEdit] = useState<ApiLibraryExercise | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingExercise, setUpdatingExercise] = useState(false);
  const [autoFillingEditWithAi, setAutoFillingEditWithAi] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMuscle, setEditMuscle] = useState('Chest');
  const [editSecondaryMuscles, setEditSecondaryMuscles] = useState('');
  const [editCategory, setEditCategory] = useState('Strength');
  const [editType, setEditType] = useState('Compound');
  const [editDifficulty, setEditDifficulty] = useState('Intermediate');
  const [editEquipment, setEditEquipment] = useState('Barbell');
  const [editEquipmentAlternatives, setEditEquipmentAlternatives] = useState('');
  const [editRecommendedRest, setEditRecommendedRest] = useState('90');
  const [editRecommendedTempo, setEditRecommendedTempo] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editMediaUrl, setEditMediaUrl] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editFormTips, setEditFormTips] = useState('');
  const [editCommonMistakes, setEditCommonMistakes] = useState('');
  const [editBreathingTechnique, setEditBreathingTechnique] = useState('');
  const [editErrors, setEditErrors] = useState<{ name?: string; instructions?: string }>({});

  // ── Delete State ──
  const [exerciseToDelete, setExerciseToDelete] = useState<ApiLibraryExercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState(false);

  // ── Handlers ──
  const handleOpenAddModal = () => {
    triggerHapticFeedback();
    setAddName('');
    setAddErrors({});
    setAddMuscle(selectedMuscle !== 'All' ? selectedMuscle : 'Chest');
    setAddSecondaryMuscles('');
    setAddCategory('Strength');
    setAddType('Compound');
    setAddDifficulty('Intermediate');
    setAddEquipment('Barbell');
    setAddEquipmentAlternatives('');
    setAddRecommendedRest('90');
    setAddRecommendedTempo('');
    setAddVideoUrl('');
    setAddMediaUrl('');
    setAddInstructions('');
    setAddFormTips('');
    setAddCommonMistakes('');
    setAddBreathingTechnique('');
    setShowAddModal(true);
  };

  const handleAutoFillWithAi = async () => {
    if (!addName.trim()) {
      setAddErrors((prev) => ({ ...prev, name: 'Please enter an exercise name first (e.g. Romanian Deadlift).' }));
      return;
    }

    try {
      setAutoFillingWithAi(true);
      triggerHapticFeedback();
      const res = await autocompleteExerciseApi(addName.trim());
      if (res?.success && res.data) {
        const d = res.data;
        if (d.primaryMuscle) setAddMuscle(d.primaryMuscle);
        if (Array.isArray(d.secondaryMuscles) && d.secondaryMuscles.length > 0) {
          setAddSecondaryMuscles(d.secondaryMuscles.join(', '));
        }
        if (d.category) setAddCategory(d.category);
        if (d.difficulty) setAddDifficulty(d.difficulty);
        if (d.type) setAddType(d.type);
        if (Array.isArray(d.equipment) && d.equipment.length > 0) {
          const matched = EQUIPMENT_OPTIONS.find((eq) => eq.toLowerCase() === d.equipment[0].toLowerCase());
          if (matched) setAddEquipment(matched);
        }
        if (Array.isArray(d.instructions) && d.instructions.length > 0) {
          setAddInstructions(d.instructions.join('\n'));
          setAddErrors((prev) => ({ ...prev, instructions: undefined }));
        }
        if (Array.isArray(d.formTips) && d.formTips.length > 0) {
          setAddFormTips(d.formTips.join('\n'));
        }
        if (Array.isArray(d.commonMistakes) && d.commonMistakes.length > 0) {
          setAddCommonMistakes(d.commonMistakes.join('\n'));
        }
        if (d.breathingTechnique) {
          setAddBreathingTechnique(d.breathingTechnique);
        }
        showSuccess('Auto-Filled with AI', `Loaded complete trainer guide for "${addName.trim()}".`);
      }
    } catch (err: any) {
      showError('AI Auto-Fill Error', err?.message || 'Could not auto-fill exercise details.');
    } finally {
      setAutoFillingWithAi(false);
    }
  };

  const handleCreateExercise = async () => {
    const errors: { name?: string; instructions?: string } = {};
    if (!addName.trim()) {
      errors.name = 'Please enter an exercise name.';
    }
    if (!addInstructions.trim()) {
      errors.instructions = 'Please provide execution instructions or steps.';
    }
    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }
    setAddErrors({});

    try {
      setSavingExercise(true);
      triggerHapticFeedback();
      const isGif = addMediaUrl.toLowerCase().includes('.gif');
      const instructionsArr = addInstructions.split('\n').map((s) => s.trim()).filter(Boolean);
      const formTipsArr = addFormTips ? addFormTips.split('\n').map((s) => s.trim()).filter(Boolean) : [];
      const commonMistakesArr = addCommonMistakes ? addCommonMistakes.split('\n').map((s) => s.trim()).filter(Boolean) : [];
      const secondaryMusclesArr = addSecondaryMuscles
        ? addSecondaryMuscles.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const equipmentAltArr = addEquipmentAlternatives
        ? addEquipmentAlternatives.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const restNum = parseInt(addRecommendedRest, 10) || 60;

      const res = await createLibraryExercise({
        name: addName.trim(),
        primaryMuscle: addMuscle,
        muscleGroup: addMuscle,
        secondaryMuscles: secondaryMusclesArr,
        category: addCategory,
        type: addType || 'Compound',
        difficulty: addDifficulty,
        equipment: [addEquipment],
        equipmentAlternatives: equipmentAltArr,
        recommendedRest: restNum,
        recommendedTempo: addRecommendedTempo.trim() || undefined,
        videoUrl: addVideoUrl.trim() || undefined,
        imageUrl: isGif ? undefined : (addMediaUrl.trim() || undefined),
        gifUrl: isGif ? addMediaUrl.trim() : undefined,
        instructions: instructionsArr,
        formTips: formTipsArr,
        commonMistakes: commonMistakesArr,
        breathingTechnique: addBreathingTechnique.trim() || undefined,
        defaultSets: [
          { weight: 20, reps: 10 },
          { weight: 20, reps: 10 },
          { weight: 20, reps: 10 },
        ],
      });

      if (res.success) {
        showSuccess('Exercise Created', `"${addName.trim()}" added to the library.`);
        setShowAddModal(false);
        onReloadExercises();
      }
    } catch (err: any) {
      showError('Creation Error', err?.message || 'Could not save exercise.');
    } finally {
      setSavingExercise(false);
    }
  };

  const handleAutoFillEditWithAi = async () => {
    if (!editName.trim()) {
      setEditErrors((prev) => ({ ...prev, name: 'Please enter an exercise name first (e.g. Romanian Deadlift).' }));
      return;
    }

    try {
      setAutoFillingEditWithAi(true);
      triggerHapticFeedback();
      const res = await autocompleteExerciseApi(editName.trim());
      if (res?.success && res.data) {
        const d = res.data;
        if (d.primaryMuscle) setEditMuscle(d.primaryMuscle);
        if (Array.isArray(d.secondaryMuscles) && d.secondaryMuscles.length > 0) {
          setEditSecondaryMuscles(d.secondaryMuscles.join(', '));
        }
        if (d.category) setEditCategory(d.category);
        if (d.difficulty) setEditDifficulty(d.difficulty);
        if (d.type) setEditType(d.type);
        if (Array.isArray(d.equipment) && d.equipment.length > 0) {
          const matched = EQUIPMENT_OPTIONS.find((eq) => eq.toLowerCase() === d.equipment[0].toLowerCase());
          if (matched) setEditEquipment(matched);
        }
        if (Array.isArray(d.instructions) && d.instructions.length > 0) {
          setEditInstructions(d.instructions.join('\n'));
          setEditErrors((prev) => ({ ...prev, instructions: undefined }));
        }
        if (Array.isArray(d.formTips) && d.formTips.length > 0) {
          setEditFormTips(d.formTips.join('\n'));
        }
        if (Array.isArray(d.commonMistakes) && d.commonMistakes.length > 0) {
          setEditCommonMistakes(d.commonMistakes.join('\n'));
        }
        if (d.breathingTechnique) {
          setEditBreathingTechnique(d.breathingTechnique);
        }
        showSuccess('Auto-Filled with AI', `Loaded complete trainer guide for "${editName.trim()}".`);
      }
    } catch (err: any) {
      showError('AI Auto-Fill Error', err?.message || 'Could not auto-fill exercise details.');
    } finally {
      setAutoFillingEditWithAi(false);
    }
  };

  const handleOpenEditModal = (ex: ApiLibraryExercise) => {
    triggerHapticFeedback();
    setExerciseToEdit(ex);
    setEditErrors({});
    setEditName(ex.name || '');
    setEditMuscle(ex.primaryMuscle || ex.muscleGroup || 'Chest');
    setEditSecondaryMuscles(
      Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles.join(', ') : ''
    );
    setEditCategory(ex.category || 'Strength');
    setEditType((ex as any).type || 'Compound');
    setEditDifficulty(ex.difficulty || 'Intermediate');

    let eq = 'Barbell';
    if (Array.isArray(ex.equipment) && ex.equipment.length > 0) {
      eq = ex.equipment[0];
    } else if (typeof ex.equipment === 'string') {
      eq = ex.equipment;
    }
    setEditEquipment(eq);
    setEditEquipmentAlternatives(
      Array.isArray(ex.equipmentAlternatives) ? ex.equipmentAlternatives.join(', ') : ''
    );
    setEditRecommendedRest(ex.recommendedRest ? String(ex.recommendedRest) : '90');
    setEditRecommendedTempo(ex.recommendedTempo || '');
    setEditVideoUrl(ex.videoUrl || '');

    setEditMediaUrl(ex.gifUrl || ex.imageUrl || '');

    const inst = Array.isArray(ex.instructions)
      ? ex.instructions.join('\n')
      : typeof ex.instructions === 'string'
      ? ex.instructions
      : '';
    setEditInstructions(inst);

    const tips = Array.isArray(ex.formTips)
      ? ex.formTips.join('\n')
      : typeof ex.formTips === 'string'
      ? ex.formTips
      : '';
    setEditFormTips(tips);

    const mistakes = Array.isArray((ex as any).commonMistakes)
      ? (ex as any).commonMistakes.join('\n')
      : typeof (ex as any).commonMistakes === 'string'
      ? (ex as any).commonMistakes
      : '';
    setEditCommonMistakes(mistakes);

    setEditBreathingTechnique((ex as any).breathingTechnique || '');

    setShowEditModal(true);
  };

  const handleUpdateExercise = async () => {
    if (!exerciseToEdit) return;
    const errors: { name?: string; instructions?: string } = {};
    if (!editName.trim()) {
      errors.name = 'Please enter an exercise name.';
    }
    if (!editInstructions.trim()) {
      errors.instructions = 'Please provide execution instructions.';
    }
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    setEditErrors({});

    try {
      setUpdatingExercise(true);
      triggerHapticFeedback();
      const isGif = editMediaUrl.toLowerCase().includes('.gif');
      const instructionsArr = editInstructions.split('\n').map((s) => s.trim()).filter(Boolean);
      const formTipsArr = editFormTips ? editFormTips.split('\n').map((s) => s.trim()).filter(Boolean) : [];
      const commonMistakesArr = editCommonMistakes ? editCommonMistakes.split('\n').map((s) => s.trim()).filter(Boolean) : [];
      const secondaryMusclesArr = editSecondaryMuscles
        ? editSecondaryMuscles.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const equipmentAltArr = editEquipmentAlternatives
        ? editEquipmentAlternatives.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const restNum = parseInt(editRecommendedRest, 10) || 60;

      const res = await updateLibraryExercise(exerciseToEdit.id, {
        name: editName.trim(),
        primaryMuscle: editMuscle,
        muscleGroup: editMuscle,
        secondaryMuscles: secondaryMusclesArr,
        category: editCategory,
        type: editType || 'Compound',
        difficulty: editDifficulty,
        equipment: [editEquipment],
        equipmentAlternatives: equipmentAltArr,
        recommendedRest: restNum,
        recommendedTempo: editRecommendedTempo.trim() || undefined,
        videoUrl: editVideoUrl.trim() || null,
        instructions: instructionsArr,
        formTips: formTipsArr,
        commonMistakes: commonMistakesArr,
        breathingTechnique: editBreathingTechnique.trim() || undefined,
        imageUrl: isGif ? null : (editMediaUrl.trim() || null),
        gifUrl: isGif ? editMediaUrl.trim() : null,
      });

      if (res.success) {
        showSuccess('Exercise Updated', `"${editName.trim()}" changes saved.`);
        setShowEditModal(false);
        setExerciseToEdit(null);
        onReloadExercises();
      }
    } catch (err: any) {
      showError('Update Failed', err?.message || 'Could not update exercise.');
    } finally {
      setUpdatingExercise(false);
    }
  };

  const handleDeleteExercise = (ex: ApiLibraryExercise) => {
    triggerHapticFeedback();
    setExerciseToDelete(ex);
  };

  const executeDeleteExercise = async () => {
    if (!exerciseToDelete) return;
    try {
      setDeletingExercise(true);
      triggerHapticFeedback();
      const res = await deleteLibraryExercise(exerciseToDelete.id);
      if (res.success) {
        showSuccess('Exercise Removed', `"${exerciseToDelete.name}" deleted.`);
        setExerciseToDelete(null);
        onReloadExercises();
      }
    } catch (err: any) {
      showError('Delete Failed', err?.message || 'Could not delete exercise.');
    } finally {
      setDeletingExercise(false);
    }
  };

  const filteredExercises = useMemo(() => {
    if (!exerciseSearch.trim()) return exercises;
    const q = exerciseSearch.toLowerCase().trim();
    return exercises.filter((ex) => {
      const name = (ex.name || '').toLowerCase();
      const muscle = (ex.primaryMuscle || ex.muscleGroup || '').toLowerCase();
      const secMuscles = Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles.join(' ').toLowerCase() : '';
      const eq = Array.isArray(ex.equipment) ? ex.equipment.join(' ').toLowerCase() : (ex.equipment || '').toLowerCase();
      const cat = (ex.category || '').toLowerCase();
      return name.includes(q) || muscle.includes(q) || secMuscles.includes(q) || eq.includes(q) || cat.includes(q);
    });
  }, [exercises, exerciseSearch]);

  return (
    <View className="flex-1 min-h-0">
      {/* Pinned Catalog Header, Search Input, and Muscle Filters */}
      <View className="pb-3 gap-2.5">
        {/* Header + Add button */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
              Exercise Catalog ({filteredExercises.length}{exerciseSearch ? ` of ${exercises.length}` : ''})
            </Text>
            <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
              Synchronized with live workout library & gifs
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleOpenAddModal}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            className="bg-accent min-h-[44px] px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 shadow-sm"
          >
            <Ionicons name="add" size={18} color={colors.textPrimary} />
            <Text className="text-xs font-bold text-accent-contrast">Add Exercise</Text>
          </TouchableOpacity>
        </View>

        {/* Exercise Search Input */}
        <View className="flex-row items-center bg-input dark:bg-input-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark">
          <Ionicons name="search" size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            value={exerciseSearch}
            onChangeText={setExerciseSearch}
            placeholder="Search by exercise name, equipment, muscle..."
            placeholderTextColor={colors.textMuted}
            className="flex-1 text-xs text-text-primary dark:text-text-primary-dark font-medium py-0"
            autoCapitalize="none"
          />
          {exerciseSearch.length > 0 && (
            <TouchableOpacity onPress={() => setExerciseSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
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
      </View>

      {/* Scrollable Exercise List */}
      <ScrollView
        className="flex-1 min-h-0"
        contentContainerStyle={{ paddingBottom: 90, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onReloadExercises}
            tintColor={colors.accent}
          />
        }
      >
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
      ) : filteredExercises.length === 0 ? (
        <SurfaceCard className="py-12 items-center justify-center">
          <Ionicons name="search-outline" size={32} color={colors.textMuted} />
          <Text className="text-xs font-semibold text-text-primary dark:text-text-primary-dark mt-2">
            No matching exercises found
          </Text>
          <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5 text-center">
            No exercises match "{exerciseSearch}".
          </Text>
          <TouchableOpacity
            onPress={() => setExerciseSearch('')}
            className="mt-3 px-3 py-1.5 rounded-lg bg-accent/15 border border-accent/30"
          >
            <Text className="text-xs font-bold text-accent dark:text-accent-mint">Clear Search</Text>
          </TouchableOpacity>
        </SurfaceCard>
      ) : (
        filteredExercises.map((ex) => {
          const mediaUri = ex.gifUrl || ex.imageUrl;
          const displayEquipment = Array.isArray(ex.equipment)
            ? ex.equipment.join(', ')
            : ex.equipment || 'Standard';

          return (
            <SurfaceCard key={ex.id} className="p-3">
              <View className="flex-row items-center gap-3">
                {mediaUri ? (
                  <Image
                    source={{ uri: mediaUri }}
                    className="w-14 h-14 rounded-xl bg-surface-card dark:bg-surface-card-dark border border-input-border dark:border-input-border-dark"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-14 h-14 rounded-xl bg-accent/10 dark:bg-accent-dark/15 border border-accent/20 items-center justify-center">
                    <Ionicons name="fitness" size={24} color={colors.accent} />
                  </View>
                )}

                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5 flex-wrap">
                    <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
                      {ex.name}
                    </Text>
                    <View className="bg-surface-card dark:bg-surface-card-dark px-1.5 py-0.5 rounded border border-input-border dark:border-input-border-dark">
                      <Text className="text-[10px] font-semibold text-text-muted dark:text-text-muted-dark">
                        {ex.difficulty}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                    {ex.primaryMuscle || ex.muscleGroup} · {displayEquipment} · {ex.category}
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

                {/* Edit & Delete Actions */}
                <View className="flex-row items-center gap-1.5">
                  <TouchableOpacity
                    onPress={() => handleOpenEditModal(ex)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 items-center justify-center"
                    accessibilityLabel={`Edit ${ex.name}`}
                  >
                    <Ionicons name="pencil-outline" size={16} color={colors.accent} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteExercise(ex)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/20 items-center justify-center"
                    accessibilityLabel={`Delete ${ex.name}`}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </SurfaceCard>
          );
        })
      )}
      </ScrollView>

      {/* ── Add Exercise Modal ── */}
      {showAddModal && (
        <Modal
          visible={showAddModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 justify-end md:justify-center md:items-center bg-black/60 p-0 md:p-4"
          >
            <Pressable className="hidden md:flex flex-1 w-full" onPress={() => setShowAddModal(false)} />

            <View
              style={{
                paddingTop: Platform.OS !== 'web' && insets.top > 0 ? insets.top + 8 : 16,
                paddingBottom: Platform.OS !== 'web' && insets.bottom > 0 ? insets.bottom + 8 : 16,
              }}
              className="bg-surface dark:bg-surface-dark flex-1 md:flex-none h-full md:h-[90%] w-full md:max-w-2xl rounded-none md:rounded-3xl p-4 md:p-6 border-0 md:border border-input-border dark:border-input-border-dark shadow-2xl flex-col"
            >
              <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
                <View className="flex-1 pr-2 min-w-0">
                  <Text numberOfLines={1} className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                    Add Exercise to Catalog
                  </Text>
                  <Text numberOfLines={1} className="text-[11px] text-text-muted dark:text-text-muted-dark">
                    Basics, cues, and media preview
                  </Text>
                </View>
                <ModalCloseButton onClose={() => setShowAddModal(false)} />
              </View>

              <ScrollView
                className="flex-1 my-3"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
              >
                {/* 1. Basics */}
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark">
                      Exercise Name *
                    </Text>
                    <TouchableOpacity
                      onPress={handleAutoFillWithAi}
                      disabled={autoFillingWithAi}
                      activeOpacity={0.8}
                      className="flex-row items-center gap-1 bg-accent/15 px-2 py-0.5 rounded-lg border border-accent/30"
                    >
                      {autoFillingWithAi ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <>
                          <Ionicons name="sparkles" size={11} color={colors.accent} />
                          <Text className="text-[10px] font-black text-accent">Auto-Fill with AI</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    className={`bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border text-sm text-text-primary dark:text-text-primary-dark ${
                      addErrors.name
                        ? 'border-danger'
                        : 'border-input-border dark:border-input-border-dark'
                    }`}
                    placeholder="e.g. Romanian Deadlift"
                    placeholderTextColor={colors.textMuted}
                    value={addName}
                    onChangeText={(val) => {
                      setAddName(val);
                      if (addErrors.name) setAddErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                  />
                  {addErrors.name ? (
                    <Text className="text-xs text-danger mt-1">{addErrors.name}</Text>
                  ) : null}
                </View>

                {/* Target Muscle Group */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Primary Muscle Group
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
                        selected={addMuscle === m}
                        onPress={() => {
                          triggerHapticFeedback();
                          setAddMuscle(m);
                        }}
                      />
                    ))}
                  </ScrollView>
                </View>

                {/* Secondary Muscles */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Secondary Muscles (comma-separated)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. Triceps, Front Delts"
                    placeholderTextColor={colors.textMuted}
                    value={addSecondaryMuscles}
                    onChangeText={setAddSecondaryMuscles}
                  />
                </View>

                {/* Equipment & Equipment Alternatives */}
                <View className="gap-2">
                  <View>
                    <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                      Primary Equipment
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 6 }}
                    >
                      {EQUIPMENT_OPTIONS.map((eq) => (
                        <FilterChip
                          key={eq}
                          label={eq}
                          selected={addEquipment === eq}
                          onPress={() => {
                            triggerHapticFeedback();
                            setAddEquipment(eq);
                          }}
                        />
                      ))}
                    </ScrollView>
                  </View>

                  <View>
                    <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                      Equipment Alternatives (comma-separated)
                    </Text>
                    <TextInput
                      className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                      placeholder="e.g. Dumbbells, Resistance Bands"
                      placeholderTextColor={colors.textMuted}
                      value={addEquipmentAlternatives}
                      onChangeText={setAddEquipmentAlternatives}
                    />
                  </View>

                  <View>
                    <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                      Difficulty Level
                    </Text>
                    <View className="flex-row gap-2">
                      {DIFFICULTIES.map((d) => (
                        <FilterChip
                          key={d}
                          label={d}
                          selected={addDifficulty === d}
                          onPress={() => {
                            triggerHapticFeedback();
                            setAddDifficulty(d);
                          }}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Rest & Tempo */}
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                        Rest (seconds)
                      </Text>
                      <TextInput
                        className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                        placeholder="e.g. 90"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        value={addRecommendedRest}
                        onChangeText={setAddRecommendedRest}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                        Tempo (ecc-pause-con)
                      </Text>
                      <TextInput
                        className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                        placeholder="e.g. 3-0-1-0"
                        placeholderTextColor={colors.textMuted}
                        value={addRecommendedTempo}
                        onChangeText={setAddRecommendedTempo}
                      />
                    </View>
                  </View>
                </View>

                {/* 2. Media Image / GIF with Live Preview */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Image / GIF URL (Live Demo)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="https://.../exercise.gif or .jpg"
                    placeholderTextColor={colors.textMuted}
                    value={addMediaUrl}
                    onChangeText={setAddMediaUrl}
                    autoCapitalize="none"
                  />
                  {addMediaUrl.trim() ? (
                    <View className="items-center justify-center p-2 rounded-xl bg-surface-card dark:bg-surface-card-dark border border-input-border dark:border-input-border-dark mt-2">
                      <Image
                        source={{ uri: addMediaUrl.trim() }}
                        className="w-full h-32 rounded-lg"
                        resizeMode="contain"
                      />
                      <View className="flex-row items-center gap-1 mt-1.5">
                        <Ionicons name="checkmark-circle" size={12} color={colors.accent} />
                        <Text className="text-[11px] font-semibold text-accent">Live Media Preview</Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* Video Tutorial URL */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Video Tutorial URL (Optional)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. https://youtube.com/watch?v=..."
                    placeholderTextColor={colors.textMuted}
                    value={addVideoUrl}
                    onChangeText={setAddVideoUrl}
                    autoCapitalize="none"
                  />
                </View>

                {/* 3. Instructions & Form Guidance */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Execution Instructions * (1 step per line)
                  </Text>
                  <TextInput
                    className={`bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border text-sm text-text-primary dark:text-text-primary-dark min-h-[70px] ${
                      addErrors.instructions
                        ? 'border-danger'
                        : 'border-input-border dark:border-input-border-dark'
                    }`}
                    placeholder="1. Position feet shoulder-width apart&#10;2. Lower with control&#10;3. Drive through heels"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={addInstructions}
                    onChangeText={(val) => {
                      setAddInstructions(val);
                      if (addErrors.instructions) setAddErrors((prev) => ({ ...prev, instructions: undefined }));
                    }}
                  />
                  {addErrors.instructions ? (
                    <Text className="text-xs text-danger mt-1">{addErrors.instructions}</Text>
                  ) : null}
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Form Tips & Cues (Optional)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark min-h-[50px]"
                    placeholder="e.g. Keep chest up and engage core throughout"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    value={addFormTips}
                    onChangeText={setAddFormTips}
                  />
                </View>

                {/* Common Mistakes */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Common Mistakes to Avoid (1 per line)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark min-h-[50px]"
                    placeholder="e.g. Rounding lower back&#10;Bending knees excessively"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    value={addCommonMistakes}
                    onChangeText={setAddCommonMistakes}
                  />
                </View>

                {/* Breathing Cadence */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Breathing Cadence
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. Inhale as you lower, exhale forcefully as you drive upward"
                    placeholderTextColor={colors.textMuted}
                    value={addBreathingTechnique}
                    onChangeText={setAddBreathingTechnique}
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleCreateExercise}
                disabled={savingExercise}
                className="bg-accent min-h-[48px] py-3.5 rounded-xl items-center justify-center mt-2 shadow-sm"
              >
                {savingExercise ? (
                  <ActivityIndicator size="small" color={colors.accentContrast} />
                ) : (
                  <Text className="text-xs font-bold text-accent-contrast">Save to Catalog</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* ── Edit Exercise Modal ── */}
      {showEditModal && exerciseToEdit && (
        <Modal
          visible={showEditModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEditModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 justify-end md:justify-center md:items-center bg-black/60 p-0 md:p-4"
          >
            <Pressable className="hidden md:flex flex-1 w-full" onPress={() => setShowEditModal(false)} />

            <View
              style={{
                paddingTop: Platform.OS !== 'web' && insets.top > 0 ? insets.top + 8 : 16,
                paddingBottom: Platform.OS !== 'web' && insets.bottom > 0 ? insets.bottom + 8 : 16,
              }}
              className="bg-surface dark:bg-surface-dark flex-1 md:flex-none h-full md:h-[90%] w-full md:max-w-2xl rounded-none md:rounded-3xl p-4 md:p-6 border-0 md:border border-input-border dark:border-input-border-dark shadow-2xl flex-col"
            >
              <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
                <View className="flex-1 pr-2 min-w-0">
                  <Text numberOfLines={1} className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                    Edit Exercise
                  </Text>
                  <Text numberOfLines={1} className="text-[11px] text-text-muted dark:text-text-muted-dark">
                    Update catalog entry and media demo
                  </Text>
                </View>
                <ModalCloseButton onClose={() => setShowEditModal(false)} />
              </View>

              <ScrollView
                className="flex-1 my-3"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
              >
                {/* 1. Basics */}
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark">
                      Exercise Name *
                    </Text>
                    <TouchableOpacity
                      onPress={handleAutoFillEditWithAi}
                      disabled={autoFillingEditWithAi}
                      activeOpacity={0.8}
                      className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/30"
                    >
                      {autoFillingEditWithAi ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <>
                          <Ionicons name="sparkles" size={11} color={colors.accent} />
                          <Text className="text-[10px] font-black text-accent">Auto-Fill with AI</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    className={`bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border text-sm text-text-primary dark:text-text-primary-dark ${
                      editErrors.name
                        ? 'border-danger'
                        : 'border-input-border dark:border-input-border-dark'
                    }`}
                    placeholder="Exercise Name"
                    placeholderTextColor={colors.textMuted}
                    value={editName}
                    onChangeText={(val) => {
                      setEditName(val);
                      if (editErrors.name) setEditErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                  />
                  {editErrors.name ? (
                    <Text className="text-xs text-danger mt-1">{editErrors.name}</Text>
                  ) : null}
                </View>

                {/* Target Muscle Group */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Primary Muscle Group
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
                        selected={editMuscle === m}
                        onPress={() => {
                          triggerHapticFeedback();
                          setEditMuscle(m);
                        }}
                      />
                    ))}
                  </ScrollView>
                </View>

                {/* Secondary Muscles */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Secondary Muscles (comma-separated)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. Triceps, Front Delts"
                    placeholderTextColor={colors.textMuted}
                    value={editSecondaryMuscles}
                    onChangeText={setEditSecondaryMuscles}
                  />
                </View>

                {/* Movement Type (Compound vs Isolation) */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Movement Type
                  </Text>
                  <View className="flex-row gap-2">
                    {(['Compound', 'Isolation'] as const).map((t) => (
                      <FilterChip
                        key={t}
                        label={t}
                        selected={editType === t}
                        onPress={() => {
                          triggerHapticFeedback();
                          setEditType(t);
                        }}
                      />
                    ))}
                  </View>
                </View>

                {/* Equipment & Equipment Alternatives */}
                <View className="gap-2">
                  <View>
                    <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                      Primary Equipment
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 6 }}
                    >
                      {EQUIPMENT_OPTIONS.map((eq) => (
                        <FilterChip
                          key={eq}
                          label={eq}
                          selected={editEquipment === eq}
                          onPress={() => {
                            triggerHapticFeedback();
                            setEditEquipment(eq);
                          }}
                        />
                      ))}
                    </ScrollView>
                  </View>

                  <View>
                    <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                      Equipment Alternatives (comma-separated)
                    </Text>
                    <TextInput
                      className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                      placeholder="e.g. Dumbbells, Resistance Bands"
                      placeholderTextColor={colors.textMuted}
                      value={editEquipmentAlternatives}
                      onChangeText={setEditEquipmentAlternatives}
                    />
                  </View>

                  <View>
                    <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                      Difficulty Level
                    </Text>
                    <View className="flex-row gap-2">
                      {DIFFICULTIES.map((d) => (
                        <FilterChip
                          key={d}
                          label={d}
                          selected={editDifficulty === d}
                          onPress={() => {
                            triggerHapticFeedback();
                            setEditDifficulty(d);
                          }}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Rest & Tempo */}
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                        Rest (seconds)
                      </Text>
                      <TextInput
                        className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                        placeholder="e.g. 90"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        value={editRecommendedRest}
                        onChangeText={setEditRecommendedRest}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                        Tempo (ecc-pause-con)
                      </Text>
                      <TextInput
                        className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                        placeholder="e.g. 3-0-1-0"
                        placeholderTextColor={colors.textMuted}
                        value={editRecommendedTempo}
                        onChangeText={setEditRecommendedTempo}
                      />
                    </View>
                  </View>
                </View>

                {/* 2. Media Image / GIF with Live Preview */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Image / GIF URL (Live Demo)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="https://.../exercise.gif or .jpg"
                    placeholderTextColor={colors.textMuted}
                    value={editMediaUrl}
                    onChangeText={setEditMediaUrl}
                    autoCapitalize="none"
                  />
                  {editMediaUrl.trim() ? (
                    <View className="items-center justify-center p-2 rounded-xl bg-surface-card dark:bg-surface-card-dark border border-input-border dark:border-input-border-dark mt-2">
                      <Image
                        source={{ uri: editMediaUrl.trim() }}
                        className="w-full h-32 rounded-lg"
                        resizeMode="contain"
                      />
                      <View className="flex-row items-center gap-1 mt-1.5">
                        <Ionicons name="checkmark-circle" size={12} color={colors.accent} />
                        <Text className="text-[11px] font-semibold text-accent">Live Media Preview</Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* Video Tutorial URL */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Video Tutorial URL (Optional)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. https://youtube.com/watch?v=..."
                    placeholderTextColor={colors.textMuted}
                    value={editVideoUrl}
                    onChangeText={setEditVideoUrl}
                    autoCapitalize="none"
                  />
                </View>

                {/* 3. Instructions & Form Guidance */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Execution Instructions * (1 step per line)
                  </Text>
                  <TextInput
                    className={`bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border text-sm text-text-primary dark:text-text-primary-dark min-h-[70px] ${
                      editErrors.instructions
                        ? 'border-danger'
                        : 'border-input-border dark:border-input-border-dark'
                    }`}
                    placeholder="Describe execution steps..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={editInstructions}
                    onChangeText={(val) => {
                      setEditInstructions(val);
                      if (editErrors.instructions) setEditErrors((prev) => ({ ...prev, instructions: undefined }));
                    }}
                  />
                  {editErrors.instructions ? (
                    <Text className="text-xs text-danger mt-1">{editErrors.instructions}</Text>
                  ) : null}
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Form Tips & Cues (Optional)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark min-h-[50px]"
                    placeholder="Key cues to remember..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    value={editFormTips}
                    onChangeText={setEditFormTips}
                  />
                </View>

                {/* Common Mistakes */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Common Mistakes to Avoid (1 per line)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark min-h-[50px]"
                    placeholder="e.g. Rounding lower back&#10;Bending knees excessively"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    value={editCommonMistakes}
                    onChangeText={setEditCommonMistakes}
                  />
                </View>

                {/* Breathing Cadence */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Breathing Cadence
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. Inhale as you lower, exhale forcefully as you drive upward"
                    placeholderTextColor={colors.textMuted}
                    value={editBreathingTechnique}
                    onChangeText={setEditBreathingTechnique}
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleUpdateExercise}
                disabled={updatingExercise}
                className="bg-accent min-h-[48px] py-3.5 rounded-xl items-center justify-center mt-2 shadow-sm"
              >
                {updatingExercise ? (
                  <ActivityIndicator size="small" color={colors.accentContrast} />
                ) : (
                  <Text className="text-xs font-bold text-accent-contrast">Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Exercise Deletion Confirmation Modal */}
      <ConfirmModal
        visible={Boolean(exerciseToDelete)}
        title="Delete Exercise?"
        message={`Are you sure you want to permanently remove "${exerciseToDelete?.name}" from the exercise catalog?`}
        confirmText="Delete Exercise"
        cancelText="Cancel"
        isDanger
        iconName="trash-outline"
        loading={deletingExercise}
        onConfirm={executeDeleteExercise}
        onCancel={() => setExerciseToDelete(null)}
      />
    </View>
  );
}
