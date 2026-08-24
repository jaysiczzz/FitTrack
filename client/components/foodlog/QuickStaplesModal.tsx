import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { BeginnerStaple, MealType, getSmartMealType, MEAL_LABELS, MEAL_ICONS } from './foodLogTypes';

interface QuickStaplesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectStaple: (staple: BeginnerStaple, targetMeal: MealType) => void;
  defaultMeal?: MealType;
}

export const BEGINNER_STAPLES: BeginnerStaple[] = [
  {
    id: 's1',
    title: 'Grilled Chicken & White Rice',
    subtitle: '150g breast · 1 cup steamed rice · 1/2 cup broccoli',
    calories: 410,
    protein: 42,
    carbs: 45,
    fat: 4,
    recommendedFor: 'MUSCLE_GAIN',
    badge: 'High Protein Staple',
    icon: '🍗',
  },
  {
    id: 's2',
    title: 'Whey Protein Shake & Banana',
    subtitle: '1 scoop whey protein (25g) · 1 medium banana · water',
    calories: 225,
    protein: 26,
    carbs: 28,
    fat: 2,
    recommendedFor: 'BOTH',
    badge: 'Post-Workout Fuel',
    icon: '🥛',
  },
  {
    id: 's3',
    title: 'Boiled Eggs & Whole Wheat Toast',
    subtitle: '2 large whole eggs · 2 slices whole wheat toast',
    calories: 290,
    protein: 18,
    carbs: 24,
    fat: 11,
    recommendedFor: 'BOTH',
    badge: 'Classic Breakfast',
    icon: '🍳',
  },
  {
    id: 's4',
    title: 'Greek Yogurt with Berries & Honey',
    subtitle: '170g non-fat Greek yogurt · 1/2 cup berries · 1 tsp honey',
    calories: 185,
    protein: 19,
    carbs: 23,
    fat: 1,
    recommendedFor: 'WEIGHT_LOSS',
    badge: 'Low Calorie & High Protein',
    icon: '🫐',
  },
  {
    id: 's5',
    title: 'Tuna & Avocado Mixed Salad',
    subtitle: '1 can chunk light tuna · 1/2 avocado · mixed greens & lemon',
    calories: 280,
    protein: 34,
    carbs: 8,
    fat: 13,
    recommendedFor: 'WEIGHT_LOSS',
    badge: 'Lean Fat Loss',
    icon: '🥗',
  },
  {
    id: 's6',
    title: 'Oatmeal with Peanut Butter',
    subtitle: '1 cup cooked oats · 1 tbsp natural peanut butter · cinnamon',
    calories: 330,
    protein: 11,
    carbs: 48,
    fat: 12,
    recommendedFor: 'MUSCLE_GAIN',
    badge: 'Slow-Digesting Energy',
    icon: '🥣',
  },
  {
    id: 's7',
    title: 'Salmon Fillet & Roasted Sweet Potato',
    subtitle: '150g baked salmon · 150g baked sweet potato',
    calories: 420,
    protein: 35,
    carbs: 32,
    fat: 16,
    recommendedFor: 'MUSCLE_GAIN',
    badge: 'Omega-3 Rich Recovery',
    icon: '🐟',
  },
  {
    id: 's8',
    title: 'Cottage Cheese & Apple Slices',
    subtitle: '1 cup low-fat cottage cheese · 1 sliced red apple',
    calories: 220,
    protein: 24,
    carbs: 26,
    fat: 2,
    recommendedFor: 'WEIGHT_LOSS',
    badge: 'Casein Night Snack',
    icon: '🍏',
  },
];

