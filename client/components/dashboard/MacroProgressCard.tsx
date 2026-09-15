import React from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import ProgressBar from '@/components/ui/ProgressBar';
import { useThemeColors } from '@/constants/colors';
import SurfaceCard from '../ui/SurfaceCard';

interface MacroProgressCardProps {
  caloriePercent?: number;
  targetCalories?: number;
  caloriesLogged: number;
  proteinLogged: number;
  targetProtein: number;
  carbsLogged: number;
  targetCarbs: number;
  fatLogged: number;
  targetFat: number;
}

export default function MacroProgressCard({
  caloriePercent,
  targetCalories,
  caloriesLogged,
  proteinLogged,
  targetProtein,
  carbsLogged,
  targetCarbs,
  fatLogged,
  targetFat,
}: MacroProgressCardProps) {
  const router = useRouter();
  const { colors } = useThemeColors();
  const calPct = caloriePercent ?? (targetCalories ? Math.round((caloriesLogged / targetCalories) * 100) : 0);
  const proteinPercent = Math.min(100, Math.round((proteinLogged / (targetProtein || 140)) * 100));
  const carbsPercent = Math.min(100, Math.round((carbsLogged / (targetCarbs || 230)) * 100));
  const fatPercent = Math.min(100, Math.round((fatLogged / (targetFat || 65)) * 100));

  return (
    <SurfaceCard className="mb-3">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
          Nutrition Intake
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/(screen)/foodlog' as any)}
          activeOpacity={0.7}
          className="bg-input dark:bg-input-dark px-2.5 py-1 rounded-lg border border-input-border dark:border-input-border-dark"
        >
          <Text className="text-accent dark:text-accent-dark font-semibold text-xs">
            Log Food
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center">
        {/* Dial */}
        <View className="w-[96px] h-[96px] rounded-full bg-input dark:bg-input-dark items-center justify-center mr-4 border-2 border-accent/40 dark:border-accent-dark/40">
          <Text className="text-accent dark:text-accent-dark text-center font-extrabold text-lg leading-5">
            {calPct}%
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-center font-medium text-[10px] mt-0.5">
            {caloriesLogged} kcal
          </Text>
        </View>

        {/* Breakdown Progress Bars */}
        <View className="flex-1">
          <ProgressBar
            label="Protein"
            valueText={`${proteinLogged}g / ${targetProtein}g`}
            percentage={proteinPercent}
            color={colors.accent}
            height={5}
            className="mb-2"
          />
          <ProgressBar
            label="Carbs"
            valueText={`${carbsLogged}g / ${targetCarbs}g`}
            percentage={carbsPercent}
            color={colors.info}
            height={5}
            className="mb-2"
          />
          <ProgressBar
            label="Fats"
            valueText={`${fatLogged}g / ${targetFat}g`}
            percentage={fatPercent}
            color={colors.warning}
            height={5}
            className="mb-0"
          />
        </View>
      </View>
    </SurfaceCard>
  );
}
