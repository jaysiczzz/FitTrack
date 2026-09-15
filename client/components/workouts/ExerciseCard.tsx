import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import SurfaceCard from '../ui/SurfaceCard';

export type SetRow = {
  id: string;
  setNumber?: number;
  weight?: string | number | null;
  reps?: string | number | null;
  duration?: string | number | null;
  distance?: string | number | null;
  bodyweight?: boolean;
  done?: boolean;
};

interface ExerciseCardProps {
  exerciseId?: string;
  name: string;
  category?: string;
  difficulty?: string;
  primaryMuscle?: string;
  secondaryMuscles?: string[];
  equipment?: string;
  type?: string;
  recommendedSets?: number;
  recommendedReps?: number;
  recommendedRest?: number;
  sets: SetRow[];
  onToggleSet: (setId: string) => void;
  onUpdateSet?: (setId: string, field: 'weight' | 'reps', newValue: number) => void;
  onAddSet?: () => void;
  onDeleteSet?: (setId: string) => void;
  onRemoveExercise?: () => void;
  onViewDetails?: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  name,
  category = 'Strength',
  difficulty = 'Intermediate',
  primaryMuscle = 'Chest',
  secondaryMuscles,
  equipment = 'Barbell',
  type = 'Compound',
  recommendedSets = 3,
  recommendedReps = 10,
  recommendedRest = 90,
  sets,
  onToggleSet,
  onUpdateSet,
  onAddSet,
  onDeleteSet,
  onRemoveExercise,
  onViewDetails,
}) => {
  const { colors } = useThemeColors();
  const isCardio = type.toLowerCase() === 'cardio';
  const isBodyweight = type.toLowerCase() === 'bodyweight' || type.toLowerCase() === 'calisthenics';
  const isStretch = type.toLowerCase() === 'stretch' || type.toLowerCase() === 'mobility';

  return (
    <SurfaceCard className="mb-3.5">
      {/* Top Header: Exercise Name & Badges */}
      <View className="mb-2.5 flex-row items-start justify-between">
        <TouchableOpacity
          activeOpacity={onViewDetails ? 0.7 : 1}
          onPress={onViewDetails}
          className="flex-1 pr-2"
        >
          <Text className="text-base font-bold text-text-primary dark:text-text-primary-dark mb-1">
            {name}
          </Text>

          {/* Muscle Group & Equipment Info */}
          <Text className="text-xs text-text-muted dark:text-text-muted-dark">
            <Text className="font-semibold text-text-primary dark:text-text-primary-dark">{primaryMuscle}</Text>
            {secondaryMuscles && secondaryMuscles.length > 0
              ? ` (${secondaryMuscles.join(', ')})`
              : ''}
            {equipment ? ` · ${equipment}` : ''}
          </Text>
        </TouchableOpacity>

        {/* Action Controls & Remove Button */}
        <View className="flex-row items-center gap-1.5">
          <View className="rounded-lg border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark px-2 py-0.5">
            <Text className="text-[10px] font-semibold text-text-muted dark:text-text-muted-dark capitalize">
              {difficulty}
            </Text>
          </View>

          {onRemoveExercise ? (
            <TouchableOpacity
              onPress={onRemoveExercise}
              className="w-7 h-7 rounded-full bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark ml-0.5"
              activeOpacity={0.7}
              accessibilityLabel={`Remove ${name}`}
            >
              <Ionicons name="close" size={16} color={colors.danger} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Target Prescriptions Bar */}
      <View className="mb-3 rounded-xl bg-input dark:bg-input-dark p-2.5 border border-input-border dark:border-input-border-dark flex-row items-center justify-between flex-wrap gap-1">
        <View className="flex-row items-center gap-1">
          <Text className="text-[11px] font-medium text-text-muted dark:text-text-muted-dark">
            Target:
          </Text>
          <Text className="text-[11px] font-semibold text-text-primary dark:text-text-primary-dark">
            {recommendedSets} sets × {recommendedReps} reps
          </Text>
        </View>

        {recommendedRest ? (
          <View className="flex-row items-center gap-1">
            <Text className="text-[11px] font-medium text-text-muted dark:text-text-muted-dark">
              Rest:
            </Text>
            <Text className="text-[11px] font-semibold text-text-primary dark:text-text-primary-dark">
              {recommendedRest}s
            </Text>
          </View>
        ) : null}

        {onViewDetails ? (
          <TouchableOpacity
            onPress={onViewDetails}
            activeOpacity={0.7}
            className="bg-surface dark:bg-surface-dark px-2 py-0.5 rounded-md border border-input-border dark:border-input-border-dark"
          >
            <Text className="text-[10px] font-semibold text-accent dark:text-accent-dark">
              Guide & Tips
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Sets Table Header */}
      <View>
        <View className="mb-2 flex-row justify-between px-1">
          <Text className="w-10 text-center text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
            Set
          </Text>

          {!isCardio && !isStretch && !isBodyweight && (
            <Text className="flex-1 text-center text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
              Weight (kg)
            </Text>
          )}

          {!isCardio && !isStretch && (
            <Text className="flex-1 text-center text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
              Reps
            </Text>
          )}

          {(isCardio || isStretch) && (
            <Text className="flex-1 text-center text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
              Duration
            </Text>
          )}

          <Text className="w-20 text-center text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
            Status
          </Text>
        </View>

        {/* Dynamic Set Rows */}
        {sets.map((s, idx) => {
          const displaySetNumber = s.setNumber || idx + 1;
          const currWeight = Number(s.weight) || 0;
          const currReps = Number(s.reps) || 10;

          return (
            <View key={s.id || idx} className="mb-2 flex-row items-center">
              {/* SET Number */}
              <View className="w-10 h-9 items-center justify-center rounded-xl bg-input dark:bg-input-dark mr-1.5">
                <Text className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">
                  {displaySetNumber}
                </Text>
              </View>

              {/* Weight Stepper Column */}
              {!isCardio && !isStretch && !isBodyweight && (
                <View className="flex-1 flex-row items-center justify-between rounded-xl border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark px-1.5 py-1 mr-1.5 h-9">
                  <TouchableOpacity
                    onPress={() => onUpdateSet && onUpdateSet(s.id, 'weight', Math.max(0, currWeight - 2.5))}
                    className="w-6 h-6 rounded-md bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">-</Text>
                  </TouchableOpacity>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {s.bodyweight ? 'BW' : `${currWeight}kg`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onUpdateSet && onUpdateSet(s.id, 'weight', currWeight + 2.5)}
                    className="w-6 h-6 rounded-md bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">+</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Reps Stepper Column */}
              {!isCardio && !isStretch && (
                <View className="flex-1 flex-row items-center justify-between rounded-xl border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark px-1.5 py-1 mr-1.5 h-9">
                  <TouchableOpacity
                    onPress={() => onUpdateSet && onUpdateSet(s.id, 'reps', Math.max(1, currReps - 1))}
                    className="w-6 h-6 rounded-md bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">-</Text>
                  </TouchableOpacity>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {currReps}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onUpdateSet && onUpdateSet(s.id, 'reps', currReps + 1)}
                    className="w-6 h-6 rounded-md bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">+</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Duration Column */}
              {(isCardio || isStretch) && (
                <View className="flex-1 items-center justify-center rounded-xl border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark h-9 mr-1.5">
                  <Text className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">
                    {s.duration ? `${s.duration}s` : '60s'}
                  </Text>
                </View>
              )}

              {/* Interactive "Done" Button & Delete Set Button */}
              <View className="flex-row items-center gap-1 w-20">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onToggleSet(s.id)}
                  className={`h-9 flex-1 items-center justify-center rounded-xl border ${
                    s.done
                      ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
                      : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                  }`}
                >
                  <Text
                    className={
                      s.done
                        ? 'font-bold text-white dark:text-background-dark text-xs'
                        : 'font-semibold text-text-muted dark:text-text-muted-dark text-xs'
                    }
                  >
                    {s.done ? 'Done' : 'Mark'}
                  </Text>
                </TouchableOpacity>

                {onDeleteSet && sets.length > 1 ? (
                  <TouchableOpacity
                    onPress={() => onDeleteSet(s.id)}
                    className="w-6 h-9 items-center justify-center rounded-lg bg-input dark:bg-input-dark"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })}

        {/* Add Set Button */}
        {onAddSet ? (
          <TouchableOpacity
            onPress={onAddSet}
            activeOpacity={0.8}
            className="mt-1 py-2 rounded-xl bg-input dark:bg-input-dark border border-dashed border-input-border dark:border-input-border-dark items-center justify-center flex-row"
          >
            <Text className="text-xs font-semibold text-accent dark:text-accent-dark">
              + Add Set
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SurfaceCard>
  );
};

export default ExerciseCard;
