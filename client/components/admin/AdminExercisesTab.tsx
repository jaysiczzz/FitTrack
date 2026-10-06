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
} from 'react-native';
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
  const { showSuccess, showError, showWarning } = useToast();

  // ── Add Exercise State ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingExercise, setSavingExercise] = useState(false);
  const [autoFillingWithAi, setAutoFillingWithAi] = useState(false);
  const [addName, setAddName] = useState('');
  const [addMuscle, setAddMuscle] = useState('Chest');
  const [addCategory, setAddCategory] = useState('Strength');
  const [addType, setAddType] = useState('Compound');
  const [addDifficulty, setAddDifficulty] = useState('Intermediate');
  const [addEquipment, setAddEquipment] = useState('Barbell');
  const [addMediaUrl, setAddMediaUrl] = useState('');
  const [addInstructions, setAddInstructions] = useState('');
  const [addFormTips, setAddFormTips] = useState('');
  const [addCommonMistakes, setAddCommonMistakes] = useState('');
  const [addBreathingTechnique, setAddBreathingTechnique] = useState('');

  // ── Edit Exercise State ──
  const [exerciseToEdit, setExerciseToEdit] = useState<ApiLibraryExercise | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingExercise, setUpdatingExercise] = useState(false);
  const [autoFillingEditWithAi, setAutoFillingEditWithAi] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMuscle, setEditMuscle] = useState('Chest');
  const [editCategory, setEditCategory] = useState('Strength');
  const [editType, setEditType] = useState('Compound');
  const [editDifficulty, setEditDifficulty] = useState('Intermediate');
  const [editEquipment, setEditEquipment] = useState('Barbell');
  const [editMediaUrl, setEditMediaUrl] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editFormTips, setEditFormTips] = useState('');
  const [editCommonMistakes, setEditCommonMistakes] = useState('');
  const [editBreathingTechnique, setEditBreathingTechnique] = useState('');

  // ── Delete State ──
  const [exerciseToDelete, setExerciseToDelete] = useState<ApiLibraryExercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState(false);

  // ── Handlers ──
  const handleOpenAddModal = () => {
    triggerHapticFeedback();
    setAddName('');
    setAddMuscle(selectedMuscle !== 'All' ? selectedMuscle : 'Chest');
    setAddCategory('Strength');
    setAddType('Compound');
    setAddDifficulty('Intermediate');
    setAddEquipment('Barbell');
    setAddMediaUrl('');
    setAddInstructions('');
    setAddFormTips('');
    setAddCommonMistakes('');
    setAddBreathingTechnique('');
    setShowAddModal(true);
  };

  const handleAutoFillWithAi = async () => {
    if (!addName.trim()) {
      showWarning('Name Required', 'Please enter an exercise name first (e.g. Romanian Deadlift).');
      return;
    }

    try {
      setAutoFillingWithAi(true);
      triggerHapticFeedback();
      const res = await autocompleteExerciseApi(addName.trim());
      if (res?.success && res.data) {
        const d = res.data;
        if (d.primaryMuscle) setAddMuscle(d.primaryMuscle);
        if (d.category) setAddCategory(d.category);
        if (d.difficulty) setAddDifficulty(d.difficulty);
        if (d.type) setAddType(d.type);
        if (Array.isArray(d.equipment) && d.equipment.length > 0) {
          const matched = EQUIPMENT_OPTIONS.find((eq) => eq.toLowerCase() === d.equipment[0].toLowerCase());
          if (matched) setAddEquipment(matched);
        }
        if (Array.isArray(d.instructions) && d.instructions.length > 0) {
          setAddInstructions(d.instructions.join('\n'));
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
    if (!addName.trim()) {
      showWarning('Name Required', 'Please enter an exercise name.');
      return;
    }
    if (!addInstructions.trim()) {
      showWarning('Instructions Required', 'Please provide execution instructions or steps.');
      return;
    }

    try {
      setSavingExercise(true);
      triggerHapticFeedback();
      const isGif = addMediaUrl.toLowerCase().includes('.gif');
      const instructionsArr = addInstructions.split('\n').map((s) => s.trim()).filter(Boolean);
      const formTipsArr = addFormTips ? addFormTips.split('\n').map((s) => s.trim()).filter(Boolean) : [];
      const commonMistakesArr = addCommonMistakes ? addCommonMistakes.split('\n').map((s) => s.trim()).filter(Boolean) : [];

      const res = await createLibraryExercise({
        name: addName.trim(),
        primaryMuscle: addMuscle,
        muscleGroup: addMuscle,
        category: addCategory,
        type: addType || 'Compound',
        difficulty: addDifficulty,
        equipment: [addEquipment],
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
      showWarning('Name Required', 'Please enter an exercise name first (e.g. Romanian Deadlift).');
      return;
    }

    try {
      setAutoFillingEditWithAi(true);
      triggerHapticFeedback();
      const res = await autocompleteExerciseApi(editName.trim());
      if (res?.success && res.data) {
        const d = res.data;
        if (d.primaryMuscle) setEditMuscle(d.primaryMuscle);
        if (d.category) setEditCategory(d.category);
        if (d.difficulty) setEditDifficulty(d.difficulty);
        if (d.type) setEditType(d.type);
        if (Array.isArray(d.equipment) && d.equipment.length > 0) {
          const matched = EQUIPMENT_OPTIONS.find((eq) => eq.toLowerCase() === d.equipment[0].toLowerCase());
          if (matched) setEditEquipment(matched);
        }
        if (Array.isArray(d.instructions) && d.instructions.length > 0) {
          setEditInstructions(d.instructions.join('\n'));
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
    setEditName(ex.name || '');
    setEditMuscle(ex.primaryMuscle || ex.muscleGroup || 'Chest');
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
    if (!editName.trim()) {
      showWarning('Name Required', 'Please enter an exercise name.');
      return;
    }
    if (!editInstructions.trim()) {
      showWarning('Instructions Required', 'Please provide execution instructions.');
      return;
    }

    try {
      setUpdatingExercise(true);
      triggerHapticFeedback();
      const isGif = editMediaUrl.toLowerCase().includes('.gif');
      const instructionsArr = editInstructions.split('\n').map((s) => s.trim()).filter(Boolean);
      const formTipsArr = editFormTips ? editFormTips.split('\n').map((s) => s.trim()).filter(Boolean) : [];
      const commonMistakesArr = editCommonMistakes ? editCommonMistakes.split('\n').map((s) => s.trim()).filter(Boolean) : [];

      const res = await updateLibraryExercise(exerciseToEdit.id, {
        name: editName.trim(),
        primaryMuscle: editMuscle,
        muscleGroup: editMuscle,
        category: editCategory,
        type: editType || 'Compound',
        difficulty: editDifficulty,
        equipment: [editEquipment],
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

  return (
    <View className="gap-3">
      {/* Header + Add button */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
            Exercise Catalog ({exercises.length})
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
        exercises.map((ex) => {
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

      {/* ── Add Exercise Modal ── */}
      {showAddModal && (
        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-sm md:max-w-md rounded-2xl p-5 border border-input-border dark:border-input-border-dark max-h-[85%]">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                    Add Exercise to Catalog
                  </Text>
                  <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                    Basics, cues, and media preview
                  </Text>
                </View>
                <ModalCloseButton onClose={() => setShowAddModal(false)} />
              </View>

              <ScrollView
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
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. Romanian Deadlift"
                    placeholderTextColor={colors.textMuted}
                    value={addName}
                    onChangeText={setAddName}
                  />
                </View>

                {/* Target Muscle Group */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Target Muscle Group
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

                {/* Equipment & Difficulty */}
                <View className="gap-2">
                  <View>
                    <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                      Equipment
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

                {/* 3. Instructions & Form Guidance */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Execution Instructions * (1 step per line)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark min-h-[70px]"
                    placeholder="1. Position feet shoulder-width apart&#10;2. Lower with control&#10;3. Drive through heels"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={addInstructions}
                    onChangeText={setAddInstructions}
                  />
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
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Edit Exercise Modal ── */}
      {showEditModal && exerciseToEdit && (
        <Modal
          visible={showEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-sm md:max-w-md rounded-2xl p-5 border border-input-border dark:border-input-border-dark max-h-[85%]">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                    Edit Exercise
                  </Text>
                  <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                    Update catalog entry and media demo
                  </Text>
                </View>
                <ModalCloseButton onClose={() => setShowEditModal(false)} />
              </View>

              <ScrollView
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
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="Exercise Name"
                    placeholderTextColor={colors.textMuted}
                    value={editName}
                    onChangeText={setEditName}
                  />
                </View>

                {/* Target Muscle Group */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Target Muscle Group
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

                {/* Equipment & Difficulty */}
                <View className="gap-2">
                  <View>
                    <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                      Equipment
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

                {/* 3. Instructions & Form Guidance */}
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Execution Instructions * (1 step per line)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark min-h-[70px]"
                    placeholder="Describe execution steps..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={editInstructions}
                    onChangeText={setEditInstructions}
                  />
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
              </ScrollView>
            </View>
          </View>
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
