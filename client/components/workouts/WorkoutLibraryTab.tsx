import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MOCK_LIBRARY, LibraryExercise } from './mockData';
import { getWorkoutLibrary } from '@/api/workout';

interface WorkoutLibraryTabProps {
  onAddExercise: (exercise: LibraryExercise) => void;
}

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

const WorkoutLibraryTab: React.FC<WorkoutLibraryTabProps> = ({ onAddExercise }) => {
  const [exercises, setExercises] = useState<LibraryExercise[]>(MOCK_LIBRARY);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    const fetchLibrary = async () => {
      try {
        setLoading(true);
        const res = await getWorkoutLibrary();
        if (res.exercises && res.exercises.length > 0 && isMounted) {
          setExercises(res.exercises);
        }
      } catch (err) {
        console.log('Failed to fetch library exercises from API, using default templates');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLibrary();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch =
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscle = selectedMuscle === 'All' || ex.muscleGroup === selectedMuscle;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchQuery, selectedMuscle]);

  const handleAdd = (ex: LibraryExercise) => {
    setAddedIds((prev) => new Set(prev).add(ex.id));
    onAddExercise(ex);
  };

  return (
    <View className="mt-1">
      {/* Search Input */}
      <View className="mb-3.5 flex-row items-center bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-3.5 py-3 rounded-2xl">
        <Text className="text-base mr-2">🔍</Text>
        <TextInput
          className="flex-1 text-text-primary dark:text-text-primary-dark text-sm font-medium"
          placeholder="Search exercises or muscle groups..."
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4 flex-row"
        contentContainerStyle={{ paddingRight: 10 }}
      >
        {MUSCLE_GROUPS.map((group) => {
          const active = selectedMuscle === group;
          return (
            <TouchableOpacity
              key={group}
              activeOpacity={0.8}
              onPress={() => setSelectedMuscle(group)}
              className={`mr-2 px-3.5 py-2 rounded-xl border ${
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

      {/* Exercises Count Header */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
          Available Templates ({filteredExercises.length})
        </Text>
      </View>

      {/* Exercise Cards */}
      {filteredExercises.length === 0 ? (
        <View className="rounded-2xl border border-input-border dark:border-input-border-dark p-6 items-center my-4 bg-surface/50">
          <Text className="text-2xl mb-2">🔍</Text>
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
            No exercises found
          </Text>
          <Text className="text-text-muted text-xs mt-1">Try adjusting your search or category filter</Text>
        </View>
      ) : (
        filteredExercises.map((ex) => {
          const isAdded = addedIds.has(ex.id);
          return (
            <View
              key={ex.id}
              className="mb-3 rounded-2xl border border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark p-4 flex-row items-center justify-between"
            >
              <View className="flex-1 pr-3">
                <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                  {ex.name}
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                  {ex.category}
                </Text>
                <View className="mt-2 flex-row gap-x-2">
                  <View className="rounded-md bg-input dark:bg-input-dark border border-input-border/60 dark:border-input-border-dark/60 px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                      {ex.type}
                    </Text>
                  </View>
                  <View className="rounded-md bg-input dark:bg-input-dark border border-input-border/60 dark:border-input-border-dark/60 px-2 py-0.5">
                    <Text className="text-[10px] font-medium text-text-muted">
                      {ex.defaultSets.length} Sets
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleAdd(ex)}
                className={`px-3.5 py-2.5 rounded-xl border flex-row items-center ${
                  isAdded
                    ? 'bg-accent/15 border-accent/40'
                    : 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
                }`}
              >
                <Text
                  className={`text-xs font-extrabold ${
                    isAdded ? 'text-accent dark:text-accent-dark' : 'text-background dark:text-background-dark'
                  }`}
                >
                  {isAdded ? '✓ Added' : '+ Add to Today'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );
};

export default WorkoutLibraryTab;
