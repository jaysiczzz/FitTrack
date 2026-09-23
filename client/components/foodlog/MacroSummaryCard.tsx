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

  const proteinPercent = Math.min(100, Math.round((loggedProtein / Math.max(1, targets.protein)) * 100));
  const carbsPercent = Math.min(100, Math.round((loggedCarbs / Math.max(1, targets.carbs)) * 100));
  const fatPercent = Math.min(100, Math.round((loggedFat / Math.max(1, targets.fat)) * 100));

  return (
    <SurfaceCard className="mb-3">
      {/* Card Header & Goal Tag */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-base">
            Daily Nutrition Budget
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
            Calibrated for your personal targets
          </Text>
        </View>
        <View
          className="px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/15"
        >
          <Text className="text-[10px] font-bold uppercase tracking-wider text-accent dark:text-accent-dark">
            {isMuscleGain ? 'Muscle Gain' : 'Weight Loss'}
          </Text>
        </View>
      </View>

      {/* Main Calories Overview Row */}
      <View className="flex-row items-center gap-3 bg-input dark:bg-input-dark rounded-2xl p-4 mb-3 border border-input-border dark:border-input-border-dark">
        {/* Circular Percentage Ring */}
        <View
          className={`w-[96px] h-[96px] rounded-full bg-surface dark:bg-surface-dark items-center justify-center mr-1 border-4 ${
            isOverLimit
              ? 'border-danger'
              : 'border-accent dark:border-accent-dark'
          }`}
        >
          <Text
            className={`text-center font-black text-2xl leading-7 ${
              isOverLimit
                ? 'text-danger dark:text-danger-dark'
                : 'text-text-primary dark:text-text-primary-dark'
            }`}
          >
            {calPercent}%
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-center font-bold text-[9px] uppercase tracking-wider mt-0.5">
            {isOverLimit ? 'Over Budget' : calPercent >= 100 ? 'Goal Met' : 'Of Target'}
          </Text>
        </View>

        {/* Calories Remaining Numbers */}
        <View className="flex-1 justify-center">
          <Text className="text-[10px] uppercase tracking-wider text-text-muted dark:text-text-muted-dark font-bold mb-0.5">
            {isOverLimit ? 'OVER TARGET BY' : 'CALORIES REMAINING'}
          </Text>
          <Text className="text-3xl font-black text-text-primary dark:text-text-primary-dark leading-8 my-0.5">
            {isOverLimit
              ? (loggedCalories - targets.calories).toLocaleString()
              : caloriesRemaining.toLocaleString()}{' '}
            <Text className="text-xs font-normal text-text-muted dark:text-text-muted-dark">
              kcal
            </Text>
          </Text>
          <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
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
