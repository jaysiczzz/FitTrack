import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useWeightUnit } from '@/constants/units';
import SurfaceCard from '../ui/SurfaceCard';
import ConfirmModal from '../ui/ConfirmModal';
import { getMuscleTheme, isGenericStockPhoto } from './ExerciseVisual';
import { getDifficultyStyle } from '@/constants/difficulty';

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
  imageUrl?: string | null;
  sets: SetRow[];
  personalRecord?: string | null;
  onToggleSet: (setId: string) => void;
  onUpdateSet?: (setId: string, field: 'weight' | 'reps', newValue: number, bodyweight?: boolean) => void;
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
  imageUrl,
  sets,
  personalRecord,
  onToggleSet,
  onUpdateSet,
  onAddSet,
  onDeleteSet,
  onRemoveExercise,
  onViewDetails,
}) => {
  const { colors, isDark } = useThemeColors();
  const { width } = useWindowDimensions();
  const isCompact = width < 500;
  const [weightUnit] = useWeightUnit();
  const stepDelta = weightUnit === 'LBS' ? 5 : 2.5;
  const [setToDelete, setSetToDelete] = useState<{ id: string; setNumber: number } | null>(null);
  const [showTerminologyTip, setShowTerminologyTip] = useState(false);
  const isCardio = type.toLowerCase() === 'cardio';
  const isBodyweight =
    type.toLowerCase() === 'bodyweight' ||
    type.toLowerCase() === 'calisthenics' ||
    name.toLowerCase().includes('pull-up') ||
    name.toLowerCase().includes('push-up') ||
    name.toLowerCase().includes('chin-up') ||
    name.toLowerCase().includes('dip') ||
    sets.some((s) => s.bodyweight);
  const isStretch = type.toLowerCase() === 'stretch' || type.toLowerCase() === 'mobility';
  const theme = getMuscleTheme(primaryMuscle, category, name);
  const hasRealImage = Boolean(imageUrl && !isGenericStockPhoto(imageUrl));
  const diffStyle = getDifficultyStyle(difficulty);

  return (
    <SurfaceCard className="mb-4">
      {/* 1. Primary Header: Exercise Name, Category Meta & Close Action */}
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <TouchableOpacity
          activeOpacity={onViewDetails ? 0.7 : 1}
          onPress={onViewDetails}
          className="flex-1 min-w-0"
        >
          <View className="flex-row items-center gap-3">
            {hasRealImage ? (
              <Image
                source={{ uri: imageUrl! }}
                className="w-12 h-12 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark shrink-0"
                resizeMode="cover"
              />
            ) : null}

            <View className="flex-1 min-w-0">
              <Text
                className="text-lg font-black text-text-primary dark:text-text-primary-dark tracking-tight leading-snug"
                numberOfLines={2}
              >
                {name}
              </Text>

              {/* 2. Secondary Metadata: Level Badge (High Priority), Category Badge, Equipment, and PR */}
              <View className="flex-row items-center gap-2 mt-1.5 flex-wrap">
                {/* Level / Difficulty Badge */}
                {difficulty ? (
                  <View
                    className={`rounded-full px-2.5 py-0.5 border shrink-0 ${diffStyle.badgeContainer}`}
                  >
                    <Text
                      className={`text-[10px] font-extrabold uppercase tracking-wider ${diffStyle.badgeText}`}
                      style={{ color: isDark ? diffStyle.darkHexColor : diffStyle.hexColor }}
                    >
                      {difficulty}
                    </Text>
                  </View>
                ) : null}

                {/* Category Badge */}
                <View className="px-2.5 py-0.5 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark shrink-0">
                  <Text className={`text-[10px] font-extrabold uppercase tracking-wider ${theme.textClass}`}>
                    {theme.label}
                  </Text>
                </View>

                {/* Equipment & Secondary Muscles (Subordinate Details) */}
                <Text className="text-xs text-text-muted dark:text-text-muted-dark font-medium">
                  {equipment || 'Bodyweight'}
                  {secondaryMuscles && secondaryMuscles.length > 0 ? ` (${secondaryMuscles.join(', ')})` : ''}
                </Text>

                {/* Personal Record Trophy Badge */}
                {personalRecord ? (
                  <View className="flex-row items-center px-2 py-0.5 rounded-full bg-accent/10 dark:bg-accent-dark/15 border border-accent/25 dark:border-accent-dark/30 shrink-0">
                    <Ionicons name="trophy" size={10} color={colors.accent} style={{ marginRight: 3.5 }} />
                    <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                      {personalRecord}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Remove Exercise Action */}
        {onRemoveExercise ? (
          <TouchableOpacity
            onPress={onRemoveExercise}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-8 h-8 rounded-full bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark active:opacity-60 shrink-0 mt-0.5"
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${name}`}
          >
            <Ionicons name="close" size={15} color={colors.danger} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Target Prescriptions Bar */}
      <View className="mb-3.5 rounded-xl bg-input/70 dark:bg-input-dark/70 py-2 px-3 border border-input-border/70 dark:border-input-border-dark/70 flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2 flex-wrap">
          <View className="flex-row items-center gap-1">
            <Text className="text-[10px] font-black uppercase text-text-muted dark:text-text-muted-dark tracking-wider">
              TARGET:
            </Text>
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
              {recommendedSets} × {recommendedReps}
            </Text>
          </View>
          {recommendedRest ? (
            <View className="flex-row items-center gap-1">
              <Text className="text-text-muted text-xs">·</Text>
              <Text className="text-[10px] font-black uppercase text-text-muted dark:text-text-muted-dark tracking-wider">
                REST:
              </Text>
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                {recommendedRest}s
              </Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => setShowTerminologyTip((v) => !v)}
          activeOpacity={0.7}
          className={`px-2.5 py-1 rounded-lg border flex-row items-center gap-1 shrink-0 ${
            showTerminologyTip
              ? 'bg-accent border-accent'
              : 'bg-accent/15 dark:bg-accent-dark/20 border-accent/40'
          }`}
        >
          <Ionicons
            name={showTerminologyTip ? 'bulb' : 'bulb-outline'}
            size={12}
            color={showTerminologyTip ? colors.accentContrast : colors.accent}
          />
          <Text
            className={`text-[10px] font-extrabold ${
              showTerminologyTip
                ? 'text-accent-contrast dark:text-accent-contrast-dark'
                : 'text-accent dark:text-accent-dark'
            }`}
          >
            Sets & Reps?
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sets Table */}
      <View>
        {/* Beginner Terminology Helper Tooltip Banner */}
        {showTerminologyTip && (
          <View className="mb-2.5 p-3 rounded-xl bg-accent/10 dark:bg-accent-dark/15 border border-accent/30 flex-row items-start justify-between gap-2 shadow-xs">
            <View className="flex-row items-start gap-2 flex-1">
              <Ionicons name="bulb" size={15} color={colors.accent} style={{ marginTop: 1 }} />
              <View className="flex-1">
                <Text className="text-xs font-bold text-accent dark:text-accent-dark mb-0.5">
                  Beginner Lifting Guide:
                </Text>
                <Text className="text-[11px] text-text-primary dark:text-text-primary-dark leading-4">
                  • <Text className="font-extrabold text-accent">Rep (Repetition):</Text> How many times you perform the movement (e.g. 10 push-ups).{'\n'}
                  • <Text className="font-extrabold text-accent">Set:</Text> One block of reps followed by a rest interval before your next set.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowTerminologyTip(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="p-1 -mr-1 -mt-1 active:opacity-60"
            >
              <Ionicons name="close" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Column Headers */}
        <View className="mb-2.5 flex-row items-center gap-2 px-1 w-full">
          <Text className="w-8 text-center text-[10px] font-extrabold text-text-muted dark:text-text-muted-dark uppercase tracking-wider shrink-0">
            Set
          </Text>

          {!isCardio && !isStretch && (
            <Text
              numberOfLines={1}
              className="flex-1 min-w-0 text-center text-[10px] font-extrabold text-text-muted dark:text-text-muted-dark uppercase tracking-wider"
            >
              {isBodyweight ? 'Weight' : `Weight (${weightUnit.toLowerCase()})`}
            </Text>
          )}

          {!isCardio && !isStretch && (
            <Text
              numberOfLines={1}
              className="flex-1 min-w-0 text-center text-[10px] font-extrabold text-text-muted dark:text-text-muted-dark uppercase tracking-wider"
            >
              Reps
            </Text>
          )}

          {(isCardio || isStretch) && (
            <Text
              numberOfLines={1}
              className="flex-1 min-w-0 text-center text-[10px] font-extrabold text-text-muted dark:text-text-muted-dark uppercase tracking-wider"
            >
              Duration
            </Text>
          )}

          <Text className="w-9 text-center text-[10px] font-extrabold text-text-muted dark:text-text-muted-dark uppercase tracking-wider shrink-0">
            Done
          </Text>

          {onDeleteSet && sets.length > 1 ? (
            <View className="w-7 shrink-0" />
          ) : null}
        </View>

        {/* Dynamic Set Rows */}
        {sets.map((s, idx) => {
          const displaySetNumber = s.setNumber || idx + 1;
          const currWeight = Number(s.weight) || 0;
          const currReps = Number(s.reps) || 10;
          const isSetBodyweight = Boolean(s.bodyweight || (isBodyweight && currWeight === 0));
          const weightStr = s.weight !== undefined && s.weight !== null ? String(s.weight) : '0';
          const repsStr = s.reps !== undefined && s.reps !== null ? String(s.reps) : '10';

          return (
            <View key={s.id || idx} className="mb-2.5 flex-row items-center gap-2 w-full">
              {/* SET Number Badge */}
              <View
                accessibilityLabel={`Set ${displaySetNumber}`}
                className="w-8 h-10 items-center justify-center rounded-xl bg-input dark:bg-input-dark shrink-0"
              >
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                  {displaySetNumber}
                </Text>
              </View>

              {/* Weight / Load Column */}
              {!isCardio && !isStretch && (
                isSetBodyweight && currWeight === 0 ? (
                  <View className="flex-1 min-w-0 h-10 flex-row items-center justify-between rounded-xl bg-accent/10 dark:bg-accent-dark/15 border border-accent/30 dark:border-accent-dark/30 px-2 overflow-hidden">
                    <View className="flex-row items-center justify-center flex-1 min-w-0 gap-1">
                      <Ionicons name="body" size={12} color={colors.accent} />
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                        className="text-[11px] font-bold text-accent dark:text-accent-dark shrink min-w-0 text-center"
                        accessibilityLabel="Bodyweight"
                      >
                        {isCompact ? 'BW' : 'Bodyweight'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        if (onUpdateSet) onUpdateSet(s.id, 'weight', stepDelta, false);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                      className="w-6 h-6 rounded-lg bg-accent/20 dark:bg-accent-dark/30 items-center justify-center active:opacity-70 shrink-0 ml-1"
                      accessibilityLabel="Add weight"
                    >
                      <Ionicons name="add" size={13} color={colors.accent} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="flex-1 min-w-0 h-10 flex-row items-center justify-between rounded-xl border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark overflow-hidden">
                    <TouchableOpacity
                      onPress={() => {
                        if (!onUpdateSet) return;
                        const nextW = Math.max(0, Math.round((currWeight - stepDelta) * 10) / 10);
                        onUpdateSet(s.id, 'weight', nextW, nextW === 0 && isBodyweight);
                      }}
                      className="w-7 h-full items-center justify-center active:bg-input-border/20 shrink-0"
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      accessibilityRole="button"
                      accessibilityLabel="Decrease weight"
                    >
                      <Ionicons name="remove" size={14} color={colors.textPrimary} />
                    </TouchableOpacity>

                    <View className="flex-1 min-w-0 h-full items-center justify-center px-0.5">
                      <TextInput
                        value={weightStr}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                        onChangeText={(txt) => {
                          const parsed = parseFloat(txt);
                          if (!isNaN(parsed) && onUpdateSet) {
                            const newW = Math.max(0, parsed);
                            onUpdateSet(s.id, 'weight', newW, newW === 0 && isBodyweight);
                          } else if (txt === '' && onUpdateSet) {
                            onUpdateSet(s.id, 'weight', 0, isBodyweight);
                          }
                        }}
                        style={{
                          padding: 0,
                          margin: 0,
                          textAlign: 'center',
                          textAlignVertical: 'center',
                          includeFontPadding: false,
                          width: '100%',
                          minWidth: 0,
                        }}
                        className="w-full text-center text-xs font-black text-text-primary dark:text-text-primary-dark"
                      />
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        if (!onUpdateSet) return;
                        const nextW = Math.round((currWeight + stepDelta) * 10) / 10;
                        onUpdateSet(s.id, 'weight', nextW, false);
                      }}
                      className="w-7 h-full items-center justify-center active:bg-input-border/20 shrink-0"
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      accessibilityRole="button"
                      accessibilityLabel="Increase weight"
                    >
                      <Ionicons name="add" size={14} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                )
              )}

              {/* Reps Stepper Column */}
              {!isCardio && !isStretch && (
                <View className="flex-1 min-w-0 h-10 flex-row items-center justify-between rounded-xl border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark overflow-hidden">
                  <TouchableOpacity
                    onPress={() => onUpdateSet && onUpdateSet(s.id, 'reps', Math.max(1, currReps - 1))}
                    className="w-7 h-full items-center justify-center active:bg-input-border/20 shrink-0"
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease reps"
                  >
                    <Ionicons name="remove" size={14} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <View className="flex-1 min-w-0 h-full items-center justify-center px-0.5">
                    <TextInput
                      value={repsStr}
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
                        textAlign: 'center',
                        textAlignVertical: 'center',
                        includeFontPadding: false,
                        width: '100%',
                        minWidth: 0,
                      }}
                      className="w-full text-center text-xs font-black text-text-primary dark:text-text-primary-dark"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => onUpdateSet && onUpdateSet(s.id, 'reps', currReps + 1)}
                    className="w-7 h-full items-center justify-center active:bg-input-border/20 shrink-0"
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel="Increase reps"
                  >
                    <Ionicons name="add" size={14} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Duration Column (Cardio / Stretch) */}
              {(isCardio || isStretch) && (
                <View className="flex-1 min-w-0 h-10 items-center justify-center rounded-xl border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark px-2 overflow-hidden">
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {s.duration ? `${s.duration}s` : '60s'}
                  </Text>
                </View>
              )}

              {/* Status / Done Checkbox */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onToggleSet(s.id)}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: Boolean(s.done) }}
                accessibilityLabel={`Set ${s.setNumber || ''} ${s.done ? 'completed' : 'not done'}`}
                className={`w-9 h-10 items-center justify-center rounded-xl border shrink-0 transition-colors ${
                  s.done
                    ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
                    : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                }`}
              >
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={s.done ? colors.accentContrast : colors.textMuted}
                />
              </TouchableOpacity>

              {/* Delete Set Button */}
              {onDeleteSet && sets.length > 1 ? (
                <View className="w-7 h-10 items-center justify-center shrink-0">
                  <TouchableOpacity
                    onPress={() => setSetToDelete({ id: s.id, setNumber: displaySetNumber })}
                    className="w-7 h-10 items-center justify-center active:opacity-60"
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    accessibilityLabel="Delete set"
                  >
                    <Ionicons name="close" size={15} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          );
        })}

        {/* Add Set Button */}
        {onAddSet ? (
          <TouchableOpacity
            onPress={onAddSet}
            activeOpacity={0.8}
            className="mt-2 py-3 rounded-xl bg-input/70 dark:bg-input-dark/70 border border-dashed border-input-border dark:border-input-border-dark items-center justify-center flex-row gap-1.5"
          >
            <Ionicons name="add" size={15} color={colors.accent} />
            <Text className="text-xs font-bold text-accent dark:text-accent-dark">
              Add Set
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Beginner Barbell Weight Helper Note */}
        {(equipment?.toLowerCase().includes('barbell') || name.toLowerCase().includes('barbell')) && (
          <View className="mt-3 px-3 py-2 rounded-xl bg-input/40 dark:bg-input-dark/40 border border-input-border/40 flex-row items-center gap-2">
            <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark leading-3.5 flex-1">
              Barbell tip: A standard gym Olympic bar weighs 20kg (45 lbs) on its own. Total weight includes the bar + plates!
            </Text>
          </View>
        )}
      </View>

      {/* Delete Set Confirmation Modal */}
      <ConfirmModal
        visible={Boolean(setToDelete)}
        title="Delete Set"
        message={`Are you sure you want to delete Set ${setToDelete?.setNumber} of "${name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger
        iconName="trash-outline"
        onConfirm={() => {
          if (setToDelete && onDeleteSet) {
            onDeleteSet(setToDelete.id);
          }
          setSetToDelete(null);
        }}
        onCancel={() => setSetToDelete(null)}
      />
    </SurfaceCard>
  );
};

export default ExerciseCard;
