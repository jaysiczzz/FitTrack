import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import {
  FoodLogItem,
  MealType,
  MEAL_LABELS,
  MEAL_ICONS,
  getSmartFoodBadge,
  getBadgeStyles,
} from './foodLogTypes';
import { COLORS } from '@/constants/colors';
import ModalCloseButton from '../ui/ModalCloseButton';

interface EditMealModalProps {
  visible: boolean;
  item: FoodLogItem | null;
  onClose: () => void;
  onSave: (updatedItem: FoodLogItem) => void;
  onDelete: (id: string) => void;
}

export default function EditMealModal({
  visible,
  item,
  onClose,
  onSave,
  onDelete,
}: EditMealModalProps) {
  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');
  const [subtitle, setSubtitle] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [activeMultiplier, setActiveMultiplier] = useState<number>(1);

  // Store initial base values for multiplier scaling
  const [baseMacros, setBaseMacros] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
    if (item && visible) {
      setSelectedMeal(item.mealType);
      setSubtitle(item.subtitle || '');
      setCalories(String(item.calories || 0));
      setProtein(String(item.protein || 0));
      setCarbs(String(item.carbs || 0));
      setFat(String(item.fat || 0));
      setActiveMultiplier(1);
      setBaseMacros({
        calories: item.calories || 0,
        protein: item.protein || 0,
        carbs: item.carbs || 0,
        fat: item.fat || 0,
      });
    }
  }, [item, visible]);

  if (!item) return null;

  const handleMultiplierChange = (mult: number) => {
    setActiveMultiplier(mult);
    const scaledCalories = Math.round(baseMacros.calories * mult);
    const scaledProtein = Math.round(baseMacros.protein * mult * 10) / 10;
    const scaledCarbs = Math.round(baseMacros.carbs * mult * 10) / 10;
    const scaledFat = Math.round(baseMacros.fat * mult * 10) / 10;

    setCalories(String(scaledCalories));
    setProtein(String(scaledProtein));
    setCarbs(String(scaledCarbs));
    setFat(String(scaledFat));

    if (mult !== 1 && item.subtitle) {
      // If subtitle had grams, scale grams
      const matchGrams = item.subtitle.match(/^(\d+(?:\.\d+)?)\s*g/i);
      if (matchGrams) {
        const newGrams = Math.round(Number(matchGrams[1]) * mult);
        const rest = item.subtitle.replace(/^(\d+(?:\.\d+)?)\s*g/i, '').trim();
        setSubtitle(`${newGrams}g${rest ? ` · ${rest.replace(/^·\s*/, '')}` : ''}`);
      } else {
        setSubtitle(`${mult}x · ${item.subtitle.replace(/^\d+(?:\.\d+)?x\s*·\s*/, '')}`);
      }
    }
  };

  const currentCals = parseFloat(calories) || 0;
  const currentProtein = parseFloat(protein) || 0;
  const currentCarbs = parseFloat(carbs) || 0;
  const currentFat = parseFloat(fat) || 0;

  const liveBadge = getSmartFoodBadge({
    calories: currentCals,
    protein: currentProtein,
    carbs: currentCarbs,
    fat: currentFat,
    category: item.mealType,
    title: item.title,
  });
  const liveBadgeStyles = getBadgeStyles(liveBadge.color);

  const handleSave = () => {
    const updated: FoodLogItem = {
      ...item,
      mealType: selectedMeal,
      subtitle: subtitle.trim() || undefined,
      calories: Math.round(currentCals),
      protein: Math.round(currentProtein * 10) / 10,
      carbs: Math.round(currentCarbs * 10) / 10,
      fat: Math.round(currentFat * 10) / 10,
      goalBadge: liveBadge.badge,
      goalBadgeColor: liveBadge.color,
    };
    onSave(updated);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/65 justify-end">
        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl max-h-[92%] p-5 border-t border-input-border dark:border-input-border-dark shadow-2xl">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center flex-1 pr-2">
              {item.imageUri ? (
                <Image
                  source={{ uri: item.imageUri }}
                  className="w-10 h-10 rounded-xl mr-2.5 bg-black/10"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-10 h-10 rounded-xl bg-input dark:bg-input-dark items-center justify-center mr-2.5 border border-input-border dark:border-input-border-dark">
                  <Text className="text-xl">{item.icon || '🥗'}</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-text-primary dark:text-text-primary-dark font-black text-base" numberOfLines={1}>
                  {item.title}
                </Text>
                <View className="flex-row items-center gap-1.5 mt-0.5">
                  <View className={`px-1.5 py-0.5 rounded-md border ${liveBadgeStyles.container}`}>
                    <Text className={`font-bold text-[8.5px] ${liveBadgeStyles.text}`}>
                      {liveBadge.badge}
                    </Text>
                  </View>
                  <Text className="text-text-muted dark:text-text-muted-dark text-[10px]">
                    Edit Portion & Macros
                  </Text>
                </View>
              </View>
            </View>

            <ModalCloseButton onClose={onClose} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
            {/* 1. Meal Type Reassigner */}
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-bold uppercase mb-1.5">
              Meal Category:
            </Text>
            <View className="flex-row gap-1.5 mb-3.5">
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

            {/* 2. Quick Portion Multiplier */}
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-bold uppercase mb-1.5">
              Quick Portion Scale:
            </Text>
            <View className="flex-row gap-1 mb-3.5">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((mult) => (
                <TouchableOpacity
                  key={mult}
                  onPress={() => handleMultiplierChange(mult)}
                  activeOpacity={0.8}
                  className={`flex-1 py-1.5 rounded-lg border items-center justify-center ${
                    activeMultiplier === mult
                      ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
                      : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-extrabold ${
                      activeMultiplier === mult
                        ? 'text-background dark:text-background-dark font-black'
                        : 'text-text-muted dark:text-text-muted-dark'
                    }`}
                  >
                    {mult}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 3. Serving Description Input */}
            <View className="mb-3.5">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-bold uppercase mb-1">
                Portion / Serving Details:
              </Text>
              <TextInput
                value={subtitle}
                onChangeText={setSubtitle}
                placeholder="e.g. 150g breast · 1 cup rice"
                placeholderTextColor={COLORS.textMuted.dark}
                className="bg-input dark:bg-input-dark p-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-xs text-text-primary dark:text-text-primary-dark"
              />
            </View>

            {/* 4. Fine-Tune Macros & Calories */}
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-bold uppercase mb-1.5">
              Nutritional Values:
            </Text>
            <View className="flex-row gap-2 mb-4">
              {/* Calories */}
              <View className="flex-1 bg-input dark:bg-input-dark p-2 rounded-xl border border-input-border dark:border-input-border-dark items-center">
                <Text className="text-[10px] text-text-muted dark:text-text-muted-dark font-bold uppercase">
                  Calories
                </Text>
                <TextInput
                  value={calories}
                  onChangeText={(val) => {
                    setCalories(val);
                    setActiveMultiplier(0);
                  }}
                  keyboardType="numeric"
                  className="font-black text-sm text-accent dark:text-accent-dark text-center py-0.5 w-full"
                />
                <Text className="text-[9px] text-text-muted dark:text-text-muted-dark">kcal</Text>
              </View>

              {/* Protein */}
              <View className="flex-1 bg-input dark:bg-input-dark p-2 rounded-xl border border-input-border dark:border-input-border-dark items-center">
                <Text className="text-[10px] text-accent dark:text-accent-dark font-bold uppercase">
                  Protein
                </Text>
                <TextInput
                  value={protein}
                  onChangeText={(val) => {
                    setProtein(val);
                    setActiveMultiplier(0);
                  }}
                  keyboardType="numeric"
                  className="font-black text-sm text-accent dark:text-accent-dark text-center py-0.5 w-full"
                />
                <Text className="text-[9px] text-text-muted dark:text-text-muted-dark">grams</Text>
              </View>

              {/* Carbs */}
              <View className="flex-1 bg-input dark:bg-input-dark p-2 rounded-xl border border-input-border dark:border-input-border-dark items-center">
                <Text className="text-[10px] text-info dark:text-info-dark font-bold uppercase">
                  Carbs
                </Text>
                <TextInput
                  value={carbs}
                  onChangeText={(val) => {
                    setCarbs(val);
                    setActiveMultiplier(0);
                  }}
                  keyboardType="numeric"
                  className="font-black text-sm text-info dark:text-info-dark text-center py-0.5 w-full"
                />
                <Text className="text-[9px] text-text-muted dark:text-text-muted-dark">grams</Text>
              </View>

              {/* Fat */}
              <View className="flex-1 bg-input dark:bg-input-dark p-2 rounded-xl border border-input-border dark:border-input-border-dark items-center">
                <Text className="text-[10px] text-tertiary dark:text-tertiary-dark font-bold uppercase">
                  Fats
                </Text>
                <TextInput
                  value={fat}
                  onChangeText={(val) => {
                    setFat(val);
                    setActiveMultiplier(0);
                  }}
                  keyboardType="numeric"
                  className="font-black text-sm text-tertiary dark:text-tertiary-dark text-center py-0.5 w-full"
                />
                <Text className="text-[9px] text-text-muted dark:text-text-muted-dark">grams</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-2 pt-1">
              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.8}
                className="bg-accent dark:bg-accent-dark py-3 rounded-xl items-center justify-center shadow-xs"
              >
                <Text className="text-background dark:text-background-dark font-black text-xs uppercase tracking-wide">
                  ✓ Save Changes ({Math.round(currentCals)} kcal)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onDelete(item.id);
                  onClose();
                }}
                activeOpacity={0.7}
                className="py-2.5 rounded-xl items-center justify-center border border-danger/30 bg-danger/10 dark:bg-danger-dark/20"
              >
                <Text className="text-danger dark:text-danger-dark font-extrabold text-xs">
                  🗑️ Delete Meal Item
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
