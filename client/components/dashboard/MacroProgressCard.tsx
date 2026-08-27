import React from 'react';
import { View, Text, Platform } from 'react-native';

interface ProgressBarProps {
  label: string;
  value: string;
  percentage: number;
  color: string;
}

const ProgressBar = ({ label, value, percentage, color }: ProgressBarProps) => {
  const fillWidth = `${Math.min(100, Math.max(0, percentage))}%` as import('react-native').DimensionValue;

  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-text-muted dark:text-text-muted-dark text-xs">{label}</Text>
        <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs">{value}</Text>
      </View>
      <View className="h-2.5 bg-input dark:bg-input-dark rounded-lg overflow-hidden border border-input-border/40">
        <View className="h-2.5 rounded-lg" style={{ width: fillWidth, backgroundColor: color }} />
      </View>
    </View>
  );
};

interface MacroProgressCardProps {
  caloriesLogged: number;
  targetCalories: number;
  proteinLogged: number;
  targetProtein: number;
  carbsLogged: number;
  targetCarbs: number;
  fatLogged: number;
  targetFat: number;
  goalLabel?: string;
}

export default function MacroProgressCard({
  caloriesLogged,
  targetCalories,
  proteinLogged,
  targetProtein,
  carbsLogged,
  targetCarbs,
  fatLogged,
  targetFat,
  goalLabel = 'Muscle Gain Target',
}: MacroProgressCardProps) {
  const caloriePercent = Math.min(100, Math.round((caloriesLogged / (targetCalories || 2000)) * 100));
  const proteinPercent = Math.min(100, Math.round((proteinLogged / (targetProtein || 140)) * 100));
  const carbsPercent = Math.min(100, Math.round((carbsLogged / (targetCarbs || 230)) * 100));
  const fatPercent = Math.min(100, Math.round((fatLogged / (targetFat || 65)) * 100));

  return (
    <View
      className="bg-surface dark:bg-surface-dark rounded-[24px] p-5 mb-4 border border-input-border dark:border-input-border-dark"
      style={Platform.select({
        web: { boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)' } as any,
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 3,
        },
      })}
    >
      <View className="flex-row justify-between items-center mb-3.5">
        <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm">
          Daily Nutrition Intake 🥗
        </Text>
        <View className="bg-input dark:bg-input-dark px-2.5 py-0.5 rounded-full border border-input-border/50">
          <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold">
            {goalLabel}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center">
        {/* Circular Percentage Dial */}
        <View className="w-[100px] h-[100px] rounded-full bg-input dark:bg-input-dark items-center justify-center mr-4 border-2 border-accent/40 dark:border-accent-dark/40 shadow-xs">
          <Text className="text-accent dark:text-accent-dark text-center font-black text-xl leading-6">
            {caloriePercent}%
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-center font-bold text-[9px] uppercase tracking-wider">
            Fuel Complete
          </Text>
        </View>

        {/* Breakdown Progress Bars */}
        <View className="flex-1">
          <ProgressBar
            label="Protein"
            value={`${proteinLogged}g / ${targetProtein}g`}
            percentage={proteinPercent}
            color="#00E5A0"
          />
          <ProgressBar
            label="Carbs"
            value={`${carbsLogged}g / ${targetCarbs}g`}
            percentage={carbsPercent}
            color="#4BB4FF"
          />
          <ProgressBar
            label="Fats"
            value={`${fatLogged}g / ${targetFat}g`}
            percentage={fatPercent}
            color="#A16BFF"
          />
        </View>
      </View>
    </View>
  );
}
