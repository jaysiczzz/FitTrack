import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { FoodLogItem, MealType } from './foodLogTypes';

interface MealCategoryCardProps {
  type: MealType;
  title: string;
  icon: string;
  items: FoodLogItem[];
  onAddPress: (type: MealType) => void;
  onScanPress?: (type: MealType) => void;
  onDeleteItem: (id: string) => void;
}

const getBadgeStyle = (color?: 'green' | 'blue' | 'yellow' | 'purple') => {
  switch (color) {
    case 'green':
      return 'bg-accent/15 text-accent dark:text-accent-dark border-accent/30 dark:border-accent-dark/30';
    case 'blue':
      return 'bg-info/15 text-info dark:text-info-dark border-info/30 dark:border-info-dark/30';
    case 'purple':
      return 'bg-tertiary/15 text-tertiary dark:text-tertiary-dark border-tertiary/30 dark:border-tertiary-dark/30';
    case 'yellow':
    default:
      return 'bg-warning/15 text-warning dark:text-warning-dark border-warning/30 dark:border-warning-dark/30';
  }
};

const cleanSubtitle = (subtitle?: string): string => {
  if (!subtitle) return '';
  // Strip redundant calories mention from subtitle since it's displayed prominently on the right
  const cleaned = subtitle
    .replace(/\s*·\s*\d+\s*kcal/i, '')
    .replace(/\s*\d+\s*kcal\s*·?\s*/i, '')
    .trim();
  return cleaned;
};

