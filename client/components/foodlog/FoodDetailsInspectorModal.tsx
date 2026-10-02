import React, { useState, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { FoodCatalogItem, scaleFoodMacros, ScaledNutrition } from '../../data/commonFoods';
import { MealType, MEAL_LABELS, FoodLogItem, getSmartFoodBadge } from './foodLogTypes';
import ModalCloseButton from '../ui/ModalCloseButton';

interface FoodDetailsInspectorModalProps {
  visible: boolean;
  food: FoodCatalogItem | null;
  defaultMeal?: MealType;
  onClose: () => void;
  onConfirmLog: (logItem: FoodLogItem) => void;
}

export default function FoodDetailsInspectorModal({
  visible,
  food,
  defaultMeal = 'lunch',
  onClose,
  onConfirmLog,
}: FoodDetailsInspectorModalProps) {
  const { colors, isDark } = useThemeColors();
  const [portionMode, setPortionMode] = useState<'grams' | 'servings'>('grams');
  const [amountInput, setAmountInput] = useState<string>('100');
  const [targetMeal, setTargetMeal] = useState<MealType>(defaultMeal);

  React.useEffect(() => {
    if (food) {
      if (!food.servingWeightG || food.servingWeightG <= 0) {
        setPortionMode('servings');
        setAmountInput('1');
      } else {
        setPortionMode('grams');
        setAmountInput(String(food.servingWeightG || 100));
      }
      setTargetMeal(defaultMeal);
    }
  }, [food, defaultMeal]);

  const numAmount = useMemo(() => {
    const parsed = parseFloat(amountInput);
    return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
  }, [amountInput]);

  const scaled = useMemo<ScaledNutrition>(() => {
    if (!food) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return scaleFoodMacros(food, numAmount, portionMode);
  }, [food, numAmount, portionMode]);

  if (!food) return null;

  // Reference standards for standard 2,000 kcal daily diet (FDA / EFSA)
  const DV_FAT = 78;
  const DV_SAT_FAT = 20;
  const DV_CHOLESTEROL = 300;
  const DV_SODIUM = 2300;
  const DV_CARBS = 275;
  const DV_FIBER = 28;
  const DV_PROTEIN = 50;
  const DV_POTASSIUM = 4700;

  const pctDV = (val?: number, standard: number = 100) =>
    val != null && val > 0 ? Math.round((val / standard) * 100) : null;

  // Calorie Contribution Split
  const pCals = scaled.protein * 4;
  const cCals = scaled.carbs * 4;
  const fCals = scaled.fat * 9;
  const totalCals = Math.max(1, pCals + cCals + fCals);
  const pPct = Math.round((pCals / totalCals) * 100);
  const cPct = Math.round((cCals / totalCals) * 100);
  const fPct = Math.max(0, 100 - pPct - cPct);

  const handleAdd = () => {
    const portionDesc =
      portionMode === 'grams'
        ? `${numAmount}g`
        : `${numAmount} ${food.servingUnit || 'serving'}`;

    const displaySubtitle = food.brand
      ? `${portionDesc} · ${food.brand}`
      : food.ingredients
      ? `${portionDesc} · ${food.ingredients.slice(0, 60)}`
      : portionDesc;

    const smartBadge = getSmartFoodBadge({
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
      fiber: scaled.fiber,
      category: food.category,
      brand: food.brand,
      name: food.name,
    });

    const newLogItem: FoodLogItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      mealType: targetMeal,
      title: food.name,
      subtitle: displaySubtitle,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
      goalBadge: smartBadge.badge,
      goalBadgeColor: smartBadge.color,
      icon: food.icon,
      imageUri: food.imageUri,
    };

    onConfirmLog(newLogItem);
    onClose();
  };

  const nutriscoreColor =
    food.nutriscore === 'A'
      ? 'bg-emerald-600 text-white'
      : food.nutriscore === 'B'
      ? 'bg-emerald-500 text-white'
      : food.nutriscore === 'C'
      ? 'bg-amber-500 text-white'
      : food.nutriscore === 'D'
      ? 'bg-orange-500 text-white'
      : food.nutriscore === 'E'
      ? 'bg-rose-600 text-white'
      : '';

  const novaDescription =
    food.novaGroup === 1
      ? 'Group 1 · Unprocessed / Whole Food'
      : food.novaGroup === 2
      ? 'Group 2 · Culinary Ingredients'
      : food.novaGroup === 3
      ? 'Group 3 · Processed Food'
      : food.novaGroup === 4
      ? 'Group 4 · Ultra-Processed Food'
      : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/75 justify-end">
        <View className="bg-background dark:bg-background-dark rounded-t-3xl h-[90%] border-t border-input-border dark:border-input-border-dark overflow-hidden">
          {/* Header */}
          <View className="px-5 py-4 border-b border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1 pr-3">
              {food.imageUri ? (
                <Image
                  source={{ uri: food.imageUri }}
                  className="w-12 h-12 rounded-2xl bg-input border border-input-border"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-12 h-12 rounded-2xl bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark">
                  <Text className="text-2xl">{food.icon || '🥗'}</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-base font-black text-text-primary dark:text-text-primary-dark" numberOfLines={1}>
                  {food.name}
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  {food.brand ? `${food.brand} • ` : ''}{food.category}
                </Text>
              </View>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Badges Bar: Verified, Nutriscore, NOVA */}
            <View className="flex-row flex-wrap items-center gap-2 mb-4">
              {food.isVerified ? (
                <View className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex-row items-center gap-1">
                  <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                  <Text className="text-[10px] font-extrabold text-emerald-500">
                    FitTrack Verified Staple
                  </Text>
                </View>
              ) : (
                <View className="px-2.5 py-1 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark flex-row items-center gap-1">
                  <Ionicons name="globe-outline" size={12} color={colors.textMuted} />
                  <Text className="text-[10px] font-semibold text-text-muted dark:text-text-muted-dark">
                    Open Food Facts Database
                  </Text>
                </View>
              )}

              {food.nutriscore && (
                <View className={`px-2.5 py-1 rounded-full ${nutriscoreColor}`}>
                  <Text className="text-[10px] font-black tracking-wider">
                    Nutri-Score {food.nutriscore}
                  </Text>
                </View>
              )}

              {novaDescription && (
                <View className="px-2.5 py-1 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark">
                  <Text className="text-[10px] font-medium text-text-muted dark:text-text-muted-dark">
                    {novaDescription}
                  </Text>
                </View>
              )}
            </View>

            {/* Interactive Portion Tuner */}
            <View className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-extrabold text-accent dark:text-accent-dark uppercase tracking-wider">
                  Adjust Portion Size
                </Text>
                <View className="flex-row bg-input dark:bg-input-dark p-0.5 rounded-xl border border-input-border dark:border-input-border-dark">
                  <TouchableOpacity
                    onPress={() => setPortionMode('grams')}
                    activeOpacity={0.8}
                    className={`px-2.5 py-1 rounded-lg ${portionMode === 'grams' ? 'bg-accent' : ''}`}
                  >
                    <Text className={`text-[10px] font-bold ${portionMode === 'grams' ? 'text-white' : 'text-text-muted'}`}>
                      Grams (g)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPortionMode('servings')}
                    activeOpacity={0.8}
                    className={`px-2.5 py-1 rounded-lg ${portionMode === 'servings' ? 'bg-accent' : ''}`}
                  >
                    <Text className={`text-[10px] font-bold ${portionMode === 'servings' ? 'text-white' : 'text-text-muted'}`}>
                      Servings
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Amount Input */}
              <View className="flex-row items-center gap-3 mb-3">
                <TextInput
                  value={amountInput}
                  onChangeText={setAmountInput}
                  keyboardType="numeric"
                  className="flex-1 bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-xl px-4 py-3 text-lg font-black text-text-primary dark:text-text-primary-dark text-center"
                />
                <Text className="text-sm font-bold text-text-muted dark:text-text-muted-dark min-w-[70px]">
                  {portionMode === 'grams' ? 'grams' : food.servingUnit || 'servings'}
                </Text>
              </View>

              {/* Quick Preset Buttons */}
              <View className="flex-row gap-1.5 flex-wrap">
                {portionMode === 'grams' ? (
                  [50, 100, 150, 200, 250].map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setAmountInput(String(g))}
                      activeOpacity={0.7}
                      className={`px-3 py-1.5 rounded-xl border ${
                        amountInput === String(g)
                          ? 'bg-accent/15 border-accent dark:border-accent-dark'
                          : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          amountInput === String(g) ? 'text-accent dark:text-accent-dark' : 'text-text-muted'
                        }`}
                      >
                        {g}g
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  [0.5, 1, 1.5, 2].map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setAmountInput(String(s))}
                      activeOpacity={0.7}
                      className={`px-3 py-1.5 rounded-xl border ${
                        amountInput === String(s)
                          ? 'bg-accent/15 border-accent dark:border-accent-dark'
                          : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          amountInput === String(s) ? 'text-accent dark:text-accent-dark' : 'text-text-muted'
                        }`}
                      >
                        {s}x
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
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

            {/* Full Standard Nutrition Facts Panel */}
            <View className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border-2 border-input-border dark:border-input-border-dark mb-4">
              {/* Nutrition Facts Label Title */}
              <View className="border-b-4 border-text-primary dark:border-text-primary-dark pb-1.5 mb-2">
                <Text className="text-2xl font-black text-text-primary dark:text-text-primary-dark uppercase tracking-tight">
                  Nutrition Facts
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  Serving Size: {numAmount}{portionMode === 'grams' ? 'g' : ` ${food.servingUnit || 'serving'}`}
                </Text>
              </View>

              {/* Calories Row */}
              <View className="flex-row items-baseline justify-between border-b-2 border-text-primary dark:border-text-primary-dark pb-2 mb-2">
                <View>
                  <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark uppercase">
                    Amount Per Serving
                  </Text>
                  <Text className="text-3xl font-black text-text-primary dark:text-text-primary-dark">
                    Calories {scaled.calories}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Macro Split</Text>
                  <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                    P: {pPct}% · C: {cPct}% · F: {fPct}%
                  </Text>
                </View>
              </View>

              {/* % Daily Value Note */}
              <View className="items-end pb-1 border-b border-input-border dark:border-input-border-dark mb-1.5">
                <Text className="text-[10px] font-black text-text-primary dark:text-text-primary-dark">
                  % Daily Value*
                </Text>
              </View>

              {/* Nutrients List */}
              <View className="gap-1.5">
                {/* Total Fat */}
                <View className="flex-row items-center justify-between pb-1 border-b border-input-border/50">
                  <Text className="text-xs text-text-primary dark:text-text-primary-dark">
                    <Text className="font-black">Total Fat </Text>
                    {scaled.fat}g
                  </Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {pctDV(scaled.fat, DV_FAT) ? `${pctDV(scaled.fat, DV_FAT)}%` : '—'}
                  </Text>
                </View>

                {/* Saturated Fat */}
                {scaled.saturatedFat !== undefined && (
                  <View className="flex-row items-center justify-between pl-4 pb-1 border-b border-input-border/40">
                    <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                      Saturated Fat {scaled.saturatedFat}g
                    </Text>
                    <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
                      {pctDV(scaled.saturatedFat, DV_SAT_FAT) ? `${pctDV(scaled.saturatedFat, DV_SAT_FAT)}%` : '—'}
                    </Text>
                  </View>
                )}

                {/* Cholesterol */}
                {scaled.cholesterolMg !== undefined && (
                  <View className="flex-row items-center justify-between pb-1 border-b border-input-border/50">
                    <Text className="text-xs text-text-primary dark:text-text-primary-dark">
                      <Text className="font-black">Cholesterol </Text>
                      {scaled.cholesterolMg}mg
                    </Text>
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                      {pctDV(scaled.cholesterolMg, DV_CHOLESTEROL) ? `${pctDV(scaled.cholesterolMg, DV_CHOLESTEROL)}%` : '—'}
                    </Text>
                  </View>
                )}

                {/* Sodium */}
                {scaled.sodiumMg !== undefined && (
                  <View className="flex-row items-center justify-between pb-1 border-b border-input-border/50">
                    <Text className="text-xs text-text-primary dark:text-text-primary-dark">
                      <Text className="font-black">Sodium </Text>
                      {scaled.sodiumMg}mg
                    </Text>
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                      {pctDV(scaled.sodiumMg, DV_SODIUM) ? `${pctDV(scaled.sodiumMg, DV_SODIUM)}%` : '—'}
                    </Text>
                  </View>
                )}

                {/* Total Carbohydrates */}
                <View className="flex-row items-center justify-between pb-1 border-b border-input-border/50">
                  <Text className="text-xs text-text-primary dark:text-text-primary-dark">
                    <Text className="font-black">Total Carbohydrate </Text>
                    {scaled.carbs}g
                  </Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {pctDV(scaled.carbs, DV_CARBS) ? `${pctDV(scaled.carbs, DV_CARBS)}%` : '—'}
                  </Text>
                </View>

                {/* Dietary Fiber */}
                {scaled.fiber !== undefined && (
                  <View className="flex-row items-center justify-between pl-4 pb-1 border-b border-input-border/40">
                    <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                      Dietary Fiber {scaled.fiber}g
                    </Text>
                    <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
                      {pctDV(scaled.fiber, DV_FIBER) ? `${pctDV(scaled.fiber, DV_FIBER)}%` : '—'}
                    </Text>
                  </View>
                )}

                {/* Total Sugars */}
                {scaled.sugar !== undefined && (
                  <View className="flex-row items-center justify-between pl-4 pb-1 border-b border-input-border/40">
                    <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                      Total Sugars {scaled.sugar}g
                    </Text>
                    <Text className="text-xs text-text-muted">—</Text>
                  </View>
                )}

                {/* Protein */}
                <View className="flex-row items-center justify-between pb-1 border-b-2 border-text-primary dark:border-text-primary-dark">
                  <Text className="text-xs text-text-primary dark:text-text-primary-dark">
                    <Text className="font-black">Protein </Text>
                    {scaled.protein}g
                  </Text>
                  <Text className="text-xs font-bold text-emerald-500">
                    {pctDV(scaled.protein, DV_PROTEIN) ? `${pctDV(scaled.protein, DV_PROTEIN)}%` : '—'}
                  </Text>
                </View>

                {/* Potassium */}
                {scaled.potassiumMg !== undefined && (
                  <View className="flex-row items-center justify-between pt-1">
                    <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                      Potassium {scaled.potassiumMg}mg
                    </Text>
                    <Text className="text-[11px] font-semibold text-text-muted">
                      {pctDV(scaled.potassiumMg, DV_POTASSIUM) ? `${pctDV(scaled.potassiumMg, DV_POTASSIUM)}%` : '—'}
                    </Text>
                  </View>
                )}
              </View>

              <Text className="text-[9px] text-text-muted dark:text-text-muted-dark mt-2.5 italic">
                * The % Daily Value (DV) tells you how much a nutrient in a serving contributes to a daily 2,000 calorie diet.
              </Text>
            </View>

            {/* Ingredients & Allergens Info */}
            {(food.ingredients || (food.allergens && food.allergens.length > 0)) && (
              <View className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark mb-4">
                <Text className="text-xs font-extrabold text-accent dark:text-accent-dark uppercase tracking-wider mb-2">
                  Ingredients & Allergens
                </Text>

                {food.allergens && food.allergens.length > 0 && (
                  <View className="mb-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex-row items-center gap-1.5">
                    <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                    <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Allergens: {food.allergens.join(', ')}
                    </Text>
                  </View>
                )}

                {food.ingredients && (
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-5">
                    <Text className="font-bold text-text-primary dark:text-text-primary-dark">Ingredients: </Text>
                    {food.ingredients}
                  </Text>
                )}
              </View>
            )}
          </ScrollView>

          {/* Confirm Bottom Action Button */}
          <View className="p-4 border-t border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark">
            <TouchableOpacity
              onPress={handleAdd}
              activeOpacity={0.8}
              className="bg-accent dark:bg-accent-dark py-3.5 rounded-2xl items-center flex-row justify-center gap-2 shadow-sm"
            >
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text className="text-white font-bold text-sm">
                Add to {MEAL_LABELS[targetMeal]} ({scaled.calories} kcal • {scaled.protein}g P)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
