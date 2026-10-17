import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { WorkoutRoutineTemplate, RoutineExercise, RoutineExerciseSet } from './workoutTypes';
import { COMMON_EXERCISES_CATALOG } from '@/data/commonExercises';
import ModalCloseButton from '../ui/ModalCloseButton';
import { getDifficultyStyle } from '@/constants/difficulty';

interface CreateRoutineModalProps {
  visible: boolean;
  onSave: (routine: WorkoutRoutineTemplate) => void;
  onClose: () => void;
}

const CATEGORIES = ['Strength', 'Hypertrophy', 'Conditioning', 'Endurance', 'Custom'];
const DURATIONS = [30, 45, 60, 75, 90];
const DIFFICULTIES: ('Beginner' | 'Intermediate' | 'Advanced')[] = ['Beginner', 'Intermediate', 'Advanced'];
const MUSCLE_FILTERS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

export const isBodyweightExercise = (ex: { type?: string; category?: string; name?: string; defaultSets?: any[] }) => {
  const nameLower = (ex.name || '').toLowerCase();
  const typeLower = (ex.type || '').toLowerCase();
  const catLower = (ex.category || '').toLowerCase();
  return (
    typeLower === 'bodyweight' ||
    typeLower === 'calisthenics' ||
    catLower === 'calisthenics' ||
    nameLower.includes('push-up') ||
    nameLower.includes('pushup') ||
    nameLower.includes('pull-up') ||
    nameLower.includes('pullup') ||
    nameLower.includes('chin-up') ||
    nameLower.includes('chinup') ||
    nameLower.includes('dip') ||
    nameLower.includes('crunch') ||
    nameLower.includes('plank') ||
    nameLower.includes('sit-up') ||
    nameLower.includes('burpee') ||
    nameLower.includes('jumping jack') ||
    (Array.isArray(ex.defaultSets) && ex.defaultSets.some((s: any) => s.bodyweight))
  );
};

