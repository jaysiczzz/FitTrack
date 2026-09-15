import React from 'react';
import { View, Text, Platform } from 'react-native';
import { MacroTargets } from './foodLogTypes';
import ProgressBar from '@/components/ui/ProgressBar';
import { useThemeColors } from '@/constants/colors';
import SurfaceCard from '../ui/SurfaceCard';

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

  return (
    <SurfaceCard className="mb-3">
      {/* Card Header & Goal Tag */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-base">
            Daily Nutrition Budget
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs">
            Calibrated for your personal targets
          </Text>
        </View>
        <View
          className="px-2.5 py-1 rounded-full border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark"
        >
          <Text className="text-[11px] font-semibold text-text-primary dark:text-text-primary-dark">
            {isMuscleGain ? 'Muscle Gain' : 'Weight Loss'}
          </Text>
        </View>
      </View>

      {/* Main Calories Overview Row */}
      <View className="flex-row items-center gap-3 bg-input dark:bg-input-dark rounded-xl p-3 mb-3 border border-input-border dark:border-input-border-dark">
        {/* Circular Percentage Dial */}
        <View
          className={`w-[92px] h-[92px] rounded-full bg-surface dark:bg-surface-dark items-center justify-center mr-2 border-2 ${
            isOverLimit
              ? 'border-danger'
              : calPercent >= 100
              ? 'border-accent dark:border-accent-dark'
              : 'border-accent/40 dark:border-accent-dark/40'
          }`}
        >
          <Text
            className={`text-center font-black text-lg leading-5 ${
              isOverLimit
                ? 'text-danger dark:text-danger-dark'
                : 'text-text-primary dark:text-text-primary-dark'
            }`}
          >
            {calPercent}%
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-center font-semibold text-[9px] uppercase tracking-wider mt-0.5">
            {isOverLimit ? 'Over Budget' : calPercent >= 100 ? 'Goal Met' : 'Of Target'}
          </Text>
        </View>

        {/* Calories Remaining Numbers */}
        <View className="flex-1 justify-center">
          <Text className="text-[11px] uppercase tracking-wider text-text-muted dark:text-text-muted-dark font-semibold">
            {isOverLimit ? 'Over Target By' : 'Calories Remaining'}
          </Text>
          <Text className="text-2xl font-black text-text-primary dark:text-text-primary-dark my-0.5">
            {isOverLimit
              ? (loggedCalories - targets.calories).toLocaleString()
              : caloriesRemaining.toLocaleString()}{' '}
            <Text className="text-xs font-normal text-text-muted dark:text-text-muted-dark">
              kcal
            </Text>
          </Text>
          <Text className="text-xs text-text-muted dark:text-text-muted-dark">
            {loggedCalories.toLocaleString()} logged of {targets.calories.toLocaleString()} kcal
          </Text>
        </View>
      </View>

      {/* Macro Breakdown Progress Bars */}
      <View className="pt-1">
        <ProgressBar
          label="Protein"
          valueText={`${loggedProtein}g / ${targets.protein}g`}
          current={loggedProtein}
          target={targets.protein}
          color={colors.accent}
          height={5}
          className="mb-2"
        />
        <ProgressBar
          label="Carbs"
          valueText={`${loggedCarbs}g / ${targets.carbs}g`}
          current={loggedCarbs}
          target={targets.carbs}
          color={colors.info}
          height={5}
          className="mb-2"
        />
        <ProgressBar
          label="Fats"
          valueText={`${loggedFat}g / ${targets.fat}g`}
          current={loggedFat}
          target={targets.fat}
          color={colors.warning}
          height={5}
          className="mb-0"
        />
      </View>
    </SurfaceCard>
  );
}
