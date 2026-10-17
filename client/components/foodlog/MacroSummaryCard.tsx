import React from 'react';
import { View, Text } from 'react-native';
import { MacroTargets } from './foodLogTypes';
import ProgressBar from '@/components/ui/ProgressBar';
import SurfaceCard from '../ui/SurfaceCard';
import { useThemeColors } from '@/constants/colors';

interface MacroSummaryCardProps {
  targets: MacroTargets;
  loggedCalories: number;
  loggedProtein: number;
  loggedCarbs: number;
  loggedFat: number;
  goal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS';
}

export default function MacroSummaryCard({
  targets,
  loggedCalories,
  loggedProtein,
  loggedCarbs,
  loggedFat,
  goal,
}: MacroSummaryCardProps) {
  
  const { colors } = useThemeColors();
  const caloriesRemaining = Math.max(0, targets.calories - loggedCalories);
  const calPercent = Math.min(100, Math.round((loggedCalories / Math.max(1, targets.calories)) * 100));
  const isOverLimit = loggedCalories > targets.calories;
  const isMuscleGain = goal === 'MUSCLE_GAIN';

  const proteinPercent = Math.min(100, Math.round((loggedProtein / Math.max(1, targets.protein)) * 100));
  const carbsPercent = Math.min(100, Math.round((loggedCarbs / Math.max(1, targets.carbs)) * 100));
  const fatPercent = Math.min(100, Math.round((loggedFat / Math.max(1, targets.fat)) * 100));

  return (
    <SurfaceCard className="mb-3">
      {/* Card Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-base">
            Daily Nutrition Budget
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
            Calibrated for {isMuscleGain ? 'Muscle Gain' : 'Weight Loss'} ({targets.calories.toLocaleString()} kcal)
          </Text>
        </View>
      </View>

      {/* Main Calories Overview Row */}
      <View className="flex-row items-center gap-3 bg-input dark:bg-input-dark rounded-2xl p-4 mb-3 border border-input-border dark:border-input-border-dark">
        {/* Circular Percentage Ring */}
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            borderWidth: 4,
            borderColor: isOverLimit ? colors.danger : colors.accent,
          }}
          className="shrink-0 bg-surface dark:bg-surface-dark items-center justify-center px-1"
        >
          <Text
            className={`text-center font-black text-xl leading-6 ${
              isOverLimit
                ? 'text-danger dark:text-danger-dark'
                : 'text-text-primary dark:text-text-primary-dark'
            }`}
          >
            {calPercent}%
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            className={`text-center font-bold text-[8.5px] uppercase tracking-normal mt-0.5 max-w-full px-0.5 ${
              isOverLimit
                ? 'text-danger dark:text-danger-dark font-black'
                : 'text-text-muted dark:text-text-muted-dark'
            }`}
          >
            {isOverLimit ? 'Over Budget' : calPercent >= 100 ? 'Goal Met' : 'Of Target'}
          </Text>
        </View>

        {/* Calories Remaining Numbers */}
        <View className="flex-1 min-w-0 justify-center">
          <Text className="text-[10px] uppercase tracking-wider text-text-muted dark:text-text-muted-dark font-bold mb-0.5">
            {isOverLimit ? 'OVER TARGET BY' : 'CALORIES REMAINING'}
          </Text>
          <Text
            className="text-2xl sm:text-3xl font-black text-text-primary dark:text-text-primary-dark leading-8 my-0.5"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {isOverLimit
              ? (loggedCalories - targets.calories).toLocaleString()
              : caloriesRemaining.toLocaleString()}{' '}
            <Text className="text-xs font-normal text-text-muted dark:text-text-muted-dark">
              kcal
            </Text>
          </Text>
          <Text className="text-[11px] sm:text-xs text-text-muted dark:text-text-muted-dark mt-0.5 leading-tight" numberOfLines={2}>
            {loggedCalories.toLocaleString()} logged of {targets.calories.toLocaleString()} kcal
          </Text>
        </View>
      </View>

      {/* Macro Breakdown Progress Bars */}
      <View className="pt-1">
        <View className="mb-2.5">
          <View className="flex-row justify-between items-center mb-1">
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-emerald-400" />
              <Text className="text-text-muted dark:text-text-muted-dark text-[10px] uppercase font-bold tracking-wider">
                Protein
              </Text>
            </View>
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
              {loggedProtein}g <Text className="font-normal text-text-muted dark:text-text-muted-dark">/ {targets.protein}g</Text>
            </Text>
          </View>
          <ProgressBar
            percentage={proteinPercent}
            color="#10B981"
            height={5}
            className="mb-0"
          />
        </View>

        <View className="mb-2.5">
          <View className="flex-row justify-between items-center mb-1">
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-sky-400" />
              <Text className="text-text-muted dark:text-text-muted-dark text-[10px] uppercase font-bold tracking-wider">
                Carbs
              </Text>
            </View>
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
              {loggedCarbs}g <Text className="font-normal text-text-muted dark:text-text-muted-dark">/ {targets.carbs}g</Text>
            </Text>
          </View>
          <ProgressBar
            percentage={carbsPercent}
            color="#0284C7"
            height={5}
            className="mb-0"
          />
        </View>

        <View className="mb-0">
          <View className="flex-row justify-between items-center mb-1">
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-purple-400" />
              <Text className="text-text-muted dark:text-text-muted-dark text-[10px] uppercase font-bold tracking-wider">
                Fats
              </Text>
            </View>
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
              {loggedFat}g <Text className="font-normal text-text-muted dark:text-text-muted-dark">/ {targets.fat}g</Text>
            </Text>
          </View>
          <ProgressBar
            percentage={fatPercent}
            color="#8B5CF6"
            height={5}
            className="mb-0"
          />
        </View>
      </View>
    </SurfaceCard>
  );
}
