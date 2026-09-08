import React from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import ProgressBar from '@/components/ui/ProgressBar';
import { COLORS } from '@/constants/colors';

interface MacroProgressCardProps {
  caloriesLogged: number;
  targetCalories: number;
  proteinLogged: number;
  targetProtein: number;
  carbsLogged: number;
  targetCarbs: number;
  fatLogged: number;
  targetFat: number;
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
}: MacroProgressCardProps) {
  const router = useRouter();
  const caloriePercent = Math.min(100, Math.round((caloriesLogged / (targetCalories || 2000)) * 100));
  const proteinPercent = Math.min(100, Math.round((proteinLogged / (targetProtein || 140)) * 100));
  const carbsPercent = Math.min(100, Math.round((carbsLogged / (targetCarbs || 230)) * 100));
  const fatPercent = Math.min(100, Math.round((fatLogged / (targetFat || 65)) * 100));

  return (
    <View
      className="bg-surface dark:bg-surface-dark rounded-2xl p-4 mb-3 border border-input-border dark:border-input-border-dark"
      style={Platform.select({
        web: { boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)' } as any,
        default: { elevation: 1 },
      })}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <View className="w-7 h-7 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/20 items-center justify-center mr-2">
            <Text className="text-xs">🥗</Text>
          </View>
          <View>
            <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm">
              Daily Nutrition Intake
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(screen)/foodlog' as any)}
          activeOpacity={0.7}
          className="bg-accent/15 dark:bg-accent-dark/20 px-2.5 py-1 rounded-lg"
        >
          <Text className="text-accent dark:text-accent-dark font-bold text-[11px]">
            + Log Food →
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center">
        {/* Compact Circular Dial */}
        <View className="w-[100px] h-[100px] rounded-full bg-input dark:bg-input-dark items-center justify-center mr-4 border-2 border-accent/40 dark:border-accent-dark/40">
          <Text className="text-accent dark:text-accent-dark text-center font-black text-lg leading-5">
            {caloriePercent}%
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-center font-bold text-[9px] uppercase tracking-wider">
            {caloriesLogged} kcal
          </Text>
        </View>

        {/* Breakdown Progress Bars */}
        <View className="flex-1">
          <ProgressBar
            label="Protein"
            valueText={`${proteinLogged}g / ${targetProtein}g`}
            percentage={proteinPercent}
            color={COLORS.accent.dark}
          />
          <ProgressBar
            label="Carbs"
            valueText={`${carbsLogged}g / ${targetCarbs}g`}
            percentage={carbsPercent}
            color={COLORS.info.dark}
          />
          <ProgressBar
            label="Fats"
            valueText={`${fatLogged}g / ${targetFat}g`}
            percentage={fatPercent}
            color={COLORS.tertiary.dark}
            className="mb-0"
          />
        </View>
      </View>
    </View>
  );
}
