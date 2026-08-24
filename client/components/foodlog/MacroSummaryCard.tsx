import React from 'react';
import { View, Text } from 'react-native';
import { MacroTargets } from './foodLogTypes';

interface MacroSummaryCardProps {
  targets: MacroTargets;
  loggedCalories: number;
  loggedProtein: number;
  loggedCarbs: number;
  loggedFat: number;
  goal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS';
}

const ProgressBar = ({
  label,
  value,
  target,
  unit = 'g',
  color,
}: {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color: string;
}) => {
  const percentage = Math.min(100, Math.round((value / Math.max(1, target)) * 100));
  const fillWidth = `${percentage}%` as import('react-native').DimensionValue;

  return (
    <View className="mb-2.5">
      <View className="flex-row justify-between mb-1">
        <Text className="text-text-muted dark:text-text-muted-dark text-xs font-medium">{label}</Text>
        <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs">
          {value}{unit} <Text className="text-text-muted dark:text-text-muted-dark font-normal">/ {target}{unit}</Text> ({percentage}%)
        </Text>
      </View>
      <View className="h-2 bg-input dark:bg-input-dark rounded-full overflow-hidden border border-input-border/40 dark:border-input-border-dark/40">
        <View className="h-2 rounded-full" style={{ width: fillWidth, backgroundColor: color }} />
      </View>
    </View>
  );
};

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
    <View className="bg-surface dark:bg-surface-dark rounded-[22px] p-4 mb-4 border border-input-border dark:border-input-border-dark shadow-xs">
      {/* Card Header & Goal Tag */}
      <View className="flex-row justify-between items-center mb-3">
        <View>
          <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-base">
            Daily Nutrition Budget
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs">
            Personalized for your fitness target
          </Text>
        </View>
        <View
          className={`px-2.5 py-1 rounded-full border ${
            isMuscleGain
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-orange-500/10 border-orange-500/30'
          }`}
        >
          <Text
            className={`text-[11px] font-bold ${
              isMuscleGain ? 'text-emerald-500 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400'
            }`}
          >
            {isMuscleGain ? '💪 Muscle Gain' : '🔥 Weight Loss'}
          </Text>
        </View>
      </View>

      {/* Main Calories Overview Row */}
      <View className="flex-row items-center bg-input/50 dark:bg-input-dark/50 rounded-2xl p-3.5 mb-3.5 border border-input-border/50 dark:border-input-border-dark/50">
        {/* Circular Percentage Dial */}
        <View className="w-[88px] h-[88px] rounded-full bg-surface dark:bg-surface-dark items-center justify-center mr-4 border-2 border-accent/40 dark:border-accent-dark/40 shadow-xs">
          <Text className="text-accent dark:text-accent-dark text-center font-black text-lg leading-5">
            {calPercent}%
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-center font-bold text-[9px] uppercase tracking-wider mt-0.5">
            {isOverLimit ? 'Over Budget' : 'Goal Met'}
          </Text>
        </View>

        {/* Calories Remaining Numbers */}
        <View className="flex-1 justify-center">
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
          label="Protein (Muscle Repair & Growth)"
          value={loggedProtein}
          target={targets.protein}
          color="#00E5A0"
        />
        <ProgressBar
          label="Carbohydrates (Workout Energy)"
          value={loggedCarbs}
          target={targets.carbs}
          color="#4BB4FF"
        />
        <ProgressBar
          label="Healthy Fats (Hormone & Joint Health)"
          value={loggedFat}
          target={targets.fat}
          color="#A16BFF"
        />
      </View>

      {/* Dynamic Beginner Health Advice / Tip */}
      <View className="mt-2 pt-2.5 border-t border-input-border/50 dark:border-input-border-dark/50 flex-row items-center">
        <Text className="text-base mr-2">💡</Text>
        <Text className="text-text-muted dark:text-text-muted-dark text-xs flex-1 leading-4">
          {loggedProtein < targets.protein * 0.5
            ? isMuscleGain
              ? 'Focus on getting high-protein meals (chicken, eggs, protein shake) to fuel muscle synthesis.'
              : 'Keep protein high to stay full longer and preserve lean muscle while losing fat.'
            : isOverLimit
            ? 'You reached your calorie target for today! Drink water to stay satisfied.'
            : 'Great job tracking! You are on pace with your daily nutrition targets.'}
        </Text>
      </View>
    </View>
  );
}
