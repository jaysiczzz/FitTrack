import React from 'react';
import { View, Text, Pressable, TouchableOpacity } from 'react-native';

export type SetRow = {
  id: string;
  weight?: string;
  reps?: string;
  bodyweight?: boolean;
  done?: boolean;
};

interface ExerciseCardProps {
  name: string;
  category?: string;
  type?: string;
  sets: SetRow[];
  onToggleSet: (setId: string) => void;
  onRemoveExercise?: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  name,
  category,
  type = 'Strength',
  sets,
  onToggleSet,
  onRemoveExercise,
}) => {
  return (
    <View className="mb-3.5 rounded-2xl border border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark p-4 shadow-sm">
      {/* Header Row */}
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
            {name}
          </Text>
          {category ? (
            <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
              {category}
            </Text>
          ) : null}
        </View>

        <View className="flex-row items-center gap-x-2">
          <View className="rounded-lg border border-input-border/70 dark:border-input-border-dark/70 bg-input dark:bg-input-dark px-2.5 py-1">
            <Text className="text-[11px] font-semibold text-accent dark:text-accent-dark">
              {type}
            </Text>
          </View>
          {onRemoveExercise ? (
            <TouchableOpacity
              onPress={onRemoveExercise}
              className="w-7 h-7 rounded-full bg-red-500/10 items-center justify-center border border-red-500/20"
              activeOpacity={0.7}
            >
              <Text className="text-red-500 text-xs font-bold">✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Sets Table */}
      <View>
        <View className="mb-2 flex-row justify-between px-1">
          <Text className="w-1/4 text-center text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
            Set
          </Text>
          <Text className="w-1/4 text-center text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
            Weight
          </Text>
          <Text className="w-1/4 text-center text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
            Reps
          </Text>
          <Text className="w-1/4 text-center text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
            Done
          </Text>
        </View>

        {sets.map((s, idx) => (
          <View key={s.id || idx} className="mb-2 flex-row items-center">
            <View className="mr-1.5 flex-1 items-center rounded-xl border border-input-border/60 dark:border-input-border-dark/60 bg-input dark:bg-input-dark py-2.5">
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                {s.id || idx + 1}
              </Text>
            </View>

            <View className="mr-1.5 flex-1 items-center rounded-xl border border-input-border/60 dark:border-input-border-dark/60 bg-input dark:bg-input-dark py-2.5">
              <Text className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">
                {s.bodyweight ? 'BW' : s.weight ? `${s.weight} kg` : '-'}
              </Text>
            </View>

            <View className="mr-1.5 flex-1 items-center rounded-xl border border-input-border/60 dark:border-input-border-dark/60 bg-input dark:bg-input-dark py-2.5">
              <Text className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">
                {s.reps ? `${s.reps}` : '-'}
              </Text>
            </View>

            <Pressable
              onPress={() => onToggleSet(s.id)}
              className={`h-9 flex-1 items-center justify-center rounded-xl transition-all ${
                s.done
                  ? 'bg-accent dark:bg-accent-dark'
                  : 'border border-input-border/80 dark:border-input-border-dark/80 bg-input dark:bg-input-dark'
              }`}
            >
              <Text
                className={
                  s.done
                    ? 'font-extrabold text-background dark:text-background-dark text-xs'
                    : 'text-text-muted dark:text-text-muted-dark text-xs font-bold'
                }
              >
                {s.done ? '✓ Done' : '○'}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
};

export default ExerciseCard;
