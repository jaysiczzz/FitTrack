import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '@/components/ui/ProgressBar';
import { useColorScheme } from '@/constants/colors';
import SurfaceCard from '../ui/SurfaceCard';
import { hapticFeedback } from '@/utils/haptics';
import {
  DEFAULT_WATER_TARGET_ML,
  WATER_INCREMENT_SMALL_ML,
} from '@/constants/fitnessDefaults';

interface WaterTrackerCardProps {
  waterMl: number;
  targetMl?: number;
  onAddWater: (amountMl: number) => void;
}

export default function WaterTrackerCard({
  waterMl,
  targetMl = DEFAULT_WATER_TARGET_ML,
  onAddWater,
}: WaterTrackerCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const percentage = Math.round((waterMl / Math.max(1, targetMl)) * 100);
  const visualPercentage = Math.min(100, percentage);
  const isTargetMet = percentage >= 100;
  const glasses = Math.round(waterMl / WATER_INCREMENT_SMALL_ML);
  const targetGlasses = Math.round(targetMl / WATER_INCREMENT_SMALL_ML);

  const handlePressWater = (amount: number) => {
    hapticFeedback.light();
    onAddWater(amount);
  };

  const accentColor = isDark ? '#10B981' : '#047857';
  const infoColor = isDark ? '#38BDF8' : '#0369A1';

  return (
    <SurfaceCard className="mb-3">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-text-primary dark:text-text-primary-dark font-baloo-bold text-sm" numberOfLines={1}>
            Daily Hydration
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-[11px] sm:text-xs mt-0.5" numberOfLines={2}>
            {waterMl.toLocaleString()} / {targetMl.toLocaleString()} ml ({glasses}/{targetGlasses} glasses)
          </Text>
        </View>

        <View
          className={`px-2.5 py-1 rounded-full border shrink-0 ${
            isTargetMet
              ? 'bg-accent/15 border-accent/30'
              : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
          }`}
        >
          <Text
            className={`font-baloo-bold text-xs ${
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
        color={isTargetMet ? accentColor : infoColor}
        height={6}
        className="mb-3"
      />

      {isTargetMet ? (
        <View className="flex-row items-center bg-accent/10 dark:bg-accent-dark/15 py-2 px-3 rounded-2xl mb-3 border border-accent/25 dark:border-accent-dark/30">
          <View className="w-5 h-5 rounded-full bg-accent/20 border border-accent/40 items-center justify-center mr-2 shrink-0">
            <Ionicons name="checkmark" size={12} color={accentColor} />
          </View>
          <Text className="text-accent dark:text-accent-dark font-baloo-bold text-xs flex-1">
            Daily target reached. Great hydration today!
          </Text>
        </View>
      ) : null}

      {/* Quick Action Buttons */}
      <View className="flex-row justify-between gap-1.5">
        <TouchableOpacity
          onPress={() => handlePressWater(-250)}
          disabled={waterMl <= 0}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Subtract 250 milliliters of water"
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          className={`px-3 min-h-[40px] py-1.5 rounded-xl border items-center justify-center active:opacity-60 ${
            waterMl <= 0
              ? 'opacity-30 border-input-border dark:border-input-border-dark bg-input/40'
              : 'border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark'
          }`}
        >
          <Text className="text-text-primary dark:text-text-primary-dark font-baloo-bold text-xs">-250</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handlePressWater(250)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Add 250 milliliters glass of water"
          className="flex-1 min-h-[40px] py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center active:opacity-70"
        >
          <Text className="text-text-primary dark:text-text-primary-dark font-baloo-bold text-xs">
            +250 ml
          </Text>
          <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Glass</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handlePressWater(500)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Add 500 milliliters bottle of water"
          className="flex-1 min-h-[40px] py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center active:opacity-70"
        >
          <Text className="text-text-primary dark:text-text-primary-dark font-baloo-bold text-xs">
            +500 ml
          </Text>
          <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Bottle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handlePressWater(750)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Add 750 milliliters shaker of water"
          className="flex-1 min-h-[40px] py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center active:opacity-70"
        >
          <Text className="text-text-primary dark:text-text-primary-dark font-baloo-bold text-xs">
            +750 ml
          </Text>
          <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Shaker</Text>
        </TouchableOpacity>
      </View>
    </SurfaceCard>
  );
}
