import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodLogItem, MealType, getSmartFoodBadge, getBadgeStyles } from './foodLogTypes';
import { useThemeColors } from '@/constants/colors';
import SurfaceCard from '../ui/SurfaceCard';

interface MealCategoryCardProps {
  type: MealType;
  title: string;
  icon?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  items: FoodLogItem[];
  onAddPress: (type: MealType) => void;
  onScanPress?: (type: MealType) => void;
  onDeleteItem: (id: string) => void;
  onEditItem?: (item: FoodLogItem) => void;
}

const MEAL_CATEGORY_ICONS: Record<MealType, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'sunny',
  lunch: 'restaurant',
  dinner: 'moon',
  snack: 'cafe',
};

const cleanSubtitle = (subtitle?: string): string => {
  if (!subtitle) return '';
  const cleaned = subtitle
    .replace(/\s*·\s*\d+\s*kcal/i, '')
    .replace(/\s*·\s*\d+g\s*protein/i, '')
    .trim();
  return cleaned;
};

export default function MealCategoryCard({
  type,
  title,
  iconName,
  items,
  onAddPress,
  onScanPress,
  onDeleteItem,
  onEditItem,
}: MealCategoryCardProps) {
  const { colors } = useThemeColors();
  const totalCalories = items.reduce((acc, item) => acc + (item.calories || 0), 0);
  const totalProtein = items.reduce((acc, item) => acc + (item.protein || 0), 0);

  return (
    <SurfaceCard className="mb-3">
      {/* Category Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center">
            <Ionicons
              name={iconName || MEAL_CATEGORY_ICONS[type] || 'restaurant'}
              size={15}
              color={colors.accent}
              style={{ marginRight: 6 }}
            />
            <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm" numberOfLines={1}>
              {title}
            </Text>
          </View>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs font-normal mt-0.5" numberOfLines={1}>
            {items.length} {items.length === 1 ? 'item' : 'items'} ·{' '}
            <Text className="font-semibold text-text-primary dark:text-text-primary-dark">{totalCalories} kcal</Text>
            {totalProtein > 0 ? ` · ${totalProtein}g protein` : ''}
          </Text>
        </View>

        {/* Header Actions */}
        <View className="flex-row items-center gap-1.5">
          {onScanPress ? (
            <TouchableOpacity
              onPress={() => onScanPress(type)}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-lg bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
              accessibilityLabel={`Scan ${title}`}
            >
              <Ionicons name="camera" size={17} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => onAddPress(type)}
            activeOpacity={0.7}
            className="h-8 px-3 rounded-lg bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
          >
            <Text className="text-accent dark:text-accent-dark font-bold text-xs">+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Items List or Single Pressable Empty State */}
      {items.length === 0 ? (
        <TouchableOpacity
          onPress={() => onAddPress(type)}
          activeOpacity={0.7}
          className="py-3.5 px-3 items-center justify-center bg-input/40 dark:bg-input-dark/40 rounded-xl border border-dashed border-input-border dark:border-input-border-dark"
        >
          <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center">
            No foods logged yet. Tap to add.
          </Text>
        </TouchableOpacity>
      ) : (
        <View className="gap-2">
          {items.map((item) => {
            const displaySubtitle = cleanSubtitle(item.subtitle);

            return (
              <View
                key={item.id}
                className="bg-input dark:bg-input-dark rounded-xl p-3 border border-input-border dark:border-input-border-dark flex-row items-center justify-between"
              >
                {/* Left: Info (Tap to Edit) */}
                <TouchableOpacity
                  onPress={() => onEditItem?.(item)}
                  activeOpacity={0.7}
                  className="flex-row items-center flex-1 pr-2.5"
                >
                  {item.imageUri ? (
                    <Image
                      source={{ uri: item.imageUri }}
                      className="w-10 h-10 rounded-lg mr-2.5 bg-black/10"
                      resizeMode="cover"
                    />
                  ) : item.icon ? (
                    <View className="w-10 h-10 rounded-lg mr-2.5 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center">
                      <Text className="text-base">{item.icon}</Text>
                    </View>
                  ) : null}

                  <View className="flex-1">
                    <Text
                      className="text-text-primary dark:text-text-primary-dark font-bold text-xs leading-tight mb-0.5"
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>

                    {displaySubtitle ? (
                      <Text
                        className="text-text-muted dark:text-text-muted-dark text-[11px] mb-1 leading-snug"
                        numberOfLines={1}
                      >
                        {displaySubtitle}
                      </Text>
                    ) : null}

                    {/* Macro Line */}
                    <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                      <Text className="font-semibold text-text-primary dark:text-text-primary-dark">{item.protein}g</Text> P ·{' '}
                      <Text className="font-semibold text-text-primary dark:text-text-primary-dark">{item.carbs}g</Text> C ·{' '}
                      <Text className="font-semibold text-text-primary dark:text-text-primary-dark">{item.fat}g</Text> F
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Right: Calories & Delete */}
                <View className="items-end justify-between pl-2">
                  <TouchableOpacity
                    onPress={() => onDeleteItem(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                    className="w-5 h-5 rounded-full items-center justify-center mb-1"
                  >
                    <Ionicons name="trash" size={15} color={colors.danger} />
                  </TouchableOpacity>

                  <Text className="text-text-primary dark:text-text-primary-dark font-black text-sm">
                    {item.calories} <Text className="text-[10px] font-normal text-text-muted dark:text-text-muted-dark">kcal</Text>
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </SurfaceCard>
  );
}
