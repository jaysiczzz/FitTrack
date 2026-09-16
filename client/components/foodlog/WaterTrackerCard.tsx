import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '@/components/ui/ProgressBar';
import { useThemeColors } from '@/constants/colors';
import SurfaceCard from '../ui/SurfaceCard';

interface WaterTrackerCardProps {
  waterMl: number;
  targetMl?: number;
  onAddWater: (amountMl: number) => void;
}

export default function WaterTrackerCard({
  waterMl,
  targetMl = 2500,
  onAddWater,
}: WaterTrackerCardProps) {
  const { colors } = useThemeColors();
  const percentage = Math.round((waterMl / Math.max(1, targetMl)) * 100);
  const visualPercentage = Math.min(100, percentage);
  const isTargetMet = percentage >= 100;
  const glasses = Math.round(waterMl / 250);
  const targetGlasses = Math.round(targetMl / 250);

  return (
    <SurfaceCard className="mb-3">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm" numberOfLines={1}>
            Daily Hydration
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs" numberOfLines={1}>
            {waterMl.toLocaleString()} / {targetMl.toLocaleString()} ml ({glasses}/{targetGlasses} glasses)
          </Text>
        </View>

        <View
          className={`px-3 py-1 rounded-full border ${
            isTargetMet
              ? 'bg-emerald-500/15 border-emerald-500/30'
              : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
          }`}
        >
          <Text
            className={`font-bold text-xs ${
              isTargetMet ? 'text-accent dark:text-accent-dark' : 'text-text-primary dark:text-text-primary-dark'
            }`}
          >
            {percentage}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar
        percentage={visualPercentage}
        color={isTargetMet ? '#10B981' : colors.info}
        height={6}
        className="mb-3"
      />

      {isTargetMet ? (
        <View className="flex-row items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/15 py-2 px-3.5 rounded-2xl mb-3 border border-emerald-500/25">
          <View className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 items-center justify-center mr-2">
            <Ionicons name="checkmark" size={12} color="#10B981" />
          </View>
          <Text className="text-accent dark:text-accent-dark font-bold text-xs">
            Daily target reached. Great hydration today.
          </Text>
        </View>
      ) : null}

      {/* Quick Action Buttons */}
      <View className="flex-row justify-between gap-1.5">
        <TouchableOpacity
          onPress={() => onAddWater(-250)}
          disabled={waterMl <= 0}
          activeOpacity={0.8}
          className={`px-3 py-2 rounded-xl border items-center justify-center ${
            waterMl <= 0
              ? 'opacity-30 border-input-border dark:border-input-border-dark bg-input/40'
              : 'border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark'
          }`}
        >
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs">-250</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onAddWater(250)}
          activeOpacity={0.8}
          className="flex-1 py-2 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
        >
          <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xs">
            +250 ml
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onAddWater(500)}
          activeOpacity={0.8}
          className="flex-1 py-2 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
        >
          <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xs">
            +500 ml
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onAddWater(750)}
          activeOpacity={0.8}
          className="flex-1 py-2 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
        >
          <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xs">
            +750 ml
          </Text>
        </TouchableOpacity>
      </View>
    </SurfaceCard>
  );
}
