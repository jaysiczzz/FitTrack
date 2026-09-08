import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { BeginnerStaple, MealType, getSmartMealType, MEAL_LABELS, MEAL_ICONS } from './foodLogTypes';
import { BEGINNER_STAPLES } from './staplesData';
import ModalCloseButton from '../ui/ModalCloseButton';
import FilterChip from '../ui/FilterChip';

export { BEGINNER_STAPLES };

interface QuickStaplesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectStaple: (staple: BeginnerStaple, targetMeal: MealType) => void;
  defaultMeal?: MealType;
}

export default function QuickStaplesModal({
  visible,
  onClose,
  onSelectStaple,
  defaultMeal,
}: QuickStaplesModalProps) {
  const [selectedMeal, setSelectedMeal] = useState<MealType>(defaultMeal || getSmartMealType());
  const [filter, setFilter] = useState<'ALL' | 'MUSCLE_GAIN' | 'WEIGHT_LOSS'>('ALL');

  useEffect(() => {
    if (visible) {
      setSelectedMeal(defaultMeal || getSmartMealType());
      setFilter('ALL');
    }
  }, [visible, defaultMeal]);

  const filteredStaples = BEGINNER_STAPLES.filter((s) => {
    if (filter === 'ALL') return true;
    return s.recommendedFor === filter || s.recommendedFor === 'BOTH';
  });

  const muscleGainCount = BEGINNER_STAPLES.filter(
    (s) => s.recommendedFor === 'MUSCLE_GAIN' || s.recommendedFor === 'BOTH'
  ).length;

  const weightLossCount = BEGINNER_STAPLES.filter(
    (s) => s.recommendedFor === 'WEIGHT_LOSS' || s.recommendedFor === 'BOTH'
  ).length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/65 justify-end">
        <View
          className="bg-surface dark:bg-surface-dark rounded-t-3xl h-[88%] p-5 border-t border-input-border dark:border-input-border-dark"
          style={Platform.select({
            web: { boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)' } as any,
            default: { elevation: 6 },
          })}
        >
          {/* Modal Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1 pr-2">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-text-primary dark:text-text-primary-dark font-black text-xl">
                  Fitness Staples 🥗
                </Text>
              </View>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
                Pre-calculated, high-nutrition staples with 1-tap logging
              </Text>
            </View>

            <ModalCloseButton onClose={onClose} />
          </View>

          {/* Add-To Meal Type Selector with Smart Badge */}
          <View className="mb-3.5">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-bold uppercase tracking-wider">
                Add To Meal:
              </Text>
              <View className="bg-accent/15 dark:bg-accent-dark/25 px-2 py-0.5 rounded-full border border-accent/20">
                <Text className="text-accent dark:text-accent-dark text-[10px] font-extrabold">
                  ✨ Auto-selected by time
                </Text>
              </View>
            </View>

            <View className="flex-row gap-1.5">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => {
                const isSelected = selectedMeal === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSelectedMeal(m)}
                    activeOpacity={0.8}
                    className={`flex-1 py-2 px-1 rounded-xl items-center border ${
                      isSelected
                        ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
                        : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                    }`}
                    style={
                      isSelected
                        ? (Platform.select({
                            web: { boxShadow: '0 2px 6px rgba(0, 179, 134, 0.25)' } as any,
                            default: { elevation: 1 },
                          }) as any)
                        : undefined
                    }
                  >
                    <Text className="text-xs mb-0.5">{MEAL_ICONS[m]}</Text>
                    <Text
                      className={`text-[11px] capitalize ${
                        isSelected
                          ? 'text-background dark:text-background-dark font-black'
                          : 'text-text-primary dark:text-text-primary-dark font-bold'
                      }`}
                    >
                      {MEAL_LABELS[m]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Goal Filter Chips */}
          <View className="flex-row gap-2 mb-3.5">
            <FilterChip
              label="All Staples"
              count={BEGINNER_STAPLES.length}
              selected={filter === 'ALL'}
              onPress={() => setFilter('ALL')}
            />
            <FilterChip
              label="Muscle Gain"
              icon="💪"
              count={muscleGainCount}
              selected={filter === 'MUSCLE_GAIN'}
              onPress={() => setFilter('MUSCLE_GAIN')}
              variant="accent"
            />
            <FilterChip
              label="Fat Loss"
              icon="🔥"
              count={weightLossCount}
              selected={filter === 'WEIGHT_LOSS'}
              onPress={() => setFilter('WEIGHT_LOSS')}
              variant="warning"
            />
          </View>

          {/* Staples List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {filteredStaples.map((staple) => (
              <TouchableOpacity
                key={staple.id}
                onPress={() => {
                  onSelectStaple(staple, selectedMeal);
                  onClose();
                }}
                activeOpacity={0.75}
                className="bg-surface dark:bg-surface-dark rounded-2xl p-3.5 mb-2.5 border border-input-border dark:border-input-border-dark flex-row justify-between items-center"
                style={Platform.select({
                  web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' } as any,
                  default: { elevation: 1 },
                })}
              >
                <View className="flex-1 pr-3">
                  {/* Goal Badge Pill */}
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <View
                      className={`px-2 py-0.5 rounded-md border ${
                        staple.recommendedFor === 'MUSCLE_GAIN'
                          ? 'bg-accent/10 dark:bg-accent-dark/20 border-accent/30 dark:border-accent-dark/30'
                          : staple.recommendedFor === 'WEIGHT_LOSS'
                          ? 'bg-warning/10 dark:bg-warning-dark/20 border-warning/30 dark:border-warning-dark/30'
                          : 'bg-info/10 dark:bg-info-dark/20 border-info/30 dark:border-info-dark/30'
                      }`}
                    >
                      <Text
                        className={`text-[9.5px] font-extrabold uppercase tracking-wide ${
                          staple.recommendedFor === 'MUSCLE_GAIN'
                            ? 'text-accent dark:text-accent-dark'
                            : staple.recommendedFor === 'WEIGHT_LOSS'
                            ? 'text-warning dark:text-warning-dark'
                            : 'text-info dark:text-info-dark'
                        }`}
                      >
                        {staple.badge}
                      </Text>
                    </View>
                  </View>

                  {/* Title & Icon */}
                  <View className="flex-row items-center gap-2 mb-1">
                    <View className="w-8 h-8 rounded-xl bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark">
                      <Text className="text-base">{staple.icon}</Text>
                    </View>
                    <Text
                      className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm flex-1"
                      numberOfLines={1}
                    >
                      {staple.title}
                    </Text>
                  </View>

                  {/* Subtitle / Portions */}
                  <Text
                    className="text-text-muted dark:text-text-muted-dark text-xs mb-2.5 leading-relaxed"
                    numberOfLines={2}
                  >
                    {staple.subtitle}
                  </Text>

                  {/* Macro Pills */}
                  <View className="flex-row gap-1.5">
                    <View className="bg-input dark:bg-input-dark px-2 py-0.5 rounded-lg border border-input-border dark:border-input-border-dark">
                      <Text className="text-[10px] font-extrabold text-accent dark:text-accent-dark">
                        🥩 {staple.protein}g P
                      </Text>
                    </View>
                    <View className="bg-input dark:bg-input-dark px-2 py-0.5 rounded-lg border border-input-border dark:border-input-border-dark">
                      <Text className="text-[10px] font-extrabold text-info dark:text-info-dark">
                        🍚 {staple.carbs}g C
                      </Text>
                    </View>
                    <View className="bg-input dark:bg-input-dark px-2 py-0.5 rounded-lg border border-input-border dark:border-input-border-dark">
                      <Text className="text-[10px] font-extrabold text-tertiary dark:text-tertiary-dark">
                        🥑 {staple.fat}g F
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Calories & 1-Tap Log Button */}
                <View className="items-end justify-center pl-1">
                  <Text className="text-accent dark:text-accent-dark font-black text-lg">
                    {staple.calories}
                  </Text>
                  <Text className="text-text-muted dark:text-text-muted-dark text-[10px] -mt-0.5 mb-2.5 font-semibold">
                    kcal
                  </Text>
                  <View className="bg-accent dark:bg-accent-dark px-3 py-1.5 rounded-xl shadow-xs">
                    <Text className="text-background dark:text-background-dark font-black text-xs">
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
