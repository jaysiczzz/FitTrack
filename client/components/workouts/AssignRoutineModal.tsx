import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { WorkoutRoutineTemplate, DayOfWeek } from './workoutTypes';
import SurfaceCard from '../ui/SurfaceCard';

interface AssignRoutineModalProps {
  visible: boolean;
  day: { key?: DayOfWeek | string; label: string; full: string } | null;
  currentRoutineId: string | null;
  routines: WorkoutRoutineTemplate[];
  onSelect: (routineId: string | null) => void;
  onClose: () => void;
  onCreateNew?: () => void;
}

export default function AssignRoutineModal({
  visible,
  day,
  currentRoutineId,
  routines,
  onSelect,
  onClose,
  onCreateNew,
}: AssignRoutineModalProps) {
  const { colors } = useThemeColors();

  if (!visible || !day) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableWithoutFeedback>
            <View className="bg-background dark:bg-background-dark rounded-t-3xl p-5 max-h-[85%] border-t border-input-border dark:border-input-border-dark">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark tracking-tight">
                    Schedule for {day.full}
                  </Text>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                    Select a routine or set as a rest day
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-input dark:bg-input-dark items-center justify-center"
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
                {/* Option 1: Rest & Recovery Day */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    onSelect(null);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl mb-3 border flex-row items-center justify-between ${
                    currentRoutineId === null
                      ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent/60'
                      : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center">
                      <Ionicons name="leaf-outline" size={20} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark">
                        Rest & Recovery Day
                      </Text>
                      <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
                        No scheduled workout · Focus on recovery & mobility
                      </Text>
                    </View>
                  </View>
                  {currentRoutineId === null && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>

                {/* Section: Routine Templates */}
                <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-2 mt-2">
                  Available Workout Routines ({routines.length})
                </Text>

                {routines.map((routine) => {
                  const isSelected = currentRoutineId === routine.id;
                  return (
                    <TouchableOpacity
                      key={routine.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        onSelect(routine.id);
                        onClose();
                      }}
                      className={`p-4 rounded-2xl mb-2.5 border flex-row items-center justify-between ${
                        isSelected
                          ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent/60'
                          : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                      }`}
                    >
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark">
                            {routine.title}
                          </Text>
                          {routine.isCustom && (
                            <View className="bg-accent/20 px-1.5 py-0.5 rounded-md">
                              <Text className="text-[9px] font-bold text-accent dark:text-accent-dark">
                                Custom
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                          {routine.exercises.length} Exercises · ~{routine.estimatedDurationMinutes} min · {routine.category}
                        </Text>
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                      ) : (
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Option to create custom routine */}
                {onCreateNew ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      onClose();
                      onCreateNew();
                    }}
                    className="p-3.5 rounded-2xl mt-1 border border-dashed border-accent/60 dark:border-accent-dark/60 items-center flex-row justify-center gap-1.5"
                  >
                    <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
                    <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                      Create New Routine Template
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
