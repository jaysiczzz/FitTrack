import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import ModalCloseButton from '../ui/ModalCloseButton';

export interface NutritionFactsData {
  title: string;
  subtitle?: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodiumMg?: number;
  saturatedFat?: number;
  cholesterolMg?: number;
  dietaryFlags?: string[];
}

interface NutritionFactsModalProps {
  visible: boolean;
  onClose: () => void;
  data: NutritionFactsData | null;
}

export default function NutritionFactsModal({ visible, onClose, data }: NutritionFactsModalProps) {
  const { colors, isDark } = useThemeColors();

  if (!data) return null;

  // Daily Value Reference Standards (Standard 2,000 kcal daily diet)
  const DV_FAT = 78; // grams
  const DV_SAT_FAT = 20; // grams
  const DV_CHOLESTEROL = 300; // mg
  const DV_SODIUM = 2300; // mg
  const DV_CARBS = 275; // grams
  const DV_FIBER = 28; // grams
  const DV_PROTEIN = 50; // grams

  const safeFat = Math.max(0, data.fat || 0);
  const safeCarbs = Math.max(0, data.carbs || 0);
  const safeProtein = Math.max(0, data.protein || 0);

  // Calorie Contribution Calculations (4 kcal/g protein, 4 kcal/g carb, 9 kcal/g fat)
  const proteinKcal = safeProtein * 4;
  const carbsKcal = safeCarbs * 4;
  const fatKcal = safeFat * 9;
  const totalMacroKcal = Math.max(1, proteinKcal + carbsKcal + fatKcal);

  const proteinPct = Math.round((proteinKcal / totalMacroKcal) * 100);
  const carbsPct = Math.round((carbsKcal / totalMacroKcal) * 100);
  const fatPct = Math.max(0, 100 - proteinPct - carbsPct);

  // Micronutrient values or reasonable estimates
  const fiberG = data.fiber !== undefined ? data.fiber : Math.round(safeCarbs * 0.12);
  const sugarG = data.sugar !== undefined ? data.sugar : Math.round(safeCarbs * 0.2);
  const satFatG = data.saturatedFat !== undefined ? data.saturatedFat : Number((safeFat * 0.28).toFixed(1));
  const sodiumMg = data.sodiumMg !== undefined ? data.sodiumMg : Math.round(data.calories * 0.85);
  const cholesterolMg = data.cholesterolMg !== undefined ? data.cholesterolMg : Math.round(safeProtein * 1.5);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl p-5 border-t border-input-border dark:border-input-border-dark max-h-[90%] shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark">
                Nutrition Facts
              </Text>
              <Text
                className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5"
                numberOfLines={1}
              >
                {data.title}
              </Text>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          <ScrollView className="mt-3" showsVerticalScrollIndicator={false}>
            {/* Dietary Flags Badge Row */}
            {data.dietaryFlags && data.dietaryFlags.length > 0 ? (
              <View className="flex-row flex-wrap gap-1.5 mb-3">
                {data.dietaryFlags.map((flag, idx) => (
                  <View
                    key={idx}
                    className="bg-accent/10 dark:bg-accent-dark/10 border border-accent/30 dark:border-accent-dark/30 px-2 py-0.5 rounded-full"
                  >
                    <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                      {flag}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Nutrition Facts Label Box */}
            <View className="bg-input dark:bg-input-dark p-4 rounded-2xl border border-input-border dark:border-input-border-dark mb-3">
              {/* Serving Size */}
              <View className="flex-row justify-between items-center pb-2 border-b-4 border-text-primary dark:border-text-primary-dark">
                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                  Serving Size
                </Text>
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                  {data.servingSize}
                </Text>
              </View>

              {/* Amount Per Serving / Calories */}
              <View className="py-2.5 border-b-8 border-text-primary dark:border-text-primary-dark flex-row justify-between items-end">
                <View>
                  <Text className="text-[10px] font-extrabold uppercase text-text-muted dark:text-text-muted-dark">
                    Amount Per Serving
                  </Text>
                  <Text className="text-3xl font-black text-text-primary dark:text-text-primary-dark tracking-tight">
                    Calories
                  </Text>
                </View>
                <Text className="text-3xl font-black text-text-primary dark:text-text-primary-dark">
                  {data.calories}
                </Text>
              </View>

              {/* % Daily Value Header */}
              <View className="py-1 border-b border-input-border dark:border-input-border-dark flex-row justify-end">
                <Text className="text-[10px] font-black text-text-muted dark:text-text-muted-dark">
                  % Daily Value*
                </Text>
              </View>

              {/* Total Fat */}
              <View className="py-1.5 border-b border-input-border dark:border-input-border-dark flex-row justify-between items-center">
                <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                  Total Fat <Text className="font-normal">{safeFat}g</Text>
                </Text>
                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                  {Math.round((safeFat / DV_FAT) * 100)}%
                </Text>
              </View>

              {/* Saturated Fat */}
              <View className="py-1 pl-4 border-b border-input-border dark:border-input-border-dark flex-row justify-between items-center">
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  Saturated Fat <Text className="font-normal">{satFatG}g</Text>
                </Text>
                <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark">
                  {Math.round((satFatG / DV_SAT_FAT) * 100)}%
                </Text>
              </View>

              {/* Cholesterol */}
              <View className="py-1.5 border-b border-input-border dark:border-input-border-dark flex-row justify-between items-center">
                <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                  Cholesterol <Text className="font-normal">{cholesterolMg}mg</Text>
                </Text>
                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                  {Math.round((cholesterolMg / DV_CHOLESTEROL) * 100)}%
                </Text>
              </View>

              {/* Sodium */}
              <View className="py-1.5 border-b border-input-border dark:border-input-border-dark flex-row justify-between items-center">
                <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                  Sodium <Text className="font-normal">{sodiumMg}mg</Text>
                </Text>
                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                  {Math.round((sodiumMg / DV_SODIUM) * 100)}%
                </Text>
              </View>

              {/* Total Carbohydrate */}
              <View className="py-1.5 border-b border-input-border dark:border-input-border-dark flex-row justify-between items-center">
                <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
                  Total Carbohydrate <Text className="font-normal">{safeCarbs}g</Text>
                </Text>
                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                  {Math.round((safeCarbs / DV_CARBS) * 100)}%
                </Text>
              </View>

              {/* Dietary Fiber */}
              <View className="py-1 pl-4 border-b border-input-border dark:border-input-border-dark flex-row justify-between items-center">
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  Dietary Fiber <Text className="font-normal">{fiberG}g</Text>
                </Text>
                <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark">
                  {Math.round((fiberG / DV_FIBER) * 100)}%
                </Text>
              </View>

              {/* Total Sugars */}
              <View className="py-1 pl-4 border-b border-input-border dark:border-input-border-dark flex-row justify-between items-center">
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  Total Sugars <Text className="font-normal">{sugarG}g</Text>
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  —
                </Text>
              </View>

              {/* Protein */}
              <View className="py-2 border-b-4 border-text-primary dark:border-text-primary-dark flex-row justify-between items-center">
                <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark">
                  Protein <Text className="font-normal text-xs">{safeProtein}g</Text>
                </Text>
                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                  {Math.round((safeProtein / DV_PROTEIN) * 100)}%
                </Text>
              </View>

              <Text className="text-[9px] text-text-muted dark:text-text-muted-dark pt-1.5 leading-tight">
                * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet of 2,000 calories.
              </Text>
            </View>

            {/* Macro Calorie Distribution Ratio Bar */}
            <View className="bg-input dark:bg-input-dark p-3.5 rounded-2xl border border-input-border dark:border-input-border-dark mb-4">
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark mb-2">
                Macro Caloric Ratio
              </Text>

              {/* Split Bar */}
              <View className="h-3 w-full rounded-full overflow-hidden flex-row bg-input-border/30 dark:bg-input-border-dark/30 mb-2.5">
                <View style={{ width: `${proteinPct}%` }} className="bg-accent dark:bg-accent-dark h-full" />
                <View style={{ width: `${carbsPct}%` }} className="bg-info dark:bg-info-dark h-full" />
                <View style={{ width: `${fatPct}%` }} className="bg-warning dark:bg-warning-dark h-full" />
              </View>

              {/* Legend */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-accent dark:bg-accent-dark mr-1.5" />
                  <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                    Protein {proteinPct}%
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-info dark:bg-info-dark mr-1.5" />
                  <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                    Carbs {carbsPct}%
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-warning dark:bg-warning-dark mr-1.5" />
                  <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                    Fat {fatPct}%
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Dismiss Button */}
          <TouchableOpacity
            onPress={onClose}
            className="py-3.5 rounded-xl bg-accent dark:bg-accent-dark items-center justify-center mt-2 shadow-sm"
          >
            <Text className="text-sm font-black text-background dark:text-background-dark">
              Close Nutrition Facts
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
