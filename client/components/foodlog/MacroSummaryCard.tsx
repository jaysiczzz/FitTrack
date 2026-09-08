import React from 'react';
import { View, Text, Platform } from 'react-native';
import { MacroTargets } from './foodLogTypes';
import ProgressBar from '@/components/ui/ProgressBar';
import { COLORS } from '@/constants/colors';
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
  const caloriesRemaining = Math.max(0, targets.calories - loggedCalories);
  const calPercent = Math.min(100, Math.round((loggedCalories / Math.max(1, targets.calories)) * 100));
  const isOverLimit = loggedCalories > targets.calories;

  const isMuscleGain = goal === 'MUSCLE_GAIN';

  return (
    <SurfaceCard className="mb-3">
      {/* Card Header & Goal Tag */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-base">
            Daily Nutrition Budget
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs">
            Personalized for your fitness goal
          </Text>
        </View>
        <View
          className={`px-2.5 py-1 rounded-full border ${
            isMuscleGain
              ? 'bg-accent/10 border-accent/30'
              : 'bg-warning/10 border-warning/30'
          }`}
        >
          <Text
            className={`text-[11px] font-bold ${
              isMuscleGain ? 'text-accent dark:text-accent-dark' : 'text-warning dark:text-warning-dark'
            }`}
          >
            {isMuscleGain ? '💪 Muscle Gain' : '🔥 Weight Loss'}
          </Text>
        </View>
      </View>

      {/* Main Calories Overview Row */}
      <View className="flex-row gap-3 bg-input/50 dark:bg-input-dark/50 rounded-xl p-3 mb-3 border border-input-border/40 dark:border-input-border-dark/40">
        {/* Circular Percentage Dial */}
        <View className="w-[100px] h-[100px] rounded-full bg-surface dark:bg-surface-dark items-center justify-center mr-3.5 border-2 border-accent/40 dark:border-accent-dark/40">
          <Text className="text-accent dark:text-accent-dark text-center font-black text-lg leading-5">
            {calPercent}%
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-center font-bold text-[9px] uppercase tracking-wider mt-0.5">
            {isOverLimit ? 'Over' : 'Fuel Met'}
          </Text>
        </View>

        {/* Calories Remaining Numbers */}
        <View className="justify-center">
          <Text className="text-text-muted dark:text-text-muted-dark text-xs font-medium">
            {isOverLimit ? 'Calories Exceeded' : 'Calories Remaining'}
          </Text>
          <Text
            className={`text-2xl font-black ${
              isOverLimit ? 'text-rose-500' : 'text-text-primary dark:text-text-primary-dark'
            }`}
          >
            {isOverLimit ? `+${loggedCalories - targets.calories}` : caloriesRemaining}
            <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark"> kcal</Text>
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mt-0.5">
            Eaten: <Text className="font-bold text-text-primary dark:text-text-primary-dark">{loggedCalories}</Text> / {targets.calories} kcal
          </Text>
        </View>
      </View>

      {/* Macro Progress Bars */}
      <View className="mt-1">
        <ProgressBar
          label="Protein"
          current={loggedProtein}
          target={targets.protein}
          unit="g"
          color={COLORS.accent.dark}
        />
        <ProgressBar
          label="Carbohydrates"
          current={loggedCarbs}
          target={targets.carbs}
          unit="g"
          color={COLORS.info.dark}
        />
        <ProgressBar
          label="Fats"
          current={loggedFat}
          target={targets.fat}
          unit="g"
          color={COLORS.tertiary.dark}
        />
      </View>

      {/* Dynamic Beginner Health Advice / Tip */}
      <View className="mt-1.5 pt-2 border-t border-input-border/40 dark:border-input-border-dark/40 flex-row items-center">
        <Text className="text-sm mr-2">💡</Text>
        <Text className="text-text-muted dark:text-text-muted-dark text-[11px] flex-1 leading-4">
          {loggedProtein < targets.protein * 0.5
            ? isMuscleGain
              ? 'Prioritize high-protein sources (chicken, eggs, protein shakes) to support muscle growth.'
              : 'Keep protein intake high to preserve lean muscle and stay full while cutting.'
            : isOverLimit
            ? 'Daily calorie target reached! Focus on hydration to stay satisfied.'
            : 'Great consistency! Your macro nutrition is well on pace today.'}
        </Text>
      </View>
    </SurfaceCard>
  );
}
