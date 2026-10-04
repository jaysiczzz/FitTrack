import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LibraryExercise } from './workoutTypes';
import { COMMON_EXERCISES_CATALOG } from '../../data/commonExercises';
import { getWorkoutLibrary } from '../../api/workout';
import { ExerciseDetailsModal } from './ExerciseDetailsModal';
import ExerciseVisual from './ExerciseVisual';
import { useThemeColors } from '@/constants/colors';
import FilterChip from '../ui/FilterChip';
import DifficultySelectorPill from './DifficultySelectorPill';

interface WorkoutLibraryTabProps {
  onAddExercise: (exercise: LibraryExercise) => void;
}

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Glutes', 'Full Body', 'Cardio'];
const DIFFICULTY_LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const EXERCISE_CACHE_KEY = 'fittrack_exercise_library_cache_v3';

const WorkoutLibraryTab: React.FC<WorkoutLibraryTabProps> = ({ onAddExercise }) => {
  const { colors } = useThemeColors();
  const [exercises, setExercises] = useState<LibraryExercise[]>(COMMON_EXERCISES_CATALOG);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  // Details Modal State
  const [selectedDetailsExercise, setSelectedDetailsExercise] = useState<LibraryExercise | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchLibrary = async () => {
    try {
      const localMap = new Map(COMMON_EXERCISES_CATALOG.map((c) => [c.name.toLowerCase(), c]));
      const enrichWithCatalog = (items: LibraryExercise[]): LibraryExercise[] =>
        items.map((item) => {
          const local = localMap.get((item.name || '').toLowerCase());
          return {
            ...item,
            gifUrl: item.gifUrl || local?.gifUrl || null,
            recommendedTempo: item.recommendedTempo || local?.recommendedTempo || '2-0-1-0',
          };
        });

      // 1. Read cached exercises from local device storage
      const cached = await AsyncStorage.getItem(EXERCISE_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setExercises(enrichWithCatalog(parsed));
          }
        } catch {}
      }

      // 2. Fetch fresh library from backend API
      const res = await getWorkoutLibrary({});
      if (res.exercises && res.exercises.length > 0) {
        const dbNames = new Set(res.exercises.map((e: any) => (e.name || '').toLowerCase()));
        const uniqueLocal = COMMON_EXERCISES_CATALOG.filter((c) => !dbNames.has(c.name.toLowerCase()));
        const merged = enrichWithCatalog([...res.exercises, ...uniqueLocal]);
        setExercises(merged);
        await AsyncStorage.setItem(EXERCISE_CACHE_KEY, JSON.stringify(merged));
      }
    } catch (err) {
      console.log('[Exercise Library] Offline mode - using local catalog & cache');
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
        const catM = (ex.category || '').toLowerCase();
        if (!primaryM.includes(targetM) && !groupM.includes(targetM) && !catM.includes(targetM)) return false;
      }

      if (selectedDifficulty && selectedDifficulty !== 'All') {
        if ((ex.difficulty || '').toLowerCase() !== selectedDifficulty.toLowerCase()) return false;
      }

      return true;
    });
  }, [exercises, searchQuery, selectedMuscle, selectedDifficulty]);

  const handleAdd = (ex: LibraryExercise) => {
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

      {/* Row 1: Search Input + Difficulty Selector Pill Inline */}
      <View className="flex-row items-center gap-2 mb-2.5">
        <View className="flex-1 flex-row items-center bg-input dark:bg-input-dark rounded-xl border border-input-border dark:border-input-border-dark px-3 min-h-[34px] py-1">
          <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
          <TextInput
            className="flex-1 py-2 text-xs text-text-primary dark:text-text-primary-dark font-medium"
            placeholder="Search exercises, muscles, tags..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <DifficultySelectorPill
          selectedDifficulty={selectedDifficulty}
          onSelectDifficulty={setSelectedDifficulty}
          compact
        />
      </View>

      {/* Row 2: Muscle Group Filter Chips (Horizontal Scroll matching Nutrition Library) */}
      <View className="relative mb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
          contentContainerStyle={{ paddingRight: 20, alignItems: 'center' }}
        >
          {MUSCLE_GROUPS.map((group) => (
            <FilterChip
              key={group}
              label={group}
              selected={selectedMuscle === group}
              onPress={() => setSelectedMuscle(group)}
              className="mr-1.5"
            />
          ))}
        </ScrollView>
      </View>

      {/* Loading Indicator */}
      {loading ? (
        <View className="py-8 items-center">
          <ActivityIndicator size="small" color={colors.accent} />
          <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">Loading exercises...</Text>
        </View>
      ) : filteredExercises.length === 0 ? (
        <View className="rounded-2xl border border-input-border dark:border-input-border-dark p-6 items-center my-4 bg-surface/50 dark:bg-surface-dark/50">
          <Ionicons name="search" size={26} color={colors.textMuted} style={{ marginBottom: 8 }} />
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
            No exercises match your filter
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-1 text-center">
            Try clearing your search query or selecting "All" muscle groups.
          </Text>
        </View>
      ) : (
        filteredExercises.map((ex) => {
          const eqStr = Array.isArray(ex.equipment) ? ex.equipment.join(', ') : ex.equipment || 'No Equipment';

          return (
            <View
              key={ex.id}
              className="mb-3 rounded-2xl border border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark p-4"
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
                        className={`px-2.5 py-0.5 rounded-full border ${
                          (ex.difficulty || '').toLowerCase() === 'beginner'
                            ? 'bg-emerald-500/15 border-emerald-500/30'
                            : (ex.difficulty || '').toLowerCase() === 'advanced'
                            ? 'bg-purple-500/15 border-purple-500/30'
                            : 'bg-sky-500/15 border-sky-500/30'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            (ex.difficulty || '').toLowerCase() === 'beginner'
                              ? 'text-accent dark:text-accent-dark'
                              : (ex.difficulty || '').toLowerCase() === 'advanced'
                              ? 'text-purple-400'
                              : 'text-sky-400'
                          }`}
                        >
                          {ex.difficulty}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View className="flex-row items-center gap-1.5 mb-1.5 flex-wrap">
                    <View className="px-2 py-0.5 rounded-md bg-accent/15 border border-accent/30 flex-row items-center gap-1">
                      <Ionicons name="body-outline" size={11} color={colors.accent} />
                      <Text className="text-[10px] font-black text-accent dark:text-accent-dark uppercase">
                        HITS: {ex.primaryMuscle || ex.muscleGroup}
                      </Text>
                    </View>
                    {ex.secondaryMuscles && (Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles.length > 0 : !!ex.secondaryMuscles) ? (
                      <View className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/25 flex-row items-center gap-1">
                        <Text className="text-[10px] font-medium text-sky-500 dark:text-sky-400" numberOfLines={1}>
                          + {Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles.join(', ') : ex.secondaryMuscles}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-1">
                    {ex.category} • {ex.bodyPart || 'Upper Body'} • {eqStr}
                  </Text>

                  {ex.startingPosition ? (
                    <Text numberOfLines={1} className="text-[11px] text-text-muted dark:text-text-muted-dark mb-1 italic">
                      <Text className="font-semibold text-text-primary dark:text-text-primary-dark">Setup: </Text>
                      {ex.startingPosition}
                    </Text>
                  ) : null}
                </View>

                {/* Muscle Group & Movement Avatar */}
                <ExerciseVisual
                  name={ex.name}
                  muscle={ex.primaryMuscle || ex.muscleGroup}
                  category={ex.category}
                  equipment={ex.equipment}
                  imageUrl={ex.imageUrl}
                  thumbnailUrl={ex.thumbnailUrl}
                  size="lg"
                />
              </View>

              {/* Action Buttons Row */}
              <View className="flex-row items-center justify-between pt-2.5 border-t border-input-border/60 dark:border-input-border-dark/60">
                <TouchableOpacity
                  onPress={() => handleOpenDetails(ex)}
                  className="px-3 py-2 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark flex-row items-center gap-1.5"
                >
                  <Ionicons name="body-outline" size={13} color={colors.accent} />
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    Anatomy & Form Guide
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleAdd(ex)}
                  className="px-3.5 py-2 rounded-xl bg-accent dark:bg-accent-dark flex-row items-center gap-1.5 shadow-xs"
                >
                  <Ionicons name="add" size={14} color={colors.accentContrast} />
                  <Text className="text-xs font-bold text-accent-contrast dark:text-accent-contrast-dark">
                    Add to Today
                  </Text>
                </TouchableOpacity>
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