export default function CreateRoutineModal({
  visible,
  onSave,
  onClose,
}: CreateRoutineModalProps) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 500;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hypertrophy');
  const [customCategory, setCustomCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [duration, setDuration] = useState(45);
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [expandedExercises, setExpandedExercises] = useState<Record<number, boolean>>({});

  // Inline field-level validation errors
  const [errors, setErrors] = useState<{
    title?: string;
    customCategory?: string;
    exercises?: string;
  }>({});

  // Exercise picker state
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('All');

  const filteredCatalog = useMemo(() => {
    let list = COMMON_EXERCISES_CATALOG;

    if (selectedMuscleFilter !== 'All') {
      const filterLower = selectedMuscleFilter.toLowerCase();
      list = list.filter((e) => {
        const pm = (e.primaryMuscle || e.muscleGroup || '').toLowerCase();
        if (filterLower === 'legs') {
          return (
            pm.includes('leg') ||
            pm.includes('quad') ||
            pm.includes('hamstring') ||
            pm.includes('glute') ||
            pm.includes('calf')
          );
        }
        if (filterLower === 'arms') {
          return (
            pm.includes('arm') ||
            pm.includes('bicep') ||
            pm.includes('tricep') ||
            pm.includes('forearm')
          );
        }
        return pm.includes(filterLower);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.primaryMuscle?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q) ||
          e.muscleGroup?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [searchQuery, selectedMuscleFilter]);

  const toggleExpand = (index: number) => {
    setExpandedExercises((prev) => ({
      ...prev,
      [index]: prev[index] === false ? true : false,
    }));
  };

  const handleAddExercise = (libEx: any) => {
    const isBw = isBodyweightExercise(libEx);

    let baseSetsCount = 3;
    let baseWeight = isBw ? 0 : 25;
    let baseReps = 10;

    if (difficulty === 'Beginner') {
      baseSetsCount = 3;
      baseWeight = isBw ? 0 : 15;
      baseReps = isBw ? 8 : 10;
    } else if (difficulty === 'Advanced') {
      baseSetsCount = 4;
      baseWeight = isBw ? 0 : 40;
      baseReps = isBw ? 12 : 8;
    }

    let defaultSets: RoutineExerciseSet[] = [];
    if (Array.isArray(libEx.defaultSets) && libEx.defaultSets.length > 0) {
      defaultSets = libEx.defaultSets.map((s: any) => ({
        weight: s.weight !== undefined && s.weight !== null ? s.weight : baseWeight,
        reps: s.reps !== undefined && s.reps !== null ? s.reps : baseReps,
        bodyweight: s.bodyweight !== undefined ? Boolean(s.bodyweight) : isBw,
      }));
    } else {
      defaultSets = Array.from({ length: baseSetsCount }, () => ({
        weight: baseWeight,
        reps: baseReps,
        bodyweight: isBw,
      }));
    }

    const newEx: RoutineExercise = {
      exerciseId: libEx.id,
      name: libEx.name,
      category: libEx.category || 'Strength',
      type: libEx.type || 'Compound',
      primaryMuscle: libEx.primaryMuscle || libEx.muscleGroup || 'Chest',
      muscleGroup: libEx.muscleGroup || libEx.primaryMuscle || 'Chest',
      defaultSets,
    };

    setExercises((prev) => [...prev, newEx]);
    if (errors.exercises) {
      setErrors((prev) => ({ ...prev, exercises: undefined }));
    }
  };

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSet = (exerciseIndex: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[exerciseIndex] };
      const lastSet = targetEx.defaultSets[targetEx.defaultSets.length - 1];
      const newSet: RoutineExerciseSet = lastSet
        ? { ...lastSet }
        : { weight: 20, reps: 10, bodyweight: false };
      targetEx.defaultSets = [...targetEx.defaultSets, newSet];
      next[exerciseIndex] = targetEx;
      return next;
    });
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[exerciseIndex] };
      if (targetEx.defaultSets.length <= 1) return prev;
      targetEx.defaultSets = targetEx.defaultSets.filter((_, i) => i !== setIndex);
      next[exerciseIndex] = targetEx;
      return next;
    });
  };

  const handleUpdateSetValue = (
    exerciseIndex: number,
    setIndex: number,
    field: 'weight' | 'reps',
    val: string
  ) => {
    setExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[exerciseIndex] };
      const sets = [...targetEx.defaultSets];
      const numVal = parseInt(val.replace(/[^0-9]/g, ''), 10);
      sets[setIndex] = {
        ...sets[setIndex],
        [field]: isNaN(numVal) ? '' : numVal,
      };
      targetEx.defaultSets = sets;
      next[exerciseIndex] = targetEx;
      return next;
    });
  };

  const handleToggleBodyweight = (exerciseIndex: number, setIndex: number, forceState?: boolean) => {
    setExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[exerciseIndex] };
      const sets = [...targetEx.defaultSets];
      const currentBw = Boolean(sets[setIndex]?.bodyweight);
      const nextBw = forceState !== undefined ? forceState : !currentBw;
      sets[setIndex] = {
        ...sets[setIndex],
        bodyweight: nextBw,
        weight: nextBw ? 0 : (sets[setIndex]?.weight && Number(sets[setIndex]?.weight) > 0 ? sets[setIndex]?.weight : 20),
      };
      targetEx.defaultSets = sets;
      next[exerciseIndex] = targetEx;
      return next;
    });
  };

  const handleStepWeight = (exerciseIndex: number, setIndex: number, delta: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[exerciseIndex] };
      const sets = [...targetEx.defaultSets];
      const curr = Number(sets[setIndex]?.weight) || 0;
      const nextW = Math.max(0, Math.round((curr + delta) * 10) / 10);
      const isBw = isBodyweightExercise(targetEx);
      sets[setIndex] = {
        ...sets[setIndex],
        weight: nextW,
        bodyweight: nextW === 0 && isBw,
      };
      targetEx.defaultSets = sets;
      next[exerciseIndex] = targetEx;
      return next;
    });
  };

  const handleStepReps = (exerciseIndex: number, setIndex: number, delta: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[exerciseIndex] };
      const sets = [...targetEx.defaultSets];
      const curr = Number(sets[setIndex]?.reps) || 10;
      const nextR = Math.max(1, curr + delta);
      sets[setIndex] = {
        ...sets[setIndex],
        reps: nextR,
      };
      targetEx.defaultSets = sets;
      next[exerciseIndex] = targetEx;
      return next;
    });
  };

  const handleSave = () => {
    const newErrors: { title?: string; customCategory?: string; exercises?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Please enter a routine name to save.';
    }

    if (category === 'Custom' && !customCategory.trim()) {
      newErrors.customCategory = 'Please specify your custom category focus.';
    }

    if (exercises.length === 0) {
      newErrors.exercises = 'Add at least one exercise to your routine before saving.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalCategory = category === 'Custom' ? customCategory.trim() : category;

    // Clean up empty set values before saving
    const sanitizedExercises = exercises.map((ex) => ({
      ...ex,
      defaultSets: ex.defaultSets.map((s) => ({
        weight: s.weight === '' || s.weight === undefined ? 0 : Number(s.weight),
        reps: s.reps === '' || s.reps === undefined ? 10 : Number(s.reps),
        bodyweight: Boolean(s.bodyweight),
      })),
    }));

    const newRoutine: WorkoutRoutineTemplate = {
      id: `custom-routine-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      category: finalCategory,
      difficulty,
      estimatedDurationMinutes: duration,
      exercises: sanitizedExercises,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    onSave(newRoutine);
    // Reset state
    setTitle('');
    setDescription('');
    setCategory('Hypertrophy');
    setCustomCategory('');
    setDifficulty('Intermediate');
    setDuration(45);
    setExercises([]);
    setExpandedExercises({});
    setErrors({});
    setShowPicker(false);
    setSearchQuery('');
    setSelectedMuscleFilter('All');
    onClose();
  };

  const handleClose = () => {
    setErrors({});
    setShowPicker(false);
    onClose();
  };

  // Clicking outside / on the backdrop dismisses the keyboard, but NEVER closes the modal
  const handleBackdropPress = () => {
    Keyboard.dismiss();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end md:justify-center md:items-center bg-black/60 p-0 md:p-4"
      >
        <Pressable
          className="absolute inset-0"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={handleBackdropPress}
          accessible={false}
        />

        <View
          style={{
            paddingTop: Platform.OS !== 'web' && insets.top > 0 ? insets.top + 8 : 16,
            paddingBottom: Platform.OS !== 'web' && insets.bottom > 0 ? insets.bottom + 8 : 16,
          }}
          className="bg-background dark:bg-background-dark flex-1 md:flex-none h-full md:h-[90%] w-full md:max-w-xl rounded-none md:rounded-3xl p-4 md:p-6 border-0 md:border border-input-border dark:border-input-border-dark shadow-2xl flex-col"
        >
          {/* Modal Header */}
          <View className="flex-row justify-between items-center pb-3 border-b border-input-border/50 dark:border-input-border-dark/50">
            <View className="flex-1 pr-2 min-w-0">
              <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark tracking-tight" numberOfLines={1}>
                Create Routine Template
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5" numberOfLines={1}>
                Save a custom workout split to your personal library
              </Text>
            </View>
            <ModalCloseButton onClose={handleClose} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" className="flex-1 my-3">
                  {/* Routine Title Input */}
                  <View className="mb-3.5">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
                        Routine Name <Text className="text-danger">*</Text>
                      </Text>
                      {title.length > 0 && (
                        <Text className="text-[10px] text-text-muted">{title.length}/50</Text>
                      )}
                    </View>
                    <View
                      className={`flex-row items-center px-3 rounded-xl bg-input dark:bg-input-dark border ${
                        errors.title
                          ? 'border-danger dark:border-danger-dark'
                          : 'border-input-border dark:border-input-border-dark'
                      }`}
                    >
                      <Ionicons
                        name="barbell-outline"
                        size={16}
                        color={errors.title ? colors.danger : colors.textMuted}
                        style={{ marginRight: 8 }}
                      />
                      <TextInput
                        value={title}
                        maxLength={50}
                        onChangeText={(t) => {
                          setTitle(t);
                          if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                        }}
                        placeholder="e.g. Upper Body Hypertrophy, Legs & Core"
                        placeholderTextColor={colors.textMuted}
                        className="flex-1 py-3 text-text-primary dark:text-text-primary-dark text-sm font-semibold"
                      />
                      {title.length > 0 && (
                        <TouchableOpacity
                          onPress={() => setTitle('')}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                      )}
                    </View>
                    {/* Inline error for Title */}
                    {errors.title && (
                      <View className="flex-row items-center gap-1.5 mt-1.5 px-0.5">
                        <Ionicons name="alert-circle" size={13} color={colors.danger} />
                        <Text className="text-xs font-semibold text-danger dark:text-danger-dark">
                          {errors.title}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Routine Notes / Description Input */}
                  <View className="mb-3.5">
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark uppercase tracking-wider mb-1.5">
                      Notes & Focus <Text className="text-[10px] font-normal text-text-muted">(Optional)</Text>
                    </Text>
                    <TextInput
                      value={description}
                      maxLength={150}
                      multiline
                      numberOfLines={2}
                      onChangeText={setDescription}
                      placeholder="e.g. Focus on deep stretch, 90s rest intervals, progressive overload."
                      placeholderTextColor={colors.textMuted}
                      className="p-3 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark text-text-primary dark:text-text-primary-dark text-xs font-medium leading-5"
                      style={{ minHeight: 56, textAlignVertical: 'top' }}
                    />
                  </View>

                  {/* Category Chips */}
                  <View className="mb-3.5">
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark uppercase tracking-wider mb-1.5">
                      Training Category
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {CATEGORIES.map((cat) => {
                        const isSelected = category === cat;
                        return (
                          <TouchableOpacity
                            key={cat}
                            onPress={() => {
                              setCategory(cat);
                              if (errors.customCategory) {
                                setErrors((prev) => ({ ...prev, customCategory: undefined }));
                              }
                            }}
                            activeOpacity={0.75}
                            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                            className={`min-h-[32px] px-3.5 py-1.5 rounded-full border justify-center items-center ${
                              isSelected
                                ? 'bg-accent/15 dark:bg-accent-dark/25 border-accent'
                                : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                isSelected ? 'text-accent dark:text-accent-dark' : 'text-text-muted'
                              }`}
                            >
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Custom Category Input with inline error if 'Custom' is selected */}
                    {category === 'Custom' && (
                      <View className="mt-2">
                        <TextInput
                          value={customCategory}
                          onChangeText={(t) => {
                            setCustomCategory(t);
                            if (errors.customCategory) {
                              setErrors((prev) => ({ ...prev, customCategory: undefined }));
                            }
                          }}
                          placeholder="Type custom focus (e.g. Mobility, Kettlebell, Core)"
                          placeholderTextColor={colors.textMuted}
                          className={`p-2.5 rounded-xl bg-input dark:bg-input-dark border text-text-primary dark:text-text-primary-dark text-xs font-semibold ${
                            errors.customCategory
                              ? 'border-danger dark:border-danger-dark'
                              : 'border-accent/40'
                          }`}
                        />
                        {errors.customCategory && (
                          <View className="flex-row items-center gap-1.5 mt-1 px-0.5">
                            <Ionicons name="alert-circle" size={13} color={colors.danger} />
                            <Text className="text-xs font-semibold text-danger dark:text-danger-dark">
                              {errors.customCategory}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Difficulty Level */}
                  <View className="mb-3.5">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
                        Difficulty Level
                      </Text>
                      <Text className="text-[10px] text-text-muted">
                        {difficulty === 'Beginner'
                          ? 'Light resistance · High safety'
                          : difficulty === 'Intermediate'
                          ? 'Hypertrophy · Balanced sets'
                          : 'Heavy volume · Progressive overload'}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      {DIFFICULTIES.map((diff) => {
                        const isSelected = difficulty === diff;
                        const diffStyle = getDifficultyStyle(diff);
                        return (
                          <TouchableOpacity
                            key={diff}
                            onPress={() => setDifficulty(diff)}
                            activeOpacity={0.8}
                            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                            className={`flex-1 min-h-[36px] py-1.5 px-2 rounded-xl flex-row items-center justify-center gap-1.5 border ${
                              isSelected
                                ? `${diffStyle.badgeContainer} border-opacity-100`
                                : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                            }`}
                          >
                            <Ionicons
                              name={diffStyle.icon}
                              size={13}
                              color={isSelected ? (isDark ? diffStyle.darkHexColor : diffStyle.hexColor) : colors.textMuted}
                            />
                            <Text
                              className={`text-xs font-bold ${
                                isSelected
                                  ? diffStyle.badgeText
                                  : 'text-text-muted dark:text-text-muted-dark'
                              }`}
                              style={isSelected ? { color: isDark ? diffStyle.darkHexColor : diffStyle.hexColor } : undefined}
                            >
                              {diff}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Estimated Duration */}
                  <View className="mb-4">
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark uppercase tracking-wider mb-1.5">
                      Estimated Duration
                    </Text>
                    <View className="flex-row gap-1.5">
                      {DURATIONS.map((dur) => {
                        const isSelected = duration === dur;
                        return (
                          <TouchableOpacity
                            key={dur}
                            onPress={() => setDuration(dur)}
                            activeOpacity={0.75}
                            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                            className={`flex-1 min-h-[34px] py-1.5 rounded-xl items-center justify-center border ${
                              isSelected
                                ? 'bg-accent/15 dark:bg-accent-dark/25 border-accent'
                                : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                isSelected ? 'text-accent dark:text-accent-dark' : 'text-text-muted'
                              }`}
                            >
                              {dur}m
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Exercises Section Header & Add Button */}
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
                        Routine Exercises ({exercises.length}) <Text className="text-danger">*</Text>
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowPicker(!showPicker)}
                      activeOpacity={0.75}
                      className="flex-row items-center gap-1.5 bg-accent/15 dark:bg-accent-dark/25 min-h-[34px] px-3 py-1.5 rounded-xl"
                    >
                      <Ionicons
                        name={showPicker ? 'chevron-up' : 'add-circle-outline'}
                        size={15}
                        color={colors.accent}
                      />
                      <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                        {showPicker ? 'Close Library' : 'Add Exercise'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Inline Error for Exercises */}
                  {errors.exercises && (
                    <View className="flex-row items-center gap-1.5 mb-2.5 p-2.5 rounded-xl bg-danger/10 dark:bg-danger-dark/15 border border-danger/30">
                      <Ionicons name="alert-circle" size={14} color={colors.danger} />
                      <Text className="text-xs font-semibold text-danger dark:text-danger-dark">
                        {errors.exercises}
                      </Text>
                    </View>
                  )}

                  {/* Full Exercise Library Drawer */}
                  {showPicker && (
                    <View className="p-3 bg-surface dark:bg-surface-dark rounded-2xl border border-input-border dark:border-input-border-dark mb-3.5 shadow-xs">
                      {/* Search Bar */}
                      <View className="flex-row items-center bg-input dark:bg-input-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark mb-2.5">
                        <Ionicons name="search" size={15} color={colors.textMuted} />
                        <TextInput
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          placeholder="Search 80+ exercises by name or muscle..."
                          placeholderTextColor={colors.textMuted}
                          className="flex-1 ml-2 text-xs text-text-primary dark:text-text-primary-dark font-medium"
                        />
                        {searchQuery ? (
                          <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                          </TouchableOpacity>
                        ) : null}
                      </View>

                      {/* Muscle Group Filter Chips */}
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-2.5"
                        contentContainerStyle={{ gap: 6, alignItems: 'center' }}
                      >
                        {MUSCLE_FILTERS.map((filter) => {
                          const isActive = selectedMuscleFilter === filter;
                          return (
                            <TouchableOpacity
                              key={filter}
                              onPress={() => setSelectedMuscleFilter(filter)}
                              activeOpacity={0.75}
                              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                              className={`min-h-[32px] px-3.5 py-1.5 rounded-full border justify-center items-center ${
                                isActive
                                  ? 'bg-accent/20 border-accent'
                                  : 'bg-input dark:bg-input-dark border-input-border/70 dark:border-input-border-dark/70'
                              }`}
                            >
                              <Text
                                className={`text-xs font-bold ${
                                  isActive ? 'text-accent dark:text-accent-dark' : 'text-text-muted'
                                }`}
                              >
                                {filter}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>

                      {/* Library Exercise Count Indicator */}
                      <View className="flex-row justify-between items-center px-1 mb-1.5">
                        <Text className="text-[10px] font-semibold text-text-muted dark:text-text-muted-dark">
                          Showing {filteredCatalog.length} exercises
                        </Text>
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                          Tap (+) to add to routine
                        </Text>
                      </View>

                      {/* Scrollable Catalog of All Exercises */}
                      <ScrollView
                        style={{ maxHeight: 290 }}
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={{ paddingBottom: 10 }}
                      >
                        {filteredCatalog.length === 0 ? (
                          <View className="py-6 items-center justify-center">
                            <Ionicons name="search-outline" size={20} color={colors.textMuted} />
                            <Text className="text-xs text-text-muted mt-1 font-medium">
                              No exercises match "{searchQuery}"
                            </Text>
                          </View>
                        ) : (
                          filteredCatalog.map((ex) => {
                            const alreadyAddedCount = exercises.filter(
                              (e) => e.exerciseId === ex.id
                            ).length;
                            return (
                              <TouchableOpacity
                                key={ex.id}
                                onPress={() => handleAddExercise(ex)}
                                activeOpacity={0.75}
                                className="py-2.5 px-2.5 border-b border-input-border/30 dark:border-input-border-dark/30 flex-row justify-between items-center"
                              >
                                <View className="flex-1 mr-2">
                                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                                    {ex.name}
                                  </Text>
                                  <Text className="text-[10px] text-text-muted mt-0.5">
                                    {ex.primaryMuscle || ex.muscleGroup} · {ex.category || 'Strength'}
                                  </Text>
                                </View>
                                <View className="flex-row items-center gap-1.5">
                                  {alreadyAddedCount > 0 && (
                                    <View className="px-1.5 py-0.5 rounded-md bg-accent/15 border border-accent/25">
                                      <Text className="text-[9px] font-bold text-accent">
                                        ×{alreadyAddedCount}
                                      </Text>
                                    </View>
                                  )}
                                  <Ionicons name="add-circle" size={20} color={colors.accent} />
                                </View>
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </ScrollView>
                    </View>
                  )}

                  {/* Added Exercises List */}
                  {exercises.length === 0 ? (
                    <View
                      className={`p-4 rounded-2xl bg-input dark:bg-input-dark items-center justify-center border border-dashed ${
                        errors.exercises
                          ? 'border-danger dark:border-danger-dark'
                          : 'border-input-border dark:border-input-border-dark'
                      }`}
                    >
                      <Ionicons
                        name="barbell-outline"
                        size={22}
                        color={errors.exercises ? colors.danger : colors.textMuted}
                      />
                      <Text
                        className={`text-xs mt-1 font-medium ${
                          errors.exercises ? 'text-danger font-bold' : 'text-text-muted'
                        }`}
                      >
                        No exercises added yet. Tap "+ Add Exercise" above.
                      </Text>
                    </View>
                  ) : (
                    exercises.map((ex, idx) => {
                      const isExpanded = expandedExercises[idx] !== false;
                      const isBwExercise = isBodyweightExercise(ex);

                      return (
                        <View
                          key={idx}
                          className="p-4 rounded-2xl mb-3.5 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark shadow-xs"
                        >
                          {/* 1. Exercise Card Header matching TodayWorkoutTab */}
                          <View className="flex-row items-start justify-between gap-3">
                            <TouchableOpacity
                              onPress={() => toggleExpand(idx)}
                              activeOpacity={0.7}
                              className="flex-1 min-w-0"
                            >
                              <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 items-center justify-center shrink-0">
                                  <Text className="text-xs font-black text-accent">{idx + 1}</Text>
                                </View>

                                <View className="flex-1 min-w-0">
                                  <Text
                                    numberOfLines={1}
                                    className="text-base font-black text-text-primary dark:text-text-primary-dark tracking-tight leading-snug"
                                  >
                                    {ex.name}
                                  </Text>
                                  <View className="flex-row items-center gap-2 mt-1.5 flex-wrap">
                                    <View className="px-2.5 py-0.5 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark shrink-0">
                                      <Text className="text-[10px] font-extrabold uppercase tracking-wider text-accent dark:text-accent-dark">
                                        {ex.primaryMuscle || ex.muscleGroup}
                                      </Text>
                                    </View>

                                    {isBwExercise && (
                                      <View className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 shrink-0">
                                        <Text className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                          Bodyweight
                                        </Text>
                                      </View>
                                    )}

                                    <Text className="text-xs text-text-muted dark:text-text-muted-dark font-medium">
                                      {ex.defaultSets.length} {ex.defaultSets.length === 1 ? 'set' : 'sets'}
                                    </Text>
                                  </View>
                                </View>

                                <Ionicons
                                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                  size={16}
                                  color={colors.textMuted}
                                />
                              </View>
                            </TouchableOpacity>

                            {/* Remove Exercise Action matching TodayWorkoutTab */}
                            <TouchableOpacity
                              onPress={() => handleRemoveExercise(idx)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              className="w-8 h-8 rounded-full bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark active:opacity-60 shrink-0 mt-0.5"
                              activeOpacity={0.7}
                              accessibilityRole="button"
                              accessibilityLabel={`Remove ${ex.name}`}
                            >
                              <Ionicons name="close" size={15} color={colors.danger} />
                            </TouchableOpacity>
                          </View>

                          {/* 2. Sets Configuration Table matching TodayWorkoutTab */}
                          {isExpanded && (
                            <View className="mt-3.5 pt-3 border-t border-input-border/50 dark:border-input-border-dark/50">
                              {/* Column Headers */}
                              <View className="mb-2.5 flex-row items-center gap-2 px-1 w-full">
                                <Text className="w-8 text-center text-[10px] font-extrabold text-text-muted dark:text-text-muted-dark uppercase tracking-wider shrink-0">
                                  Set
                                </Text>
                                <Text
                                  numberOfLines={1}
                                  className="flex-1 min-w-0 text-center text-[10px] font-extrabold text-text-muted dark:text-text-muted-dark uppercase tracking-wider"
                                >
                                  {isBwExercise ? 'Weight' : 'Weight (kg)'}
                                </Text>
                                <Text
                                  numberOfLines={1}
                                  className="flex-1 min-w-0 text-center text-[10px] font-extrabold text-text-muted dark:text-text-muted-dark uppercase tracking-wider"
                                >
                                  Reps
                                </Text>
                                {ex.defaultSets.length > 1 ? (
                                  <View className="w-7 shrink-0" />
                                ) : null}
                              </View>

                              {/* Sets List */}
                              <View className="gap-2.5">
                                {ex.defaultSets.map((set, sIdx) => {
                                  const currWeight = Number(set.weight) || 0;
                                  const isSetBodyweight = Boolean(set.bodyweight || (isBwExercise && currWeight === 0));

                                  return (
                                    <View
                                      key={sIdx}
                                      className="flex-row items-center gap-2 w-full"
                                    >
                                      {/* Set Number Badge */}
                                      <View className="w-8 h-10 items-center justify-center rounded-xl bg-input dark:bg-input-dark shrink-0">
                                        <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                                          {sIdx + 1}
                                        </Text>
                                      </View>

                                      {/* Weight / Bodyweight Stepper Column */}
                                      {isSetBodyweight && currWeight === 0 ? (
                                        <View className="flex-1 min-w-0 h-10 flex-row items-center justify-between rounded-xl bg-accent/10 dark:bg-accent-dark/15 border border-accent/30 dark:border-accent-dark/30 px-2 overflow-hidden">
                                          <View className="flex-row items-center justify-center flex-1 min-w-0 gap-1">
                                            <Ionicons name="body" size={12} color={colors.accent} />
                                            <Text
                                              numberOfLines={1}
                                              ellipsizeMode="tail"
                                              adjustsFontSizeToFit
                                              minimumFontScale={0.75}
                                              className="text-[11px] font-bold text-accent dark:text-accent-dark shrink min-w-0 text-center"
                                              accessibilityLabel="Bodyweight"
                                            >
                                              {isCompact ? 'BW' : 'Bodyweight'}
                                            </Text>
                                          </View>
                                          <TouchableOpacity
                                            onPress={() => handleStepWeight(idx, sIdx, 2.5)}
                                            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                                            className="w-6 h-6 rounded-lg bg-accent/20 dark:bg-accent-dark/30 items-center justify-center active:opacity-70 shrink-0 ml-1"
                                            accessibilityLabel="Add weight"
                                          >
                                            <Ionicons name="add" size={13} color={colors.accent} />
                                          </TouchableOpacity>
                                        </View>
                                      ) : (
                                        <View className="flex-1 min-w-0 h-10 flex-row items-center justify-between rounded-xl border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark overflow-hidden">
                                          <TouchableOpacity
                                            onPress={() => handleStepWeight(idx, sIdx, -2.5)}
                                            className="w-7 h-full items-center justify-center active:bg-input-border/20 shrink-0"
                                            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                                            accessibilityRole="button"
                                            accessibilityLabel="Decrease weight"
                                          >
                                            <Ionicons name="remove" size={14} color={colors.textPrimary} />
                                          </TouchableOpacity>

                                          <View className="flex-1 min-w-0 h-full items-center justify-center px-0.5">
                                            <TextInput
                                              value={set.weight !== undefined && set.weight !== null ? String(set.weight) : ''}
                                              onChangeText={(val) => handleUpdateSetValue(idx, sIdx, 'weight', val)}
                                              keyboardType="numeric"
                                              placeholder="0"
                                              placeholderTextColor={colors.textMuted}
                                              className="text-xs font-bold text-center text-text-primary dark:text-text-primary-dark w-full p-0"
                                            />
                                          </View>

                                          <TouchableOpacity
                                            onPress={() => handleStepWeight(idx, sIdx, 2.5)}
                                            className="w-7 h-full items-center justify-center active:bg-input-border/20 shrink-0"
                                            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                                            accessibilityRole="button"
                                            accessibilityLabel="Increase weight"
                                          >
                                            <Ionicons name="add" size={14} color={colors.textPrimary} />
                                          </TouchableOpacity>
                                        </View>
                                      )}

                                      {/* Reps Stepper Column */}
                                      <View className="flex-1 min-w-0 h-10 flex-row items-center justify-between rounded-xl border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark overflow-hidden">
                                        <TouchableOpacity
                                          onPress={() => handleStepReps(idx, sIdx, -1)}
                                          className="w-7 h-full items-center justify-center active:bg-input-border/20 shrink-0"
                                          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                                          accessibilityRole="button"
                                          accessibilityLabel="Decrease reps"
                                        >
                                          <Ionicons name="remove" size={14} color={colors.textPrimary} />
                                        </TouchableOpacity>

                                        <View className="flex-1 min-w-0 h-full items-center justify-center px-0.5">
                                          <TextInput
                                            value={set.reps !== undefined && set.reps !== null ? String(set.reps) : ''}
                                            onChangeText={(val) => handleUpdateSetValue(idx, sIdx, 'reps', val)}
                                            keyboardType="numeric"
                                            placeholder="10"
                                            placeholderTextColor={colors.textMuted}
                                            className="text-xs font-bold text-center text-text-primary dark:text-text-primary-dark w-full p-0"
                                          />
                                        </View>

                                        <TouchableOpacity
                                          onPress={() => handleStepReps(idx, sIdx, 1)}
                                          className="w-7 h-full items-center justify-center active:bg-input-border/20 shrink-0"
                                          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                                          accessibilityRole="button"
                                          accessibilityLabel="Increase reps"
                                        >
                                          <Ionicons name="add" size={14} color={colors.textPrimary} />
                                        </TouchableOpacity>
                                      </View>

                                      {/* Delete Set Button matching TodayWorkoutTab */}
                                      {ex.defaultSets.length > 1 ? (
                                        <View className="w-7 h-10 items-center justify-center shrink-0">
                                          <TouchableOpacity
                                            onPress={() => handleRemoveSet(idx, sIdx)}
                                            className="w-7 h-10 items-center justify-center active:opacity-60"
                                            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                            accessibilityLabel="Delete set"
                                          >
                                            <Ionicons name="close" size={15} color={colors.textMuted} />
                                          </TouchableOpacity>
                                        </View>
                                      ) : null}
                                    </View>
                                  );
                                })}
                              </View>

                              {/* Add Set CTA Button matching ExerciseCard */}
                              <TouchableOpacity
                                onPress={() => handleAddSet(idx)}
                                activeOpacity={0.8}
                                className="mt-2 py-3 rounded-xl bg-input/70 dark:bg-input-dark/70 border border-dashed border-input-border dark:border-input-border-dark items-center justify-center flex-row gap-1.5"
                              >
                                <Ionicons name="add" size={15} color={colors.accent} />
                                <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                                  Add Set
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}
                </ScrollView>

                {/* Save Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSave}
                  className="bg-accent dark:bg-accent-dark min-h-[48px] py-3.5 rounded-2xl items-center justify-center shadow-sm active:opacity-85"
                >
                  <Text className="text-accent-contrast dark:text-accent-contrast-dark text-sm font-black tracking-wide">
                    Save Routine Template
                  </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
