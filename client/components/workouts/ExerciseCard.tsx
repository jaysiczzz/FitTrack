import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
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
  personalRecord?: string | null;
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
  personalRecord,
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
          <Text className="text-base font-bold text-text-primary dark:text-text-primary-dark mb-0.5">
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

          {personalRecord ? (
            <View className="flex-row items-center mt-1.5">
              <View className="flex-row items-center px-2 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30">
                <Ionicons name="trophy" size={10} color="#F59E0B" style={{ marginRight: 3.5 }} />
                <Text className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {personalRecord}
                </Text>
              </View>
            </View>
          ) : null}
        </TouchableOpacity>

        {/* Action Controls & Remove Button */}
        <View className="flex-row items-center gap-1.5">
          <View
            className={`rounded-full px-2.5 py-0.5 border ${
              difficulty.toLowerCase() === 'beginner'
                ? 'bg-emerald-500/15 border-emerald-500/30'
                : difficulty.toLowerCase() === 'advanced'
                ? 'bg-purple-500/15 border-purple-500/30'
                : 'bg-sky-500/15 border-sky-500/30'
            }`}
          >
            <Text
              className={`text-[10px] font-bold uppercase tracking-wider ${
                difficulty.toLowerCase() === 'beginner'
                  ? 'text-accent dark:text-accent-dark'
                  : difficulty.toLowerCase() === 'advanced'
                  ? 'text-purple-400'
                  : 'text-sky-400'
              }`}
            >
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
              <Ionicons name="close" size={15} color={colors.danger} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Target Prescriptions Bar */}
      <View className="mb-3 rounded-xl bg-input dark:bg-input-dark py-2 px-2.5 border border-input-border dark:border-input-border-dark flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1">
            <Text className="text-[9px] font-black uppercase text-text-muted dark:text-text-muted-dark">
              TARGET:
            </Text>
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
              {recommendedSets} × {recommendedReps}
            </Text>
          </View>
          {recommendedRest ? (
            <View className="flex-row items-center gap-1">
              <Text className="text-text-muted text-xs">·</Text>
              <Text className="text-[9px] font-black uppercase text-text-muted dark:text-text-muted-dark">
                REST:
              </Text>
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                {recommendedRest}s
              </Text>
            </View>
          ) : null}
        </View>

        {onViewDetails ? (
          <TouchableOpacity
            onPress={onViewDetails}
            activeOpacity={0.7}
            className="bg-accent/15 dark:bg-accent-dark/20 px-2 py-0.5 rounded-lg border border-accent/30"
          >
            <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
              Guide & Tips
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Sets Table Header */}
      <View>
        <View className="mb-1.5 flex-row items-center gap-1.5 px-0.5">
          <Text className="w-8 text-center text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
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

          <Text className="w-16 text-center text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
            Done
          </Text>
        </View>

        {/* Dynamic Set Rows */}
        {sets.map((s, idx) => {
          const displaySetNumber = s.setNumber || idx + 1;
          const currWeight = Number(s.weight) || 0;
          const currReps = Number(s.reps) || 10;

          return (
            <View key={s.id || idx} className="mb-2 flex-row items-center gap-1.5">
              {/* SET Number */}
              <View className="w-8 h-9 items-center justify-center rounded-xl bg-input dark:bg-input-dark">
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                  {displaySetNumber}
                </Text>
              </View>

              {/* Weight Stepper Column */}
              {!isCardio && !isStretch && !isBodyweight && (
                <View className="flex-1 h-9 flex-row items-center justify-between rounded-xl border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark px-1">
                  <TouchableOpacity
                    onPress={() => onUpdateSet && onUpdateSet(s.id, 'weight', Math.max(0, Math.round((currWeight - 2.5) * 10) / 10))}
                    className="w-5 h-6 rounded-md bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center"
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">-</Text>
                  </TouchableOpacity>

                  {s.bodyweight ? (
                    <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                      BW
                    </Text>
                  ) : (
                    <View className="flex-row items-center justify-center flex-1 px-0.5">
                      <TextInput
                        value={String(currWeight)}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                        onChangeText={(txt) => {
                          const parsed = parseFloat(txt);
                          if (!isNaN(parsed) && onUpdateSet) {
                            onUpdateSet(s.id, 'weight', Math.max(0, parsed));
                          } else if (txt === '' && onUpdateSet) {
                            onUpdateSet(s.id, 'weight', 0);
                          }
                        }}
                        style={{
                          padding: 0,
                          margin: 0,
                          textAlignVertical: 'center',
                          includeFontPadding: false,
                        }}
                        className="text-xs font-black text-text-primary dark:text-text-primary-dark text-center min-w-[24px]"
                      />
                      <Text className="text-[9px] font-bold text-text-muted dark:text-text-muted-dark ml-0.5">
                        kg
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => onUpdateSet && onUpdateSet(s.id, 'weight', Math.round((currWeight + 2.5) * 10) / 10)}
                    className="w-5 h-6 rounded-md bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center"
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">+</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Reps Stepper Column */}
              {!isCardio && !isStretch && (
                <View className="flex-1 h-9 flex-row items-center justify-between rounded-xl border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark px-1">
                  <TouchableOpacity
                    onPress={() => onUpdateSet && onUpdateSet(s.id, 'reps', Math.max(1, currReps - 1))}
                    className="w-5 h-6 rounded-md bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center"
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">-</Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center justify-center flex-1 px-0.5">
                    <TextInput
                      value={String(currReps)}
                      keyboardType="number-pad"
                      selectTextOnFocus
                      onChangeText={(txt) => {
                        const parsed = parseInt(txt, 10);
                        if (!isNaN(parsed) && onUpdateSet) {
                          onUpdateSet(s.id, 'reps', Math.max(1, parsed));
                        }
                      }}
                      style={{
                        padding: 0,
                        margin: 0,
                        textAlignVertical: 'center',
                        includeFontPadding: false,
                      }}
                      className="text-xs font-black text-text-primary dark:text-text-primary-dark text-center min-w-[20px]"
                    />
                    <Text className="text-[9px] font-bold text-text-muted dark:text-text-muted-dark ml-0.5">
                      r
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => onUpdateSet && onUpdateSet(s.id, 'reps', currReps + 1)}
                    className="w-5 h-6 rounded-md bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center"
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">+</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Duration Column */}
              {(isCardio || isStretch) && (
                <View className="flex-1 items-center justify-center rounded-xl border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark h-9">
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {s.duration ? `${s.duration}s` : '60s'}
                  </Text>
                </View>
              )}

              {/* Status / Done Checkbox & Delete Set Button */}
              <View className="w-16 h-9 flex-row items-center justify-end gap-1">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onToggleSet(s.id)}
                  className={`h-9 flex-1 items-center justify-center rounded-xl border ${
                    s.done
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                  }`}
                >
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={s.done ? '#FFFFFF' : colors.textMuted}
                  />
                </TouchableOpacity>

                {onDeleteSet && sets.length > 1 && (
                  <TouchableOpacity
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        if (window.confirm(`Delete Set ${displaySetNumber}?`)) {
                          onDeleteSet(s.id);
                        }
                      } else {
                        Alert.alert('Delete Set', `Remove Set ${displaySetNumber}?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => onDeleteSet(s.id) },
                        ]);
                      }
                    }}
                    className="w-5 h-9 items-center justify-center rounded-lg"
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="close" size={13} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {/* Add Set Button */}
        {onAddSet ? (
          <TouchableOpacity
            onPress={onAddSet}
            activeOpacity={0.8}
            className="mt-1 py-2.5 rounded-xl bg-input dark:bg-input-dark border border-dashed border-accent/40 dark:border-accent-dark/40 items-center justify-center flex-row"
          >
            <Text className="text-xs font-bold text-accent dark:text-accent-dark">
              + Add Set
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SurfaceCard>
  );
};

export default ExerciseCard;