export default function QuickStaplesModal({
  visible,
  onClose,
  onSelectStaple,
  defaultMeal,
}: QuickStaplesModalProps) {
  const [selectedMeal, setSelectedMeal] = useState<MealType>(defaultMeal || getSmartMealType());
  const [filter, setFilter] = useState<'ALL' | 'MUSCLE_GAIN' | 'WEIGHT_LOSS'>('ALL');

  React.useEffect(() => {
    if (visible) {
      setSelectedMeal(defaultMeal || getSmartMealType());
    }
  }, [visible, defaultMeal]);

  const filteredStaples = BEGINNER_STAPLES.filter((s) => {
    if (filter === 'ALL') return true;
    return s.recommendedFor === filter || s.recommendedFor === 'BOTH';
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface dark:bg-surface-dark rounded-t-[28px] max-h-[85%] p-5 border-t border-input-border dark:border-input-border-dark shadow-2xl">
          {/* Modal Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-text-primary dark:text-text-primary-dark font-black text-xl">
                Beginner Fitness Staples 🥗
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">
                Pre-calculated, high-nutrition staples with 1-tap logging
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-input dark:bg-input-dark items-center justify-center"
            >
              <Text className="text-text-primary dark:text-text-primary-dark font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Add-To Meal Type Selector with Smart Badge */}
          <View className="mb-3">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-bold uppercase">
                Add To Meal:
              </Text>
              <View className="bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                <Text className="text-emerald-500 dark:text-emerald-400 text-[10px] font-extrabold">
                  ✨ Auto-selected by time
                </Text>
              </View>
            </View>

            <View className="flex-row gap-1.5">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setSelectedMeal(m)}
                  activeOpacity={0.8}
                  className={`flex-1 py-1.5 px-1 rounded-xl items-center border ${
                    selectedMeal === m
                      ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark shadow-xs'
                      : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                  }`}
                >
                  <Text className="text-xs mb-0.5">{MEAL_ICONS[m]}</Text>
                  <Text
                    className={`text-[11px] font-bold capitalize ${
                      selectedMeal === m
                        ? 'text-background dark:text-background-dark font-black'
                        : 'text-text-primary dark:text-text-primary-dark'
                    }`}
                  >
                    {MEAL_LABELS[m]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Goal Filter Chips */}
          <View className="flex-row gap-2 mb-3">
            <TouchableOpacity
              onPress={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-full border ${
                filter === 'ALL'
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  filter === 'ALL'
                    ? 'text-accent dark:text-accent-dark'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                All Staples
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilter('MUSCLE_GAIN')}
              className={`px-3 py-1 rounded-full border ${
                filter === 'MUSCLE_GAIN'
                  ? 'bg-emerald-500/15 border-emerald-500'
                  : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  filter === 'MUSCLE_GAIN'
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                💪 Muscle Gain
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilter('WEIGHT_LOSS')}
              className={`px-3 py-1 rounded-full border ${
                filter === 'WEIGHT_LOSS'
                  ? 'bg-orange-500/15 border-orange-500'
                  : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  filter === 'WEIGHT_LOSS'
                    ? 'text-orange-500 dark:text-orange-400'
                    : 'text-text-muted dark:text-text-muted-dark'
                }`}
              >
                🔥 Fat Loss
              </Text>
            </TouchableOpacity>
          </View>

          {/* Staples List */}
          <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
            {filteredStaples.map((staple) => (
              <TouchableOpacity
                key={staple.id}
                onPress={() => {
                  onSelectStaple(staple, selectedMeal);
                  onClose();
                }}
                activeOpacity={0.8}
                className="bg-input/60 dark:bg-input-dark/60 rounded-2xl p-3.5 mb-2.5 border border-input-border/80 dark:border-input-border-dark/80 flex-row justify-between items-center"
              >
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Text className="text-lg">{staple.icon}</Text>
                    <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
                      {staple.title}
                    </Text>
                  </View>
                  <Text className="text-text-muted dark:text-text-muted-dark text-xs mb-2">
                    {staple.subtitle}
                  </Text>

                  <View className="flex-row gap-1.5">
                    <View className="bg-surface dark:bg-surface-dark px-2 py-0.5 rounded-md border border-input-border dark:border-input-border-dark">
                      <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {staple.protein}g Protein
                      </Text>
                    </View>
                    <View className="bg-surface dark:bg-surface-dark px-2 py-0.5 rounded-md border border-input-border dark:border-input-border-dark">
                      <Text className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                        {staple.carbs}g Carbs
                      </Text>
                    </View>
                    <View className="bg-surface dark:bg-surface-dark px-2 py-0.5 rounded-md border border-input-border dark:border-input-border-dark">
                      <Text className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        {staple.fat}g Fat
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="items-end justify-center">
                  <Text className="text-accent dark:text-accent-dark font-black text-base">
                    {staple.calories}
                  </Text>
                  <Text className="text-text-muted dark:text-text-muted-dark text-[10px] mb-2">kcal</Text>
                  <View className="bg-accent dark:bg-accent-dark px-3 py-1.5 rounded-xl">
                    <Text className="text-background dark:text-background-dark font-bold text-xs">
                      + Log
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
