import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import SurfaceCard from '../ui/SurfaceCard';
import {
  DailyFoodHistorySummary,
  FoodLogItem,
  MEAL_LABELS,
  getSmartFoodBadge,
  getBadgeStyles,
} from './foodLogTypes';

interface FoodHistoryDayCardProps {
  day: DailyFoodHistorySummary;
  targetCalories: number;
  targetProtein: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onReLogItem: (item: FoodLogItem) => void;
  onDeleteDay?: (day: DailyFoodHistorySummary) => void;
}

export default function FoodHistoryDayCard({
  day,
  targetCalories,
  targetProtein,
  isExpanded,
  onToggleExpand,
  onReLogItem,
  onDeleteDay,
}: FoodHistoryDayCardProps) {
  const { colors } = useThemeColors();

  return (
    <SurfaceCard className="mb-3">
      {/* Header Accordion Bar */}
      <TouchableOpacity
        onPress={onToggleExpand}
        activeOpacity={0.7}
        className="flex-row justify-between items-center"
      >
        <View className="flex-1 pr-2">
          <View className="flex-row items-center gap-1.5 flex-wrap">
            <Text className="text-text-primary dark:text-text-primary-dark font-black text-base">
              {day.formattedDate}
            </Text>
            {day.totalProtein >= targetProtein * 0.8 ? (
              <View className="bg-emerald-500/15 dark:bg-emerald-500/25 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text className="text-emerald-500 dark:text-emerald-400 font-extrabold text-[9px]">
                  Target Met 🎯
                </Text>
              </View>
            ) : (
              <View className="bg-emerald-500/15 dark:bg-emerald-500/25 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text className="text-emerald-500 dark:text-emerald-400 font-extrabold text-[9px]">
                  Completed
                </Text>
              </View>
            )}
            {onDeleteDay ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  onDeleteDay(day);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Delete daily food log"
                className="w-7 h-7 rounded-lg items-center justify-center bg-red-500/10 dark:bg-red-500/20 active:opacity-70 ml-1"
              >
                <Ionicons name="trash-outline" size={13} color="#EF4444" />
              </TouchableOpacity>
            ) : null}
          </View>

          <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
            {day.items.length} {day.items.length === 1 ? 'meal' : 'meals'} logged
            {day.waterMl > 0 ? ` · ${day.waterMl} ml water` : ''}
          </Text>
        </View>

        <View className="items-end">
          <View className="flex-row items-baseline">
            <Text className="text-accent dark:text-accent-dark font-black text-base">
              {day.totalCalories}
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[10px] ml-0.5">
              / {targetCalories} kcal
            </Text>
          </View>
          <View className="flex-row items-center gap-0.5 mt-0.5">
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-bold">
              {isExpanded ? 'Hide' : 'View'}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.textMuted}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Quick Macro Pills */}
      <View className="flex-row gap-1.5 mt-3 pt-2.5 border-t border-input-border/50 dark:border-input-border-dark/50">
        <View className="flex-1 bg-input dark:bg-input-dark py-1 px-2 rounded-xl items-center">
          <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Protein</Text>
          <Text className="text-emerald-500 dark:text-emerald-400 font-extrabold text-xs">
            {day.totalProtein}g
          </Text>
        </View>

        <View className="flex-1 bg-input dark:bg-input-dark py-1 px-2 rounded-xl items-center">
          <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Carbs</Text>
          <Text className="text-sky-500 dark:text-sky-400 font-extrabold text-xs">
            {day.totalCarbs}g
          </Text>
        </View>

        <View className="flex-1 bg-input dark:bg-input-dark py-1 px-2 rounded-xl items-center">
          <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Fat</Text>
          <Text className="text-purple-500 dark:text-purple-400 font-extrabold text-xs">
            {day.totalFat}g
          </Text>
        </View>
      </View>

      {/* Expanded Detailed Items List */}
      {isExpanded && (
        <View className="mt-3.5 pt-3 border-t border-input-border/40 dark:border-input-border-dark/40">
          <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-bold uppercase mb-2">
            Meals Eaten on this day:
          </Text>

          {day.items.map((meal) => {
            const badgeInfo = (meal.goalBadge && meal.goalBadgeColor)
              ? { badge: meal.goalBadge, color: meal.goalBadgeColor }
              : getSmartFoodBadge(meal);
            const badgeStyles = getBadgeStyles(badgeInfo.color);

            return (
              <View
                key={meal.id}
                className="bg-input/60 dark:bg-input-dark/60 p-3 rounded-2xl mb-2 flex-row justify-between items-center border border-input-border/40 dark:border-input-border-dark/40"
              >
                <View className="flex-row items-center flex-1 pr-2">
                  {meal.imageUri ? (
                    <Image
                      source={{ uri: meal.imageUri }}
                      className="w-10 h-10 rounded-xl mr-2.5 bg-black/10"
                      resizeMode="cover"
                    />
                  ) : null}

                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5 flex-wrap">
                      <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-xs">
                        {meal.title}
                      </Text>
                      {badgeInfo?.badge ? (
                        <View className={`px-1.5 py-0.5 rounded-md border ${badgeStyles.container}`}>
                          <Text className={`text-[8.5px] font-black uppercase tracking-wide ${badgeStyles.text}`}>
                            {badgeInfo.badge}
                          </Text>
                        </View>
                      ) : null}
                      <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                        ({MEAL_LABELS[meal.mealType] || meal.mealType})
                      </Text>
                    </View>

                    <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mt-0.5">
                      {meal.calories} kcal · {meal.protein}g P · {meal.carbs}g C · {meal.fat}g F
                    </Text>
                  </View>
                </View>

                {/* 1-Tap Re-log Button */}
                <TouchableOpacity
                  onPress={() => onReLogItem(meal)}
                  activeOpacity={0.7}
                  className="bg-accent/15 dark:bg-accent-dark/20 px-2.5 py-1.5 rounded-xl flex-row items-center"
                >
                  <Text className="text-accent dark:text-accent-dark font-extrabold text-[10px]">
                    Re-log
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </SurfaceCard>
  );
}
