import React, { useState, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { MealCombo } from '../../data/mealCombos';
import { MealType, MEAL_LABELS } from './foodLogTypes';
import ModalCloseButton from '../ui/ModalCloseButton';

interface MealComboDetailsModalProps {
  visible: boolean;
  combo: MealCombo | null;
  defaultMeal?: MealType;
  onClose: () => void;
  onLogCombo: (combo: MealCombo, scaleFactor: number, targetMeal: MealType) => void;
}

export default function MealComboDetailsModal({
  visible,
  combo,
  defaultMeal = 'lunch',
  onClose,
  onLogCombo,
}: MealComboDetailsModalProps) {
  const { colors, isDark } = useThemeColors();
  const [scaleFactor, setScaleFactor] = useState<number>(1.0);
  const [targetMeal, setTargetMeal] = useState<MealType>(defaultMeal);

  React.useEffect(() => {
    if (combo) {
      setScaleFactor(1.0);
      setTargetMeal(combo.mealType || defaultMeal);
    }
  }, [combo, defaultMeal]);

  if (!combo) return null;

  // Scaled macros
  const scaledCalories = Math.round(combo.calories * scaleFactor);
  const scaledProtein = Math.round(combo.protein * scaleFactor);
  const scaledCarbs = Math.round(combo.carbs * scaleFactor);
  const scaledFat = Math.round(combo.fat * scaleFactor);
  const scaledFiber = Math.round((combo.fiber || 0) * scaleFactor);

  // Macro calorie ratios
  const totalMacroCals = scaledProtein * 4 + scaledCarbs * 4 + scaledFat * 9;
  const proteinPct = totalMacroCals > 0 ? Math.round(((scaledProtein * 4) / totalMacroCals) * 100) : 0;
  const carbsPct = totalMacroCals > 0 ? Math.round(((scaledCarbs * 4) / totalMacroCals) * 100) : 0;
  const fatPct = totalMacroCals > 0 ? 100 - proteinPct - carbsPct : 0;

  const handleConfirm = () => {
    onLogCombo(combo, scaleFactor, targetMeal);
    onClose();
  };

  const goalBadgeColor =
    combo.goal === 'High Protein'
      ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
      : combo.goal === 'Fat Loss'
      ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
      : combo.goal === 'Post-Workout'
      ? 'bg-sky-500/15 text-sky-500 border-sky-500/30'
      : combo.goal === 'Clean Bulking'
      ? 'bg-purple-500/15 text-purple-500 border-purple-500/30'
      : 'bg-amber-500/15 text-amber-500 border-amber-500/30';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/75 justify-end">
        <View className="bg-background dark:bg-background-dark rounded-t-3xl h-[88%] border-t border-input-border dark:border-input-border-dark overflow-hidden">
          {/* Header */}
          <View className="px-5 py-4 border-b border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1 pr-3">
              <View className="w-12 h-12 rounded-2xl bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark">
                <Text className="text-2xl">{combo.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark" numberOfLines={1}>
                  {combo.title}
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  ⏱️ {combo.prepTimeMinutes} min prep • {combo.goal}
                </Text>
              </View>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Tagline & Goal Banner */}
            <View className="p-3.5 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark mb-4">
              <View className="flex-row items-center justify-between mb-1.5">
                <View className={`px-2.5 py-0.5 rounded-full border ${goalBadgeColor}`}>
                  <Text className="text-[10px] font-extrabold uppercase tracking-wider">
                    {combo.goal}
                  </Text>
                </View>
                <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
                  Ideal for: {MEAL_LABELS[combo.mealType]}
                </Text>
              </View>
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-1">
                {combo.tagline}
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-4">
                {combo.description}
              </Text>
            </View>

            {/* Portion Scaler Selector */}
            <View className="mb-4">
              <Text className="text-xs font-extrabold text-accent dark:text-accent-dark uppercase tracking-wider mb-2">
                Adjust Meal Portion
              </Text>
              <View className="flex-row bg-input dark:bg-input-dark p-1 rounded-2xl border border-input-border dark:border-input-border-dark">
                {[
                  { label: '0.75x (Light)', val: 0.75 },
                  { label: '1.0x (Standard)', val: 1.0 },
                  { label: '1.25x (Hearty)', val: 1.25 },
                  { label: '1.5x (Bulking)', val: 1.5 },
                ].map((tier) => {
                  const active = scaleFactor === tier.val;
                  return (
                    <TouchableOpacity
                      key={tier.val}
                      onPress={() => setScaleFactor(tier.val)}
                      activeOpacity={0.8}
                      className={`flex-1 py-2 rounded-xl items-center justify-center ${
                        active ? 'bg-accent dark:bg-accent-dark' : ''
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          active ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'
                        }`}
                      >
                        {tier.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Scaled Macro Nutrition Card */}
            <View className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark mb-4">
              <View className="flex-row items-baseline justify-between mb-3">
                <View>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark font-medium">
                    Total Energy
                  </Text>
                  <Text className="text-2xl font-black text-text-primary dark:text-text-primary-dark">
                    {scaledCalories} <Text className="text-xs font-normal text-text-muted">kcal</Text>
                  </Text>
                </View>

                {/* Macro Ratio Split Badges */}
                <View className="flex-row items-center gap-1.5">
                  <View className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30">
                    <Text className="text-[10px] font-bold text-emerald-500">P: {proteinPct}%</Text>
                  </View>
                  <View className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30">
                    <Text className="text-[10px] font-bold text-sky-500">C: {carbsPct}%</Text>
                  </View>
                  <View className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30">
                    <Text className="text-[10px] font-bold text-amber-500">F: {fatPct}%</Text>
                  </View>
                </View>
              </View>

              {/* Macro Progress Bar */}
              <View className="h-2 rounded-full overflow-hidden flex-row bg-input dark:bg-input-dark mb-3.5">
                <View style={{ width: `${proteinPct}%`, backgroundColor: '#10B981' }} />
                <View style={{ width: `${carbsPct}%`, backgroundColor: '#0EA5E9' }} />
                <View style={{ width: `${fatPct}%`, backgroundColor: '#F59E0B' }} />
              </View>

              {/* Detailed Macro Grid */}
              <View className="flex-row justify-between pt-2 border-t border-input-border/60 dark:border-input-border-dark/60">
                <View className="items-center flex-1">
                  <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Protein</Text>
                  <Text className="text-base font-black text-emerald-500 mt-0.5">{scaledProtein}g</Text>
                </View>
                <View className="items-center flex-1 border-x border-input-border/60 dark:border-input-border-dark/60">
                  <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Carbs</Text>
                  <Text className="text-base font-black text-sky-500 mt-0.5">{scaledCarbs}g</Text>
                </View>
                <View className="items-center flex-1 border-r border-input-border/60 dark:border-input-border-dark/60">
                  <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Fats</Text>
                  <Text className="text-base font-black text-amber-500 mt-0.5">{scaledFat}g</Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">Fiber</Text>
                  <Text className="text-base font-black text-purple-400 mt-0.5">{scaledFiber}g</Text>
                </View>
              </View>
            </View>

            {/* Target Meal Selector */}
            <View className="mb-4">
              <Text className="text-xs font-extrabold text-accent dark:text-accent-dark uppercase tracking-wider mb-2">
                Log Into Which Meal?
              </Text>
              <View className="flex-row gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => {
                  const isSelected = targetMeal === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setTargetMeal(m)}
                      activeOpacity={0.8}
                      className={`flex-1 py-2 rounded-xl items-center justify-center border ${
                        isSelected
                          ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
                          : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'
                        }`}
                      >
                        {MEAL_LABELS[m]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Ingredients Breakdown */}
            <View className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark mb-4">
              <Text className="text-xs font-extrabold text-accent dark:text-accent-dark uppercase tracking-wider mb-3">
                Recipe Ingredients & Exact Portions ({scaleFactor}x)
              </Text>
              <View className="gap-2.5">
                {combo.ingredients.map((ing, idx) => (
                  <View
                    key={idx}
                    className="p-2.5 rounded-xl bg-input dark:bg-input-dark border border-input-border/60 flex-row items-center justify-between"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                        {ing.name}
                      </Text>
                      <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
                        {ing.portion}
                      </Text>
                    </View>
                    {ing.calories ? (
                      <View className="items-end">
                        <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                          {Math.round(ing.calories * scaleFactor)} kcal
                        </Text>
                        <Text className="text-[10px] text-emerald-500 font-semibold">
                          {Math.round((ing.protein || 0) * scaleFactor)}g protein
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>

            {/* Chef / Prep Tips */}
            {combo.prepTips && combo.prepTips.length > 0 && (
              <View className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark mb-4">
                <Text className="text-xs font-extrabold text-accent dark:text-accent-dark uppercase tracking-wider mb-2 flex-row items-center gap-1">
                  💡 Chef & Nutritionist Prep Tips
                </Text>
                {combo.prepTips.map((tip, idx) => (
                  <Text key={idx} className="text-xs text-text-muted dark:text-text-muted-dark leading-5 mb-1">
                    • {tip}
                  </Text>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Button */}
          <View className="p-4 border-t border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark">
            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.8}
              className="bg-accent dark:bg-accent-dark py-3.5 rounded-2xl items-center flex-row justify-center gap-2 shadow-sm"
            >
              <Ionicons name="flash" size={16} color="#FFFFFF" />
              <Text className="text-white font-bold text-sm">
                Log Entire Meal ({scaledCalories} kcal) to {MEAL_LABELS[targetMeal]}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
