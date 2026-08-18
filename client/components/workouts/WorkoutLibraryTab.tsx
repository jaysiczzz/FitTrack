import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { MOCK_LIBRARY, LibraryExercise } from './mockData';
import { getWorkoutLibrary } from '../../api/workout';
import { ExerciseDetailsModal } from './ExerciseDetailsModal';

interface WorkoutLibraryTabProps {
  onAddExercise: (exercise: LibraryExercise) => void;
}

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Glutes', 'Full Body'];
const DIFFICULTY_LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const WorkoutLibraryTab: React.FC<WorkoutLibraryTabProps> = ({ onAddExercise }) => {
  const [exercises, setExercises] = useState<LibraryExercise[]>(MOCK_LIBRARY);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [addedCounts, setAddedCounts] = useState<Record<string, number>>({});

  // Details Modal State
  const [selectedDetailsExercise, setSelectedDetailsExercise] = useState<LibraryExercise | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchLibrary = async () => {
    try {
      if (exercises.length === 0) setLoading(true);
      const res = await getWorkoutLibrary({});
      if (res.exercises && res.exercises.length > 0) {
        setExercises(res.exercises);
      }
    } catch (err) {
      console.log('Failed to fetch library exercises from API, using cached templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesName = ex.name.toLowerCase().includes(q);
        const matchesCategory = (ex.category || '').toLowerCase().includes(q);
        const matchesMuscle = (ex.primaryMuscle || ex.muscleGroup || '').toLowerCase().includes(q);
        const matchesTags = Array.isArray(ex.tags) && ex.tags.some((t: string) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesCategory && !matchesMuscle && !matchesTags) return false;
      }

      if (selectedMuscle && selectedMuscle !== 'All') {
        const targetM = selectedMuscle.toLowerCase();
        const primaryM = (ex.primaryMuscle || ex.muscleGroup || '').toLowerCase();
        const groupM = (ex.muscleGroup || '').toLowerCase();
        if (!primaryM.includes(targetM) && !groupM.includes(targetM)) return false;
      }

      if (selectedDifficulty && selectedDifficulty !== 'All') {
        if ((ex.difficulty || '').toLowerCase() !== selectedDifficulty.toLowerCase()) return false;
      }

      return true;
    });
  }, [exercises, searchQuery, selectedMuscle, selectedDifficulty]);

  const handleAdd = (ex: LibraryExercise) => {
    setAddedCounts((prev) => ({
      ...prev,
      [ex.id]: (prev[ex.id] || 0) + 1,
    }));
    onAddExercise(ex);
  };

  const handleOpenDetails = (ex: LibraryExercise) => {
    setSelectedDetailsExercise(ex);
    setShowDetailsModal(true);
  };

  return (
    <View className="mt-1">
      {/* Top Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
          Exercise Library ({filteredExercises.length})
        </Text>
      </View>

      {/* Search Input */}
      <View className="mb-3.5 flex-row items-center bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-3.5 py-3 rounded-2xl">
        <Text className="text-base mr-2">🔍</Text>
        <TextInput
          className="flex-1 text-text-primary dark:text-text-primary-dark text-sm font-medium"
          placeholder="Search exercises, muscles, tags..."
          placeholderTextColor="#8A93A6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text className="text-text-muted text-xs font-bold px-1">✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Muscle Group Filter Badges */}
      <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1.5 uppercase tracking-wide">
        Muscle Group
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3 flex-row"
        contentContainerStyle={{ paddingRight: 10 }}
      >
        {MUSCLE_GROUPS.map((group) => {
          const active = selectedMuscle === group;
          return (
            <TouchableOpacity
              key={group}
              activeOpacity={0.8}
              onPress={() => setSelectedMuscle(group)}
              className={`mr-2 px-3.5 py-1.5 rounded-xl border ${
                active
                  ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
                  : 'bg-surface dark:bg-surface-dark border-input-border dark:border-input-border-dark'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  active
                    ? 'text-background dark:text-background-dark'
                    : 'text-text-primary dark:text-text-primary-dark'
                }`}
              >
                {group}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Difficulty Filter Badges */}
      <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1.5 uppercase tracking-wide">
        Difficulty Level
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4 flex-row"
        contentContainerStyle={{ paddingRight: 10 }}
      >
        {DIFFICULTY_LEVELS.map((diff) => {
          const active = selectedDifficulty === diff;
          return (
            <TouchableOpacity
              key={diff}
              activeOpacity={0.8}
              onPress={() => setSelectedDifficulty(diff)}
              className={`mr-2 px-3 py-1 rounded-lg border ${
                active
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
              }`}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  active
                    ? 'text-accent dark:text-accent-dark'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                {diff}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Loading Indicator */}
      {loading ? (
        <View className="py-8 items-center">
          <ActivityIndicator size="small" color="#00E5A0" />
          <Text className="text-xs text-text-muted mt-2">Loading exercises...</Text>
        </View>
      ) : filteredExercises.length === 0 ? (
        <View className="rounded-2xl border border-input-border dark:border-input-border-dark p-6 items-center my-4 bg-surface/50">
          <Text className="text-2xl mb-2">🔍</Text>
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
            No exercises match your filter
          </Text>
          <Text className="text-text-muted text-xs mt-1 text-center">
            Try clearing your search query or selecting "All" muscle groups.
          </Text>
        </View>
      ) : (
        filteredExercises.map((ex) => {
          const count = addedCounts[ex.id] || 0;
          const eqStr = Array.isArray(ex.equipment) ? ex.equipment.join(', ') : ex.equipment || 'No Equipment';

          return (
            <View
              key={ex.id}
              className="mb-3 rounded-2xl border border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark p-4 shadow-sm"
            >
              {/* Top Row: Info & Thumbnail */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                      {ex.name}
                    </Text>
                    {ex.difficulty ? (
                      <View
                        className={`px-2 py-0.5 rounded-md border ${
                          (ex.difficulty || '').toLowerCase() === 'beginner'
                            ? 'bg-emerald-500/15 border-emerald-500/40'
                            : (ex.difficulty || '').toLowerCase() === 'advanced'
                            ? 'bg-rose-500/15 border-rose-500/40'
                            : 'bg-amber-500/15 border-amber-500/40'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-extrabold uppercase ${
                            (ex.difficulty || '').toLowerCase() === 'beginner'
                              ? 'text-emerald-400'
                              : (ex.difficulty || '').toLowerCase() === 'advanced'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {ex.difficulty}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-1">
                    {ex.category} • {ex.primaryMuscle || ex.muscleGroup}
                  </Text>

                  <Text className="text-[11px] text-text-muted">
                    🛠️ {eqStr}
                  </Text>
                </View>

                {/* Optional Thumbnail */}
                {ex.thumbnailUrl || ex.imageUrl ? (
                  <Image
                    source={{ uri: ex.thumbnailUrl || ex.imageUrl || '' }}
                    className="w-14 h-14 rounded-xl bg-input dark:bg-input-dark"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center">
                    <Text className="text-lg">🏋️</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons Row */}
              <View className="flex-row items-center justify-between pt-2.5 border-t border-input-border/60 dark:border-input-border-dark/60">
                <TouchableOpacity
                  onPress={() => handleOpenDetails(ex)}
                  className="px-3 py-1.5 rounded-lg bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
                >
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    View Details
                  </Text>
                </TouchableOpacity>

                {count > 0 ? (
                  <View className="flex-row items-center gap-2">
                    <View className="px-2.5 py-1.5 rounded-xl bg-accent/15 border border-accent/40">
                      <Text className="text-xs font-extrabold text-accent dark:text-accent-dark">
                        ✓ Added ({count}x)
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleAdd(ex)}
                      className="px-3 py-1.5 rounded-xl bg-accent dark:bg-accent-dark border border-accent dark:border-accent-dark"
                    >
                      <Text className="text-xs font-extrabold text-background dark:text-background-dark">
                        + Add Again
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleAdd(ex)}
                    className="px-3.5 py-1.5 rounded-xl bg-accent dark:bg-accent-dark border border-accent dark:border-accent-dark flex-row items-center"
                  >
                    <Text className="text-xs font-extrabold text-background dark:text-background-dark">
                      + Add to Today
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}

      {/* Details View Modal */}
      <ExerciseDetailsModal
        visible={showDetailsModal}
        exercise={selectedDetailsExercise}
        onClose={() => setShowDetailsModal(false)}
        onAddExercise={(ex) => handleAdd(ex)}
      />
    </View>
  );
};

export default WorkoutLibraryTab;
