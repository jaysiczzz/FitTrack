import React, { useState, useEffect } from 'react';
import { Modal, View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LibraryExercise } from './mockData';
import { createLibraryExercise, updateLibraryExercise } from '../../api/workout';
import { useToast } from '../../context/ToastContext';

interface AdminExerciseModalProps {
  visible: boolean;
  exerciseToEdit?: LibraryExercise | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const AdminExerciseModal: React.FC<AdminExerciseModalProps> = ({
  visible,
  exerciseToEdit,
  onClose,
  onSaveSuccess,
}) => {
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Strength');
  const [type, setType] = useState('Compound');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [primaryMuscle, setPrimaryMuscle] = useState('Chest');
  const [description, setDescription] = useState('');
  const [instructionsText, setInstructionsText] = useState('');
  const [equipmentText, setEquipmentText] = useState('');
  const [secondaryText, setSecondaryText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [recommendedSets, setRecommendedSets] = useState('3');
  const [recommendedReps, setRecommendedReps] = useState('10');
  const [recommendedRest, setRecommendedRest] = useState('60');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (exerciseToEdit) {
      setName(exerciseToEdit.name || '');
      setCategory(exerciseToEdit.category || 'Strength');
      setType(exerciseToEdit.type || 'Compound');
      setDifficulty(exerciseToEdit.difficulty || 'Intermediate');
      setPrimaryMuscle(exerciseToEdit.primaryMuscle || exerciseToEdit.muscleGroup || 'Chest');
      setDescription(exerciseToEdit.description || '');
      setInstructionsText(
        Array.isArray(exerciseToEdit.instructions)
          ? exerciseToEdit.instructions.join('\n')
          : ''
      );
      setEquipmentText(
        Array.isArray(exerciseToEdit.equipment)
          ? exerciseToEdit.equipment.join(', ')
          : ''
      );
      setSecondaryText(
        Array.isArray(exerciseToEdit.secondaryMuscles)
          ? exerciseToEdit.secondaryMuscles.join(', ')
          : ''
      );
      setTagsText(
        Array.isArray(exerciseToEdit.tags) ? exerciseToEdit.tags.join(', ') : ''
      );
      setRecommendedSets(String(exerciseToEdit.recommendedSets || 3));
      setRecommendedReps(String(exerciseToEdit.recommendedReps || 10));
      setRecommendedRest(String(exerciseToEdit.recommendedRest || 60));
    } else {
      setName('');
      setCategory('Strength');
      setType('Compound');
      setDifficulty('Intermediate');
      setPrimaryMuscle('Chest');
      setDescription('');
      setInstructionsText('');
      setEquipmentText('Barbell');
      setSecondaryText('');
      setTagsText('');
      setRecommendedSets('3');
      setRecommendedReps('10');
      setRecommendedRest('60');
    }
    setErrorMsg('');
  }, [exerciseToEdit, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg('Exercise Name is required.');
      return;
    }
    if (!category) {
      setErrorMsg('Category is required.');
      return;
    }
    if (!type) {
      setErrorMsg('Exercise Type is required.');
      return;
    }
    if (!difficulty) {
      setErrorMsg('Difficulty Level is required.');
      return;
    }
    if (!primaryMuscle) {
      setErrorMsg('Primary Muscle Group is required.');
      return;
    }
    const instructions = instructionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (instructions.length === 0) {
      setErrorMsg('At least one instruction step is required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const payload = {
      name: name.trim(),
      category,
      type,
      difficulty,
      primaryMuscle,
      muscleGroup: primaryMuscle,
      description: description.trim(),
      instructions,
      equipment: equipmentText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      secondaryMuscles: secondaryText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      tags: tagsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      recommendedSets: parseInt(recommendedSets, 10) || 3,
      recommendedReps: parseInt(recommendedReps, 10) || 10,
      recommendedRest: parseInt(recommendedRest, 10) || 60,
    };

    try {
      if (exerciseToEdit?.id) {
        await updateLibraryExercise(exerciseToEdit.id, payload);
        showSuccess('Exercise Updated', `Successfully updated "${payload.name}"`);
      } else {
        await createLibraryExercise(payload);
        showSuccess('Exercise Created', `Added "${payload.name}" to exercise library`);
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save exercise.');
      showError('Failed to Save Exercise', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-background dark:bg-background-dark rounded-t-3xl h-[88%] border-t border-input-border dark:border-input-border-dark overflow-hidden">
          {/* Header */}
          <View className="px-5 py-4 flex-row items-center justify-between border-b border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark">
            <Text className="text-lg font-extrabold text-text-primary dark:text-text-primary-dark">
              {exerciseToEdit ? 'Edit Exercise' : 'Create New Exercise'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-text-muted font-bold text-sm">Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
            {errorMsg ? (
              <View className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <Text className="text-xs font-bold text-red-500">{errorMsg}</Text>
              </View>
            ) : null}

            {/* Name */}
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
              Exercise Name *
            </Text>
            <TextInput
              className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl mb-3 border border-input-border dark:border-input-border-dark text-sm"
              placeholder="e.g. Incline Dumbbell Press"
              placeholderTextColor="#8E8E93"
              value={name}
              onChangeText={setName}
            />

            {/* Description */}
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
              Description
            </Text>
            <TextInput
              className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl mb-3 border border-input-border dark:border-input-border-dark text-sm"
              placeholder="Short exercise overview..."
              placeholderTextColor="#8E8E93"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* Row: Category & Type */}
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
                  Category *
                </Text>
                <TextInput
                  className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark text-sm"
                  placeholder="Strength, Cardio..."
                  placeholderTextColor="#8E8E93"
                  value={category}
                  onChangeText={setCategory}
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
                  Exercise Type *
                </Text>
                <TextInput
                  className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark text-sm"
                  placeholder="Compound, Isolation..."
                  placeholderTextColor="#8E8E93"
                  value={type}
                  onChangeText={setType}
                />
              </View>
            </View>

            {/* Row: Difficulty & Primary Muscle */}
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
                  Difficulty *
                </Text>
                <TextInput
                  className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark text-sm"
                  placeholder="Beginner, Intermediate..."
                  placeholderTextColor="#8E8E93"
                  value={difficulty}
                  onChangeText={setDifficulty}
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
                  Primary Muscle *
                </Text>
                <TextInput
                  className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark text-sm"
                  placeholder="Chest, Back, Legs..."
                  placeholderTextColor="#8E8E93"
                  value={primaryMuscle}
                  onChangeText={setPrimaryMuscle}
                />
              </View>
            </View>

            {/* Secondary Muscles & Equipment */}
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
              Secondary Muscles (comma separated)
            </Text>
            <TextInput
              className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl mb-3 border border-input-border dark:border-input-border-dark text-sm"
              placeholder="Triceps, Shoulders"
              placeholderTextColor="#8E8E93"
              value={secondaryText}
              onChangeText={setSecondaryText}
            />

            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
              Required Equipment (comma separated)
            </Text>
            <TextInput
              className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl mb-3 border border-input-border dark:border-input-border-dark text-sm"
              placeholder="Barbell, Bench"
              placeholderTextColor="#8E8E93"
              value={equipmentText}
              onChangeText={setEquipmentText}
            />

            {/* Instructions */}
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
              Step-by-Step Instructions (one per line) *
            </Text>
            <TextInput
              className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl mb-3 border border-input-border dark:border-input-border-dark text-sm h-24"
              placeholder="1. Grip the bar shoulder width...&#10;2. Lower to chest...&#10;3. Press up..."
              placeholderTextColor="#8E8E93"
              value={instructionsText}
              onChangeText={setInstructionsText}
              multiline
            />

            {/* Prescriptions */}
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
                  Default Sets
                </Text>
                <TextInput
                  className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark text-sm"
                  placeholder="3"
                  keyboardType="numeric"
                  value={recommendedSets}
                  onChangeText={setRecommendedSets}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
                  Default Reps
                </Text>
                <TextInput
                  className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark text-sm"
                  placeholder="10"
                  keyboardType="numeric"
                  value={recommendedReps}
                  onChangeText={setRecommendedReps}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
                  Rest (sec)
                </Text>
                <TextInput
                  className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark text-sm"
                  placeholder="60"
                  keyboardType="numeric"
                  value={recommendedRest}
                  onChangeText={setRecommendedRest}
                />
              </View>
            </View>

            {/* Tags */}
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
              Tags (comma separated)
            </Text>
            <TextInput
              className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl mb-4 border border-input-border dark:border-input-border-dark text-sm"
              placeholder="chest, push, barbell, strength"
              placeholderTextColor="#8E8E93"
              value={tagsText}
              onChangeText={setTagsText}
            />
          </ScrollView>

          {/* Action Button */}
          <View className="p-4 border-t border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark">
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              className="bg-accent dark:bg-accent-dark py-3.5 rounded-xl items-center"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#101828" />
              ) : (
                <Text className="text-background dark:text-background-dark font-extrabold text-sm">
                  {exerciseToEdit ? 'Save Changes' : 'Create Exercise'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