export default function MealCategoryCard({
  type,
  title,
  icon,
  items,
  onAddPress,
  onScanPress,
  onDeleteItem,
}: MealCategoryCardProps) {
  const totalCalories = items.reduce((acc, item) => acc + (item.calories || 0), 0);
  const totalProtein = items.reduce((acc, item) => acc + (item.protein || 0), 0);

  return (
    <View
      className="bg-surface dark:bg-surface-dark rounded-2xl p-4 mb-3 border border-input-border dark:border-input-border-dark"
      style={Platform.select({
        web: { boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)' } as any,
        default: { elevation: 1 },
      })}
    >
      {/* Category Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-8 h-8 rounded-xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mr-2.5">
            <Text className="text-sm">{icon}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-primary dark:text-text-primary-dark font-black text-sm" numberOfLines={1}>
              {title}
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-medium" numberOfLines={1}>
              {items.length} {items.length === 1 ? 'item' : 'items'} ·{' '}
              <Text className="font-bold text-accent dark:text-accent-dark">{totalCalories} kcal</Text>
              {totalProtein > 0 ? ` · ${totalProtein}g protein` : ''}
            </Text>
          </View>
        </View>

        {/* Header Action Buttons */}
        <View className="flex-row items-center gap-1.5">
          {onScanPress ? (
            <TouchableOpacity
              onPress={() => onScanPress(type)}
              activeOpacity={0.7}
              className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-2.5 py-1.5 rounded-xl flex-row items-center"
            >
              <Text className="text-xs">📸</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => onAddPress(type)}
            activeOpacity={0.7}
            className="bg-accent/15 dark:bg-accent-dark/20 border border-accent/30 dark:border-accent-dark/30 px-3 py-1.5 rounded-xl flex-row items-center"
          >
            <Text className="text-accent dark:text-accent-dark font-extrabold text-xs mr-0.5">+</Text>
            <Text className="text-accent dark:text-accent-dark font-black text-xs">Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Items List or Empty State */}
      {items.length === 0 ? (
        <View className="py-3.5 px-3 items-center justify-center bg-input/30 dark:bg-input-dark/30 rounded-2xl border border-dashed border-input-border dark:border-input-border-dark">
          <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center font-medium">
            Nothing logged for {title.toLowerCase()} yet.
          </Text>
          <View className="flex-row items-center gap-2 mt-2.5">
            {onScanPress ? (
              <TouchableOpacity
                onPress={() => onScanPress(type)}
                activeOpacity={0.75}
                className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-3 py-1.5 rounded-xl flex-row items-center"
              >
                <Text className="text-xs mr-1">📸</Text>
                <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-[11px]">
                  Scan Meal
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={() => onAddPress(type)}
              activeOpacity={0.75}
              className="bg-accent dark:bg-accent-dark px-3 py-1.5 rounded-xl flex-row items-center"
            >
              <Text className="text-background dark:text-background-dark font-black text-[11px]">
                + Add Food
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="gap-2">
          {items.map((item) => {
            const displaySubtitle = cleanSubtitle(item.subtitle);
            return (
              <View
                key={item.id}
                className="bg-input/50 dark:bg-input-dark/60 rounded-2xl p-3 border border-input-border/60 dark:border-input-border-dark/60 flex-row items-center justify-between"
              >
                {/* Left: Info */}
                <View className="flex-row items-center flex-1 pr-2.5">
                  {item.imageUri ? (
                    <Image
                      source={{ uri: item.imageUri }}
                      className="w-11 h-11 rounded-xl mr-3 bg-black/10"
                      resizeMode="cover"
                    />
                  ) : item.icon ? (
                    <View className="w-11 h-11 rounded-xl mr-3 bg-surface dark:bg-surface-dark border border-input-border/60 dark:border-input-border-dark/60 items-center justify-center">
                      <Text className="text-xl">{item.icon}</Text>
                    </View>
                  ) : null}

                  <View className="flex-1">
                    <View className="flex-row items-center flex-wrap gap-1.5 mb-0.5">
                      <Text
                        className="text-text-primary dark:text-text-primary-dark font-extrabold text-xs leading-tight"
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      {item.goalBadge ? (
                        <View className={`px-1.5 py-0.5 rounded-md border ${getBadgeStyle(item.goalBadgeColor)}`}>
                          <Text className="text-[9px] font-black uppercase tracking-wide">
                            {item.goalBadge}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {displaySubtitle ? (
                      <Text
                        className="text-text-muted dark:text-text-muted-dark text-[11px] mb-1 font-medium leading-snug"
                        numberOfLines={1}
                      >
                        {displaySubtitle}
                      </Text>
                    ) : null}

                    {/* Macro Pills - Clean and Professional */}
                    <View className="flex-row flex-wrap gap-1">
                      <View className="bg-surface dark:bg-surface-dark px-2 py-1 rounded-full border border-input-border/70 dark:border-input-border-dark/70">
                        <Text className="text-[9.5px] font-extrabold text-accent dark:text-accent-dark">
                          {item.protein}g Proteins
                        </Text>
                      </View>
                      <View className="bg-surface dark:bg-surface-dark px-2 py-1 rounded-full border border-input-border/70 dark:border-input-border-dark/70">
                        <Text className="text-[9.5px] font-extrabold text-info dark:text-info-dark">
                          {item.carbs}g Carbs
                        </Text>
                      </View>
                      <View className="bg-surface dark:bg-surface-dark px-2 py-1 rounded-full border border-input-border/70 dark:border-input-border-dark/70">
                        <Text className="text-[9.5px] font-extrabold text-tertiary dark:text-tertiary-dark">
                          {item.fat}g Fats
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Right: Circular Delete Pill & Calories */}
                <View className="items-end justify-between self-stretch pl-1">
                  <TouchableOpacity
                    onPress={() => onDeleteItem(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                    className="w-6 h-6 rounded-full bg-danger/10 dark:bg-danger-dark/20 items-center justify-center active:bg-danger/30"
                  >
                    <Text className="text-danger dark:text-danger-dark text-xs font-black leading-none">✕</Text>
                  </TouchableOpacity>

                  <View className="items-end mt-1.5">
                    <Text className="text-accent dark:text-accent-dark font-black text-sm">
                      {item.calories}
                    </Text>
                    <Text className="text-text-muted dark:text-text-muted-dark text-[9.5px] font-semibold -mt-0.5">
                      kcal
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
