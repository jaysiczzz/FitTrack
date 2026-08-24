import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FoodLogItem, MealType } from './foodLogTypes';

interface MealCategoryCardProps {
  type: MealType;
  title: string;
  icon: string;
  items: FoodLogItem[];
  onAddPress: (type: MealType) => void;
  onDeleteItem: (id: string) => void;
}

const getBadgeStyle = (color?: 'green' | 'blue' | 'yellow' | 'purple') => {
  switch (color) {
    case 'green':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    case 'blue':
      return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30';
    case 'purple':
      return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
    case 'yellow':
    default:
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
  }
};

export default function MealCategoryCard({
  type,
  title,
  icon,
  items,
  onAddPress,
  onDeleteItem,
}: MealCategoryCardProps) {
  const totalCalories = items.reduce((acc, item) => acc + (item.calories || 0), 0);
  const totalProtein = items.reduce((acc, item) => acc + (item.protein || 0), 0);

  return (
    <View className="bg-surface dark:bg-surface-dark rounded-[20px] p-4 mb-3.5 border border-input-border dark:border-input-border-dark">
      {/* Category Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Text className="text-xl mr-2">{icon}</Text>
          <View>
            <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-base">
              {title}
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-xs">
              {items.length} {items.length === 1 ? 'item' : 'items'} ·{' '}
              <Text className="font-bold text-accent dark:text-accent-dark">{totalCalories} kcal</Text>
              {totalProtein > 0 ? ` · ${totalProtein}g protein` : ''}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onAddPress(type)}
          activeOpacity={0.8}
          className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-3 py-1.5 rounded-xl flex-row items-center"
        >
          <Text className="text-accent dark:text-accent-dark font-bold text-xs mr-1">+</Text>
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs">Add</Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      {items.length === 0 ? (
        <View className="py-3 px-2 items-center justify-center bg-input/40 dark:bg-input-dark/40 rounded-xl border border-dashed border-input-border dark:border-input-border-dark">
          <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center">
            No foods logged for {title.toLowerCase()} yet.
          </Text>
          <TouchableOpacity onPress={() => onAddPress(type)} className="mt-1">
            <Text className="text-accent dark:text-accent-dark text-xs font-bold">
              Tap + Add to log or scan
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="gap-2">
          {items.map((item) => (
            <View
              key={item.id}
              className="bg-input/60 dark:bg-input-dark/60 rounded-xl p-3 border border-input-border/70 dark:border-input-border-dark/70 flex-row justify-between items-center"
            >
              <View className="flex-1 pr-3">
                <View className="flex-row items-center flex-wrap gap-1.5 mb-1">
                  <Text className="text-text-primary dark:text-text-primary-dark text-sm font-bold">
                    {item.title}
                  </Text>
                  {item.goalBadge ? (
                    <View className={`px-2 py-0.5 rounded-md border ${getBadgeStyle(item.goalBadgeColor)}`}>
                      <Text className="text-[10px] font-bold">{item.goalBadge}</Text>
                    </View>
                  ) : null}
                </View>

                {item.subtitle ? (
                  <Text className="text-text-muted dark:text-text-muted-dark text-xs mb-1.5">
                    {item.subtitle}
                  </Text>
                ) : null}

                {/* Macro Pills */}
                <View className="flex-row flex-wrap gap-1.5">
                  <View className="bg-surface dark:bg-surface-dark px-2 py-0.5 rounded-md border border-input-border dark:border-input-border-dark">
                    <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {item.protein}g Protein
                    </Text>
                  </View>
                  <View className="bg-surface dark:bg-surface-dark px-2 py-0.5 rounded-md border border-input-border dark:border-input-border-dark">
                    <Text className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                      {item.carbs}g Carbs
                    </Text>
                  </View>
                  <View className="bg-surface dark:bg-surface-dark px-2 py-0.5 rounded-md border border-input-border dark:border-input-border-dark">
                    <Text className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      {item.fat}g Fat
                    </Text>
                  </View>
                </View>
              </View>

              {/* Right: Calories and Delete */}
              <View className="items-end justify-between self-stretch">
                <TouchableOpacity
                  onPress={() => onDeleteItem(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="p-1 rounded-md active:bg-red-500/20"
                >
                  <Text className="text-red-500/70 text-xs font-bold">✕</Text>
                </TouchableOpacity>

                <View className="items-end mt-2">
                  <Text className="text-text-primary dark:text-text-primary-dark font-black text-sm">
                    {item.calories}
                  </Text>
                  <Text className="text-text-muted dark:text-text-muted-dark text-[10px]">kcal</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
