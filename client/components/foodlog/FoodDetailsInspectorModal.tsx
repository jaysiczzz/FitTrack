import React, { useState, useMemo, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/constants/colors';
import { FoodCatalogItem, scaleFoodMacros, ScaledNutrition, isLiquidFood } from '../../data/commonFoods';
import { MealType, MEAL_LABELS, FoodLogItem, getSmartFoodBadge } from './foodLogTypes';
import ModalCloseButton from '../ui/ModalCloseButton';
import MealSelectorPill from './MealSelectorPill';
import ResponsiveMacroRow from './ResponsiveMacroRow';
import CollapsibleSection from './CollapsibleSection';

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
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();
  const isLiquid = useMemo(() => isLiquidFood(food), [food]);

  const [portionMode, setPortionMode] = useState<'grams' | 'ml' | 'servings'>('grams');
  const [amountInput, setAmountInput] = useState<string>('100');
  const [targetMeal, setTargetMeal] = useState<MealType>(defaultMeal);

  const handleSwitchPortionMode = (mode: 'grams' | 'ml' | 'servings') => {
    if (mode === portionMode) return;
    setPortionMode(mode);
    if (mode === 'servings') {
      setAmountInput('1');
    } else {
      setAmountInput(String(food?.servingWeightG || (isLiquid ? 250 : 100)));
    }
  };

  useEffect(() => {
    if (food) {
      if (!food.servingWeightG || food.servingWeightG <= 0) {
        setPortionMode('servings');
        setAmountInput('1');
      } else if (isLiquidFood(food)) {
        setPortionMode('ml');
        setAmountInput(String(food.servingWeightG || 250));
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

  const handleAdd = () => {
    const portionDesc =
      portionMode === 'ml'
        ? `${numAmount}ml`
        : portionMode === 'grams'
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/75 justify-end">
        <View className="bg-background dark:bg-background-dark rounded-t-3xl max-h-[92%] h-auto border-t border-input-border dark:border-input-border-dark overflow-hidden flex-col">
          {/* Header */}
          <View className="px-4 py-3 border-b border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5 flex-1 pr-2">
              {food.imageUri ? (
                <Image
                  source={{ uri: food.imageUri }}
                  className="w-10 h-10 rounded-xl bg-input border border-input-border shrink-0"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-10 h-10 rounded-xl bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark shrink-0">
                  <Text className="text-xl">{food.icon || '🥗'}</Text>
                </View>
              )}
              <View className="flex-1 min-w-0">
                <Text
                  className="text-sm font-black text-text-primary dark:text-text-primary-dark leading-snug"
                  numberOfLines={3}
                >
                  {food.name}
                </Text>
                <View className="flex-row items-center gap-1.5 mt-0.5">
                  <Text className="text-[11px] text-text-muted dark:text-text-muted-dark" numberOfLines={1}>
                    {food.brand ? `${food.brand} · ` : ''}{food.category}
                  </Text>
                  {food.isVerified && (
                    <View className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex-row items-center gap-0.5">
                      <Ionicons name="checkmark-circle" size={10} color="#10B981" />
                      <Text className="text-[8px] font-black text-emerald-500">Verified</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Top Quality Badge & Close */}
            <View className="flex-row items-center gap-2">
              {food.nutriscore ? (
                <View className={`px-1.5 py-0.5 rounded-md shrink-0 ${nutriscoreColor}`}>
                  <Text className="text-[8px] font-black text-white">Nutri {food.nutriscore}</Text>
                </View>
              ) : null}
              <ModalCloseButton onClose={onClose} />
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            className="flex-1 px-4 pt-3.5"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={true}
          >
            {/* Interactive Portion Tuner */}
            <View className="p-3 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[11px] font-black text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
                  Portion Size
                </Text>

                {/* Grams/ml vs Servings Toggle with Compact Sizing */}
                <View className="flex-row bg-input dark:bg-input-dark p-0.5 rounded-lg border border-input-border dark:border-input-border-dark">
                  <TouchableOpacity
                    onPress={() => handleSwitchPortionMode(isLiquid ? 'ml' : 'grams')}
                    activeOpacity={0.8}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: portionMode === 'grams' || portionMode === 'ml' }}
                    className={`min-h-[34px] px-3 justify-center items-center rounded-md ${
                      portionMode === 'grams' || portionMode === 'ml' ? 'bg-accent dark:bg-accent-dark' : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        portionMode === 'grams' || portionMode === 'ml' ? 'text-white font-extrabold' : 'text-text-muted dark:text-text-muted-dark'
                      }`}
                    >
                      {isLiquid ? 'Volume (ml)' : 'Grams (g)'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSwitchPortionMode('servings')}
                    activeOpacity={0.8}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: portionMode === 'servings' }}
                    className={`min-h-[34px] px-3 justify-center items-center rounded-md ${
                      portionMode === 'servings' ? 'bg-accent dark:bg-accent-dark' : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        portionMode === 'servings' ? 'text-white font-extrabold' : 'text-text-muted dark:text-text-muted-dark'
                      }`}
                    >
                      Servings
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Amount Input */}
              <View className="flex-row items-center gap-2 mb-2">
                <TextInput
                  value={amountInput}
                  onChangeText={setAmountInput}
                  keyboardType="numeric"
                  className="flex-1 bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-xl px-3 min-h-[38px] text-sm font-black text-text-primary dark:text-text-primary-dark text-center"
                />
                <View className="min-w-[60px] justify-center items-center px-2 py-2 rounded-xl bg-input/50 dark:bg-input-dark/50 border border-input-border/40">
                  <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark">
                    {portionMode === 'ml' ? 'ml' : portionMode === 'grams' ? 'grams' : food.servingUnit || 'servings'}
                  </Text>
                </View>
              </View>

              {/* Quick Preset Buttons (Compact Chips) */}
              <View className="flex-row gap-1.5">
                {portionMode === 'ml' ? (
                  [150, 250, 330, 500, 750].map((ml) => (
                    <TouchableOpacity
                      key={ml}
                      onPress={() => setAmountInput(String(ml))}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      className={`flex-1 min-h-[32px] justify-center items-center rounded-lg border ${
                        amountInput === String(ml)
                          ? 'bg-accent/15 border-accent dark:border-accent-dark'
                          : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          amountInput === String(ml)
                            ? 'text-accent dark:text-accent-dark font-black'
                            : 'text-text-primary dark:text-text-primary-dark'
                        }`}
                        numberOfLines={1}
                      >
                        {ml}ml
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : portionMode === 'grams' ? (
                  [50, 100, 150, 200, 250].map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setAmountInput(String(g))}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      className={`flex-1 min-h-[32px] justify-center items-center rounded-lg border ${
                        amountInput === String(g)
                          ? 'bg-accent/15 border-accent dark:border-accent-dark'
                          : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          amountInput === String(g)
                            ? 'text-accent dark:text-accent-dark font-black'
                            : 'text-text-primary dark:text-text-primary-dark'
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
                      accessibilityRole="button"
                      className={`flex-1 min-h-[32px] justify-center items-center rounded-lg border ${
                        amountInput === String(s)
                          ? 'bg-accent/15 border-accent dark:border-accent-dark'
                          : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          amountInput === String(s)
                            ? 'text-accent dark:text-accent-dark font-black'
                            : 'text-text-primary dark:text-text-primary-dark'
                        }`}
                      >
                        {s}x
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>

            {/* Live Scaled Macro Summary Row Directly Under Tuner */}
            <View className="mb-3">
              <ResponsiveMacroRow
                calories={scaled.calories}
                protein={scaled.protein}
                carbs={scaled.carbs}
                fat={scaled.fat}
              />
            </View>

            {/* Target Meal Selector Row (Reuses MealSelectorPill) */}
            <View className="flex-row items-center justify-between p-3 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark mb-3">
              <View className="pr-2">
                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                  Log into Meal
                </Text>
                <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                  Category for today's food log
                </Text>
              </View>
              <MealSelectorPill
                selectedMeal={targetMeal}
                onSelectMeal={setTargetMeal}
                compact
              />
            </View>

            {/* Collapsible Section: Nutrition Facts & % Daily Value */}
            <CollapsibleSection
              title="Nutrition Facts & % DV"
              badge={`${scaled.calories} kcal`}
              initialExpanded={false}
            >
              <View className="pt-2">
                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mb-2">
                  Serving Size: {numAmount}{portionMode === 'grams' ? 'g' : ` ${food.servingUnit || 'serving'}`}
                </Text>

                <View className="gap-1.5">
                  {/* Total Fat */}
                  <View className="flex-row items-center justify-between pb-1 border-b border-input-border/50">
                    <Text className="text-xs text-text-primary dark:text-text-primary-dark">
                      <Text className="font-bold">Total Fat </Text>
                      {scaled.fat}g
                    </Text>
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                      {pctDV(scaled.fat, DV_FAT) ? `${pctDV(scaled.fat, DV_FAT)}%` : '—'}
                    </Text>
                  </View>

                  {/* Saturated Fat */}
                  {scaled.saturatedFat !== undefined && (
                    <View className="flex-row items-center justify-between pl-3 pb-1 border-b border-input-border/40">
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
                        <Text className="font-bold">Cholesterol </Text>
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
                        <Text className="font-bold">Sodium </Text>
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
                      <Text className="font-bold">Total Carbohydrate </Text>
                      {scaled.carbs}g
                    </Text>
                    <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                      {pctDV(scaled.carbs, DV_CARBS) ? `${pctDV(scaled.carbs, DV_CARBS)}%` : '—'}
                    </Text>
                  </View>

                  {/* Dietary Fiber */}
                  {scaled.fiber !== undefined && (
                    <View className="flex-row items-center justify-between pl-3 pb-1 border-b border-input-border/40">
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
                    <View className="flex-row items-center justify-between pl-3 pb-1 border-b border-input-border/40">
                      <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                        Total Sugars {scaled.sugar}g
                      </Text>
                      <Text className="text-xs text-text-muted">—</Text>
                    </View>
                  )}

                  {/* Protein */}
                  <View className="flex-row items-center justify-between pb-1 border-b border-input-border/50">
                    <Text className="text-xs text-text-primary dark:text-text-primary-dark">
                      <Text className="font-bold">Protein </Text>
                      {scaled.protein}g
                    </Text>
                    <Text className="text-xs font-bold text-emerald-500">
                      {pctDV(scaled.protein, DV_PROTEIN) ? `${pctDV(scaled.protein, DV_PROTEIN)}%` : '—'}
                    </Text>
                  </View>

                  {/* Potassium */}
                  {scaled.potassiumMg !== undefined && (
                    <View className="flex-row items-center justify-between pt-0.5">
                      <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                        Potassium {scaled.potassiumMg}mg
                      </Text>
                      <Text className="text-[11px] font-semibold text-text-muted">
                        {pctDV(scaled.potassiumMg, DV_POTASSIUM) ? `${pctDV(scaled.potassiumMg, DV_POTASSIUM)}%` : '—'}
                      </Text>
                    </View>
                  )}
                </View>

                <Text className="text-[9px] text-text-muted dark:text-text-muted-dark mt-2 italic">
                  * % Daily Value (DV) based on a 2,000 calorie diet.
                </Text>
              </View>
            </CollapsibleSection>

            {/* Collapsible Section: Ingredients & Allergens Info */}
            {(food.ingredients || (food.allergens && food.allergens.length > 0)) && (
              <CollapsibleSection
                title="Ingredients & Allergens"
                badge={food.allergens && food.allergens.length > 0 ? `⚠️ ${food.allergens.length}` : undefined}
                initialExpanded={false}
              >
                <View className="pt-2">
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
              </CollapsibleSection>
            )}
          </ScrollView>

          {/* Sticky Bottom Action Button */}
          <View
            style={{ paddingBottom: Math.max(16, insets.bottom) }}
            className="p-3.5 border-t border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark"
          >
            <TouchableOpacity
              onPress={handleAdd}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`+ Add to ${MEAL_LABELS[targetMeal]}`}
              className="bg-accent dark:bg-accent-dark py-3.5 px-4 min-h-[48px] rounded-2xl items-center justify-center shadow-sm"
            >
              <Text className="text-white font-black text-sm" numberOfLines={1}>
                + Add to {MEAL_LABELS[targetMeal]}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
