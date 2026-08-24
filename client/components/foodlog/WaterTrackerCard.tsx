import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

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
  const fillWidth = `${percentage}%` as import('react-native').DimensionValue;

  return (
    <View className="bg-surface dark:bg-surface-dark rounded-[20px] p-4 mb-4 border border-input-border dark:border-input-border-dark shadow-xs">
      <View className="flex-row justify-between items-center mb-2.5">
        <View className="flex-row items-center">
          <Text className="text-xl mr-2">💧</Text>
          <View>
            <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-base">
              Daily Hydration
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-xs">
              {waterMl}ml / {targetMl}ml ({glasses}/{targetGlasses} glasses)
            </Text>
          </View>
        </View>

        <View className="bg-sky-500/10 dark:bg-sky-500/20 px-2.5 py-1 rounded-full border border-sky-500/30">
          <Text className="text-sky-600 dark:text-sky-400 font-bold text-xs">
            {percentage}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="h-2.5 bg-input dark:bg-input-dark rounded-full overflow-hidden mb-3 border border-input-border/40 dark:border-input-border-dark/40">
        <View className="h-2.5 rounded-full bg-sky-400" style={{ width: fillWidth }} />
      </View>

      {/* Quick Action Buttons */}
      <View className="flex-row justify-between gap-2">
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
          <Text className="text-text-muted dark:text-text-muted-dark font-bold text-xs">-250 ml</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onAddWater(250)}
          activeOpacity={0.8}
          className="flex-1 py-2 rounded-xl bg-sky-500/15 border border-sky-500/30 items-center justify-center"
        >
          <Text className="text-sky-600 dark:text-sky-400 font-bold text-xs">+250 ml (1 glass)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onAddWater(500)}
          activeOpacity={0.8}
          className="flex-1 py-2 rounded-xl bg-sky-500/20 border border-sky-500/40 items-center justify-center"
        >
          <Text className="text-sky-600 dark:text-sky-400 font-bold text-xs">+500 ml (Bottle)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
