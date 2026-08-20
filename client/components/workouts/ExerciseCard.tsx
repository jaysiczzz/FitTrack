import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

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
  const isCardio = type.toLowerCase() === 'cardio';
  const isBodyweight = type.toLowerCase() === 'bodyweight' || type.toLowerCase() === 'calisthenics';
  const isStretch = type.toLowerCase() === 'stretch' || type.toLowerCase() === 'mobility';

  return (
    <View className="mb-4 rounded-2xl border border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark p-4 shadow-sm">
      {/* Top Header: Exercise Name & Badges */}
      <View className="mb-2.5 flex-row items-start justify-between">
        <TouchableOpacity
          activeOpacity={onViewDetails ? 0.7 : 1}
          onPress={onViewDetails}
          className="flex-1 pr-2"
        >
          <View className="flex-row items-center gap-2 mb-1 flex-wrap">
            <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
              {name}
            </Text>
          </View>

          {/* Muscle Group & Equipment Info */}
          <Text className="text-xs font-medium text-text-muted dark:text-text-muted-dark">
            💪 <Text className="font-bold text-text-primary dark:text-text-primary-dark">{primaryMuscle}</Text>
            {secondaryMuscles && secondaryMuscles.length > 0
              ? ` (${secondaryMuscles.join(', ')})`
              : ''}
          </Text>

          {equipment ? (
            <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
              🛠️ Equipment: <Text className="font-semibold text-text-primary dark:text-text-primary-dark">{equipment}</Text>
            </Text>
          ) : null}
        </TouchableOpacity>

        {/* Action Controls & Remove Button */}
        <View className="flex-row items-center gap-x-1.5">
          <View
            className={`rounded-lg border px-2 py-0.5 ${
              (difficulty || '').toLowerCase() === 'beginner'
                ? 'bg-emerald-500/15 border-emerald-500/40'
                : (difficulty || '').toLowerCase() === 'advanced'
                ? 'bg-rose-500/15 border-rose-500/40'
                : 'bg-amber-500/15 border-amber-500/40'
            }`}
          >
            <Text
              className={`text-[10px] font-extrabold uppercase ${
                (difficulty || '').toLowerCase() === 'beginner'
                  ? 'text-emerald-400'
                  : (difficulty || '').toLowerCase() === 'advanced'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {difficulty}
            </Text>
          </View>
          <View className="rounded-lg border border-input-border/70 dark:border-input-border-dark/70 bg-input dark:bg-input-dark px-2 py-0.5">
            <Text className="text-[10px] font-bold text-accent dark:text-accent-dark uppercase">
              {type}
            </Text>
          </View>

          {onRemoveExercise ? (
            <TouchableOpacity
              onPress={onRemoveExercise}
              className="w-7 h-7 rounded-full bg-red-500/10 items-center justify-center border border-red-500/20 ml-1"
              activeOpacity={0.7}
            >
              <Text className="text-red-500 text-xs font-bold">✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Recommended Target Prescriptions Bar */}
      <View className="mb-3 rounded-xl bg-input/60 dark:bg-input-dark/60 p-2.5 border border-input-border/50 dark:border-input-border-dark/50 flex-row items-center justify-between flex-wrap gap-1">
        <View className="flex-row items-center gap-1">
          <Text className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark">
            🎯 Target:
          </Text>
          <Text className="text-[11px] font-bold text-accent dark:text-accent-dark">
            {recommendedSets} sets × {recommendedReps} reps
          </Text>
        </View>

        {recommendedRest ? (
          <View className="flex-row items-center gap-1">
            <Text className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark">
              ⏱️ Rest:
            </Text>
            <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
              {recommendedRest}s
            </Text>
          </View>
        ) : null}

        {onViewDetails ? (
          <TouchableOpacity
            onPress={onViewDetails}
            activeOpacity={0.7}
            className="flex-row items-center gap-1 bg-accent/15 dark:bg-accent-dark/20 px-2 py-0.5 rounded-lg border border-accent/30"
          >
            <Text className="text-[10px] font-extrabold text-accent dark:text-accent-dark">
              📖 Guide & Tips ℹ️
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Novice Friendly Guidance Banner */}
      <View className="mb-3 p-2 rounded-xl bg-accent/10 dark:bg-accent/15 border border-accent/20 flex-row items-center">
        <Text className="text-[11px] font-medium text-text-primary dark:text-text-primary-dark flex-1">
          💡 <Text className="font-bold text-accent">Novice Tip:</Text> Pre-filled numbers are safe targets! Use <Text className="font-extrabold text-accent">-</Text> or <Text className="font-extrabold text-accent">+</Text> below anytime to adjust weights or reps to match your strength.
        </Text>
      </View>

      {/* Dynamic Sets Table Header */}
      <View>
        <View className="mb-2 flex-row justify-between px-1">
          <Text className="w-12 text-center text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
            Set
          </Text>

          {!isCardio && !isStretch && !isBodyweight && (
            <Text className="flex-1 text-center text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
              Weight (kg)
            </Text>
          )}

          {!isCardio && !isStretch && (
            <Text className="flex-1 text-center text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
              Reps
            </Text>
          )}

          {(isCardio || isStretch) && (
            <Text className="flex-1 text-center text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
              Duration
            </Text>
          )}

          <Text className="w-24 text-center text-[11px] font-bold text-accent dark:text-accent-dark uppercase tracking-wider">
            Action
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
              <View className="w-12 h-10 items-center justify-center rounded-xl border border-input-border/60 dark:border-input-border-dark/60 bg-input dark:bg-input-dark mr-1">
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                  {displaySetNumber}
                </Text>
              </View>

              {/* Weight Stepper Column */}
              {!isCardio && !isStretch && !isBodyweight && (
                <View className="flex-1 flex-row items-center justify-between rounded-xl border border-input-border/60 dark:border-input-border-dark/60 bg-input dark:bg-input-dark px-1 py-1 mr-1 h-10">
                  <TouchableOpacity
                    onPress={() => onUpdateSet && onUpdateSet(s.id, 'weight', Math.max(0, currWeight - 2.5))}
                    className="w-6 h-7 rounded-lg bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-extrabold text-accent dark:text-accent-dark">-</Text>
                  </TouchableOpacity>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {s.bodyweight ? 'BW' : `${currWeight}kg`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onUpdateSet && onUpdateSet(s.id, 'weight', currWeight + 2.5)}
                    className="w-6 h-7 rounded-lg bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-extrabold text-accent dark:text-accent-dark">+</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Reps Stepper Column */}
              {!isCardio && !isStretch && (
                <View className="flex-1 flex-row items-center justify-between rounded-xl border border-input-border/60 dark:border-input-border-dark/60 bg-input dark:bg-input-dark px-1 py-1 mr-1 h-10">
                  <TouchableOpacity
                    onPress={() => onUpdateSet && onUpdateSet(s.id, 'reps', Math.max(1, currReps - 1))}
                    className="w-6 h-7 rounded-lg bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-extrabold text-accent dark:text-accent-dark">-</Text>
                  </TouchableOpacity>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {currReps}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onUpdateSet && onUpdateSet(s.id, 'reps', currReps + 1)}
                    className="w-6 h-7 rounded-lg bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs font-extrabold text-accent dark:text-accent-dark">+</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Duration Column */}
              {(isCardio || isStretch) && (
                <View className="flex-1 items-center justify-center rounded-xl border border-input-border/60 dark:border-input-border-dark/60 bg-input dark:bg-input-dark h-10 mr-1">
                  <Text className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">
                    {s.duration ? `${s.duration}s` : '60s'}
                  </Text>
                </View>
              )}

              {/* Interactive "Done" Button & Delete Set Button */}
              <View className="flex-row items-center gap-1 w-24">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onToggleSet(s.id)}
                  className={`h-10 flex-1 items-center justify-center rounded-xl transition-all ${
                    s.done
                      ? 'bg-accent dark:bg-accent-dark border-2 border-accent dark:border-accent-dark shadow-sm'
                      : 'bg-accent/10 dark:bg-accent-dark/15 border-2 border-accent/60 dark:border-accent-dark/60'
                  }`}
                >
                  <Text
                    className={
                      s.done
                        ? 'font-extrabold text-background dark:text-background-dark text-xs'
                        : 'font-extrabold text-accent dark:text-accent-dark text-[11px]'
                    }
                  >
                    {s.done ? '✓ Done' : '+ Done'}
                  </Text>
                </TouchableOpacity>

                {onDeleteSet && sets.length > 1 ? (
                  <TouchableOpacity
                    onPress={() => onDeleteSet(s.id)}
                    className="w-6 h-10 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20"
                    activeOpacity={0.7}
                  >
                    <Text className="text-red-400 font-bold text-xs">✕</Text>
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
            className="mt-2 py-2.5 rounded-xl bg-input dark:bg-input-dark border border-dashed border-accent/40 items-center justify-center flex-row gap-1.5"
          >
            <Text className="text-xs font-extrabold text-accent dark:text-accent-dark">
              + Add Another Set
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

export default ExerciseCard;
