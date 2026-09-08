import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import ProgressBar from '@/components/ui/ProgressBar';
import { COLORS } from '@/constants/colors';
import SurfaceCard from '../ui/SurfaceCard';

interface WaterTrackerCardProps {
  waterMl: number;
  targetMl?: number;
  onAddWater: (amountMl: number) => void;
}

export default function WaterTrackerCard({
  waterMl,
  targetMl = 2000,
  onAddWater,
}: WaterTrackerCardProps) {
  const percentage = Math.min(100, Math.round((waterMl / targetMl) * 100));
  const glasses = Math.round(waterMl / 250);
  const targetGlasses = Math.round(targetMl / 250);

  return (
    <SurfaceCard className="mb-3">
      <View className="flex-row justify-between items-center mb-2.5">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-7 h-7 rounded-lg bg-info/15 dark:bg-info-dark/20 items-center justify-center mr-2">
            <Text className="text-xs">💧</Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm" numberOfLines={1}>
              Daily Hydration
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px]" numberOfLines={1}>
              {waterMl}ml / {targetMl}ml ({glasses}/{targetGlasses} glasses)
            </Text>
          </View>
        </View>

        <View className="bg-info/10 dark:bg-info-dark/20 px-2 py-0.5 rounded-md border border-info/30 dark:border-info-dark/30">
          <Text className="text-info dark:text-info-dark font-bold text-xs">
            {percentage}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar
        percentage={percentage}
        color={COLORS.info.dark}
        height={8}
        className="mb-2.5"
      />

      {/* Quick Action Buttons */}
      <View className="flex-row justify-between gap-1.5">
        <TouchableOpacity
          onPress={() => onAddWater(-250)}
          disabled={waterMl <= 0}
          activeOpacity={0.8}
          className={`flex-1 py-2 rounded-xl border items-center justify-center ${
            waterMl <= 0
              ? 'opacity-40 border-input-border dark:border-input-border-dark bg-input/40'
              : 'border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark'
          }`}
        >
          <Text className="text-surface font-bold text-[11px]">-250 ml</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onAddWater(250)}
          activeOpacity={0.8}
          className="flex-1 py-2 rounded-xl bg-info/15 dark:bg-info-dark/20 border border-info/30 items-center justify-center"
        >
          <Text className="text-info dark:text-info-dark font-bold text-[11px]">+250 ml (Glass)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onAddWater(500)}
          activeOpacity={0.8}
          className="flex-1 py-2 rounded-xl bg-info/20 dark:bg-info-dark/25 border border-info/40 items-center justify-center"
        >
          <Text className="text-info dark:text-info-dark font-bold text-[11px]">+500 ml (Bottle)</Text>
        </TouchableOpacity>
      </View>
    </SurfaceCard>
  );
}
