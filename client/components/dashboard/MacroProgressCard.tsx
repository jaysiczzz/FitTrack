import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import ProgressBar from '@/components/ui/ProgressBar';
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
  
  const isOverLimit = Boolean(targetCalories && caloriesLogged > targetCalories);
  const calPct = caloriePercent ?? (targetCalories ? Math.round((caloriesLogged / targetCalories) * 100) : 0);
  const proteinPercent = Math.min(100, Math.round((proteinLogged / Math.max(1, targetProtein || 140)) * 100));
  const carbsPercent = Math.min(100, Math.round((carbsLogged / Math.max(1, targetCarbs || 230)) * 100));
  const fatPercent = Math.min(100, Math.round((fatLogged / Math.max(1, targetFat || 65)) * 100));

  return (
    <SurfaceCard className="mb-3">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
          Nutrition Intake
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/(screen)/foodlog' as any)}
          activeOpacity={0.8}
          className="bg-accent/10 dark:bg-accent-dark/15 px-3 py-1.5 rounded-xl border border-accent/30 dark:border-accent-dark/30"
        >
          <Text className="text-accent dark:text-accent-dark font-bold text-xs">
            + Log Food
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center">
        {/* Dial / Circular Ring */}
        <View
          className={`w-[100px] h-[100px] rounded-full bg-input dark:bg-input-dark items-center justify-center mr-4 border-4 ${
            isOverLimit
              ? 'border-danger dark:border-danger-dark'
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
            {calPct}%
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            className={`text-center font-bold text-[9px] uppercase tracking-normal mt-0.5 max-w-full px-1 ${
              isOverLimit
                ? 'text-danger dark:text-danger-dark font-extrabold'
                : 'text-text-muted dark:text-text-muted-dark'
            }`}
          >
            {isOverLimit ? 'Over Budget' : `${caloriesLogged.toLocaleString()} kcal`}
          </Text>
        </View>

        {/* Breakdown Progress Bars */}
        <View className="flex-1">
          <View className="mb-2">
            <View className="flex-row justify-between items-center mb-1">
              <View className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full bg-emerald-400" />
                <Text className="text-text-muted dark:text-text-muted-dark text-[10px] uppercase font-bold tracking-wider">
                  Protein
                </Text>
              </View>
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                {proteinLogged}g <Text className="font-normal text-text-muted dark:text-text-muted-dark">/ {targetProtein}g</Text>
              </Text>
            </View>
            <ProgressBar
              percentage={proteinPercent}
              color="#10B981"
              height={5}
              className="mb-0"
            />
          </View>

          <View className="mb-2">
            <View className="flex-row justify-between items-center mb-1">
              <View className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full bg-sky-400" />
                <Text className="text-text-muted dark:text-text-muted-dark text-[10px] uppercase font-bold tracking-wider">
                  Carbs
                </Text>
              </View>
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                {carbsLogged}g <Text className="font-normal text-text-muted dark:text-text-muted-dark">/ {targetCarbs}g</Text>
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
                {fatLogged}g <Text className="font-normal text-text-muted dark:text-text-muted-dark">/ {targetFat}g</Text>
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
      </View>
    </SurfaceCard>
  );
}
