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
  targetMl = 2500,
  onAddWater,
}: WaterTrackerCardProps) {
  const percentage = Math.round((waterMl / Math.max(1, targetMl)) * 100);
  const visualPercentage = Math.min(100, percentage);
  const isTargetMet = percentage >= 100;
  const glasses = Math.round(waterMl / 250);
  const targetGlasses = Math.round(targetMl / 250);

  return (
    <SurfaceCard className="mb-3">
      <View className="flex-row justify-between items-center mb-2.5">
        <View className="flex-row items-center flex-1 mr-2">
          <View className={`w-7 h-7 rounded-lg items-center justify-center mr-2 ${isTargetMet ? 'bg-emerald-500/15 dark:bg-emerald-500/25' : 'bg-info/15 dark:bg-info-dark/20'}`}>
            <Text className="text-xs">{isTargetMet ? '🎉' : '💧'}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm" numberOfLines={1}>
              Daily Hydration
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px]" numberOfLines={1}>
              {waterMl.toLocaleString()}ml / {targetMl.toLocaleString()}ml ({glasses}/{targetGlasses} glasses)
            </Text>
          </View>
        </View>

        <View className={`px-2 py-0.5 rounded-md border ${
          isTargetMet
            ? 'bg-emerald-500/15 border-emerald-500/30 dark:border-emerald-400/30'
            : 'bg-info/10 dark:bg-info-dark/20 border-info/30 dark:border-info-dark/30'
        }`}>
          <Text className={`font-extrabold text-xs ${
            isTargetMet ? 'text-emerald-500 dark:text-emerald-400' : 'text-info dark:text-info-dark'
          }`}>
            {isTargetMet ? `✓ ${percentage}%` : `${percentage}%`}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar
        percentage={visualPercentage}
        color={isTargetMet ? COLORS.accent.dark : COLORS.info.dark}
        height={8}
        className="mb-2"
      />

      {isTargetMet ? (
        <View className="flex-row items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/20 py-1 px-2.5 rounded-lg mb-2.5 border border-emerald-500/20">
          <Text className="text-emerald-500 dark:text-emerald-400 font-bold text-[10px]">
            💧 Daily target reached! Outstanding hydration.
          </Text>
        </View>
      ) : null}

      {/* Quick Action Buttons */}
      <View className="flex-row justify-between gap-1.5">
        <TouchableOpacity
          onPress={() => onAddWater(-250)}
          disabled={waterMl <= 0}
          activeOpacity={0.8}
          className={`px-2 py-2 rounded-xl border items-center justify-center ${
            waterMl <= 0
              ? 'opacity-30 border-input-border dark:border-input-border-dark bg-input/40'
              : 'border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark'
          }`}
        >
          <Text className="text-textPrimary dark:text-textPrimary font-black text-[11px]">-250</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onAddWater(250)}
          activeOpacity={0.8}
          className="flex-1 py-2 rounded-xl bg-info/15 dark:bg-info-dark/20 border border-info/30 items-center justify-center"
        >
          <Text className="text-info dark:text-info-dark font-extrabold text-[10px] leading-tight">
            +250ml 🥛
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onAddWater(500)}
          activeOpacity={0.8}
          className="flex-1 py-2 rounded-xl bg-info/20 dark:bg-info-dark/25 border border-info/40 items-center justify-center"
        >
          <Text className="text-info dark:text-info-dark font-extrabold text-[10px] leading-tight">
            +500ml 💧
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onAddWater(750)}
          activeOpacity={0.8}
          className="flex-1 py-2 rounded-xl bg-info/25 dark:bg-info-dark/30 border border-info/50 items-center justify-center"
        >
          <Text className="text-info dark:text-info-dark font-extrabold text-[10px] leading-tight">
            +750ml 🥤
          </Text>
        </TouchableOpacity>
      </View>
    </SurfaceCard>
  );
}
