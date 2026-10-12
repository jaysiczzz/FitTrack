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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { WorkoutRoutineTemplate, RoutineExercise } from './workoutTypes';
import { COMMON_EXERCISES_CATALOG } from '@/data/commonExercises';
import ModalErrorBanner from '../ui/ModalErrorBanner';
import ModalCloseButton from '../ui/ModalCloseButton';

interface CreateRoutineModalProps {
  visible: boolean;
  onSave: (routine: WorkoutRoutineTemplate) => void;
  onClose: () => void;
}

const CATEGORIES = ['Strength', 'Hypertrophy', 'Conditioning', 'Endurance', 'Custom'];
const DURATIONS = [30, 45, 60, 75];

export default function CreateRoutineModal({
  visible,
  onSave,
  onClose,
}: CreateRoutineModalProps) {
  const { colors } = useThemeColors();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hypertrophy');
  const [customCategory, setCustomCategory] = useState('');
  const [duration, setDuration] = useState(45);
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Exercise picker state
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return COMMON_EXERCISES_CATALOG.slice(0, 15);
    const q = searchQuery.toLowerCase();
    return COMMON_EXERCISES_CATALOG.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.primaryMuscle?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [searchQuery]);

  const handleAddExercise = (libEx: any) => {
    const defaultSets = (libEx.defaultSets || [
      { weight: 20, reps: 10 },
      { weight: 20, reps: 10 },
      { weight: 20, reps: 10 },
    ]).map((s: any) => ({
      weight: s.weight !== undefined ? s.weight : 20,
      reps: s.reps !== undefined ? s.reps : 10,
      bodyweight: Boolean(s.bodyweight),
    }));

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
    setShowPicker(false);
    setSearchQuery('');
    setErrorMessage(null);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!title.trim()) {
      setErrorMessage('Please enter a routine name to save.');
      return;
    }
    if (category === 'Custom' && !customCategory.trim()) {
      setErrorMessage('Please enter a name for your custom category.');
      return;
    }
    if (exercises.length === 0) {
      setErrorMessage('Please add at least one exercise to your routine.');
      return;
    }

    const finalCategory = category === 'Custom' ? customCategory.trim() : category;

    const newRoutine: WorkoutRoutineTemplate = {
      id: `custom-routine-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      category: finalCategory,
      estimatedDurationMinutes: duration,
      exercises,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    onSave(newRoutine);
    // Reset state
    setTitle('');
    setDescription('');
    setCategory('Hypertrophy');
    setCustomCategory('');
    setDuration(45);
    setExercises([]);
    setErrorMessage(null);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/60 justify-end md:justify-center items-center p-0 md:p-4"
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="flex-1 w-full justify-end md:justify-center items-center">
            <TouchableWithoutFeedback>
              <View className="w-full md:max-w-lg bg-background dark:bg-background-dark rounded-t-3xl md:rounded-3xl p-5 pb-8 md:pb-5 max-h-[90%] border-t md:border border-input-border dark:border-input-border-dark">
                {/* Modal Header */}
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark tracking-tight">
                      Create Routine Template
                    </Text>
                    <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                      Save a reusable workout for your weekly split
                    </Text>
                  </View>
                  <ModalCloseButton onClose={onClose} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                  {/* Inline Error Notification Banner */}
                  <ModalErrorBanner
                    error={errorMessage}
                    onDismiss={() => setErrorMessage(null)}
                    className="mb-3"
                  />

                  {/* Routine Title */}
                  <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-1.5">
                    Routine Name
                  </Text>
                  <TextInput
                    value={title}
                    onChangeText={(t) => {
                      setTitle(t);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="e.g. Arms & Shoulders Hypertrophy"
                    placeholderTextColor={colors.textMuted}
                    className="p-3 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark text-text-primary dark:text-text-primary-dark text-sm font-semibold mb-3"
                  />

                  {/* Category Chips */}
                  <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-1.5">
                    Category Focus
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5 mb-2.5">
                    {CATEGORIES.map((cat) => {
                      const isSelected = category === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => {
                            setCategory(cat);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          activeOpacity={0.75}
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                          className={`min-h-[30px] px-2.5 py-1 rounded-lg border justify-center items-center ${
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

                  {/* Custom Category Input if 'Custom' is selected */}
                  {category === 'Custom' && (
                    <View className="mb-3">
                      <TextInput
                        value={customCategory}
                        onChangeText={(t) => {
                          setCustomCategory(t);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="Type custom focus (e.g. Mobility, Kettlebell, Core)"
                        placeholderTextColor={colors.textMuted}
                        className="p-2.5 rounded-xl bg-input dark:bg-input-dark border border-accent/40 text-text-primary dark:text-text-primary-dark text-xs font-semibold"
                      />
                    </View>
                  )}

                  {/* Estimated Duration */}
                  <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-1.5">
                    Estimated Duration
                  </Text>
                  <View className="flex-row gap-1.5 mb-3.5">
                    {DURATIONS.map((dur) => {
                      const isSelected = duration === dur;
                      return (
                        <TouchableOpacity
                          key={dur}
                          onPress={() => setDuration(dur)}
                          activeOpacity={0.75}
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                          className={`flex-1 min-h-[30px] py-1.5 rounded-lg items-center justify-center border ${
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

                  {/* Exercises Header & List */}
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
                      Routine Exercises ({exercises.length})
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowPicker(!showPicker)}
                      activeOpacity={0.75}
                      className="flex-row items-center gap-1.5 bg-accent/15 dark:bg-accent-dark/25 min-h-[36px] px-3 py-1.5 rounded-xl active:opacity-75"
                    >
                      <Ionicons name={showPicker ? 'chevron-up' : 'add'} size={15} color={colors.accent} />
                      <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                        {showPicker ? 'Hide Library' : 'Add Exercise'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Search Picker Drawer */}
                  {showPicker && (
                    <View className="p-3 bg-input/60 dark:bg-input-dark/60 rounded-2xl border border-input-border dark:border-input-border-dark mb-3">
                      <View className="flex-row items-center bg-background dark:bg-background-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark mb-2">
                        <Ionicons name="search" size={16} color={colors.textMuted} />
                        <TextInput
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          placeholder="Search exercises by name or muscle..."
                          placeholderTextColor={colors.textMuted}
                          className="flex-1 ml-2 text-xs text-text-primary dark:text-text-primary-dark font-medium"
                        />
                        {searchQuery ? (
                          <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                          </TouchableOpacity>
                        ) : null}
                      </View>

                      <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                        {filteredCatalog.map((ex) => (
                          <TouchableOpacity
                            key={ex.id}
                            onPress={() => handleAddExercise(ex)}
                            className="py-2 px-2.5 border-b border-input-border/30 dark:border-input-border-dark/30 flex-row justify-between items-center"
                          >
                            <View>
                              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                                {ex.name}
                              </Text>
                              <Text className="text-[10px] text-text-muted">
                                {ex.primaryMuscle || ex.muscleGroup} · {ex.category}
                              </Text>
                            </View>
                            <Ionicons name="add-circle" size={18} color={colors.accent} />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Added Exercises List */}
                  {exercises.length === 0 ? (
                    <View className="p-4 rounded-2xl bg-input dark:bg-input-dark items-center justify-center border border-dashed border-input-border dark:border-input-border-dark">
                      <Ionicons name="barbell-outline" size={24} color={colors.textMuted} />
                      <Text className="text-xs text-text-muted mt-1 font-medium">
                        No exercises added yet. Tap "+ Add Exercise" above.
                      </Text>
                    </View>
                  ) : (
                    exercises.map((ex, idx) => (
                      <View
                        key={idx}
                        className="p-3 rounded-2xl mb-2 bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark flex-row justify-between items-center"
                      >
                        <View className="flex-row items-center gap-2 flex-1 mr-2">
                          <View className="w-6 h-6 rounded-full bg-accent/20 items-center justify-center">
                            <Text className="text-[10px] font-black text-accent">{idx + 1}</Text>
                          </View>
                          <View className="flex-1">
                            <Text numberOfLines={1} className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                              {ex.name}
                            </Text>
                            <Text className="text-[10px] text-text-muted">
                              {ex.defaultSets.length} sets · {ex.muscleGroup || ex.category}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveExercise(idx)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          className="min-h-[44px] min-w-[44px] items-center justify-center"
                          accessibilityLabel="Remove exercise"
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    ))
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
