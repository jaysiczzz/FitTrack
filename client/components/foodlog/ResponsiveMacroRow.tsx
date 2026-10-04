import React from 'react';
import { View, Text } from 'react-native';

interface ResponsiveMacroRowProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  compact?: boolean;
}

export default function ResponsiveMacroRow({
  calories,
  protein,
  carbs,
  fat,
  compact = false,
}: ResponsiveMacroRowProps) {
  return (
    <View className={`flex-row items-center justify-between rounded-xl bg-input/70 dark:bg-input-dark/70 border border-input-border/60 dark:border-input-border-dark/60 ${compact ? 'py-1 px-1.5' : 'p-2'} w-full`}>
      {/* Calories */}
      <View className="flex-1 items-center justify-center min-w-0 px-0.5">
        <Text
          numberOfLines={1}
          className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-text-muted dark:text-text-muted-dark font-medium`}
        >
          {compact ? 'Cal' : 'Calories'}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          className={`${compact ? 'text-[11px]' : 'text-xs'} font-black text-text-primary dark:text-text-primary-dark mt-0.5`}
        >
          {calories}
        </Text>
      </View>

      {/* Protein */}
      <View className="flex-1 items-center justify-center min-w-0 px-0.5 border-l border-input-border/60 dark:border-input-border-dark/60">
        <Text
          numberOfLines={1}
          className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-text-muted dark:text-text-muted-dark font-medium`}
        >
          {compact ? 'P' : 'Protein'}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          className={`${compact ? 'text-[11px]' : 'text-xs'} font-black text-emerald-600 dark:text-emerald-400 mt-0.5`}
        >
          {protein}g
        </Text>
      </View>

      {/* Carbs */}
      <View className="flex-1 items-center justify-center min-w-0 px-0.5 border-l border-input-border/60 dark:border-input-border-dark/60">
        <Text
          numberOfLines={1}
          className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-text-muted dark:text-text-muted-dark font-medium`}
        >
          {compact ? 'C' : 'Carbs'}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          className={`${compact ? 'text-[11px]' : 'text-xs'} font-black text-sky-600 dark:text-sky-400 mt-0.5`}
        >
          {carbs}g
        </Text>
      </View>

      {/* Fat */}
      <View className="flex-1 items-center justify-center min-w-0 px-0.5 border-l border-input-border/60 dark:border-input-border-dark/60">
        <Text
          numberOfLines={1}
          className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-text-muted dark:text-text-muted-dark font-medium`}
        >
          {compact ? 'F' : 'Fat'}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          className={`${compact ? 'text-[11px]' : 'text-xs'} font-black text-amber-600 dark:text-amber-400 mt-0.5`}
        >
          {fat}g
        </Text>
      </View>
    </View>
  );
}
