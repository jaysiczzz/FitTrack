import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/constants/colors';
import { MealCombo } from '../../data/mealCombos';
import { MealType, MEAL_LABELS } from './foodLogTypes';
import ModalCloseButton from '../ui/ModalCloseButton';
import MealSelectorPill from './MealSelectorPill';
import CollapsibleSection from './CollapsibleSection';

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
  const insets = useSafeAreaInsets();
  const [scaleFactor, setScaleFactor] = useState<number>(1.0);
  const [targetMeal, setTargetMeal] = useState<MealType>(defaultMeal);

  useEffect(() => {
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

  // Macro calorie ratios for progress bar
  const totalMacroCals = scaledProtein * 4 + scaledCarbs * 4 + scaledFat * 9;
  const proteinPct = totalMacroCals > 0 ? Math.round(((scaledProtein * 4) / totalMacroCals) * 100) : 0;
  const carbsPct = totalMacroCals > 0 ? Math.round(((scaledCarbs * 4) / totalMacroCals) * 100) : 0;
  const fatPct = totalMacroCals > 0 ? 100 - proteinPct - carbsPct : 0;

  const handleConfirm = () => {
    onLogCombo(combo, scaleFactor, targetMeal);
    onClose();
  };

  const goalBadgeStyle =
    combo.goal === 'High Protein'
      ? {
          container: 'bg-emerald-500/15 border-emerald-500/30 dark:bg-emerald-500/20 dark:border-emerald-500/40',
          color: isDark ? '#86EFAC' : '#059669',
        }
      : combo.goal === 'Fat Loss'
      ? {
          container: 'bg-rose-500/15 border-rose-500/30 dark:bg-rose-500/20 dark:border-rose-500/40',
          color: isDark ? '#FDA4AF' : '#DC2626',
        }
      : combo.goal === 'Post-Workout'
      ? {
          container: 'bg-sky-500/15 border-sky-500/30 dark:bg-sky-500/20 dark:border-sky-500/40',
          color: isDark ? '#7DD3FC' : '#0284C7',
        }
      : combo.goal === 'Clean Bulking'
      ? {
          container: 'bg-purple-500/15 border-purple-500/30 dark:bg-purple-500/20 dark:border-purple-500/40',
          color: isDark ? '#D8B4FE' : '#9333EA',
        }
      : {
          container: 'bg-amber-500/15 border-amber-500/30 dark:bg-amber-500/20 dark:border-amber-500/40',
          color: isDark ? '#FDE047' : '#B45309',
        };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/75 justify-end">
        <View className="bg-background dark:bg-background-dark rounded-t-3xl max-h-[92%] h-auto border-t border-input-border dark:border-input-border-dark overflow-hidden flex-col">
          {/* Compact Modal Header */}
          <View className="px-4 py-3 border-b border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5 flex-1 pr-2">
              <View className="w-10 h-10 rounded-xl bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark shrink-0">
                <Text className="text-xl">{combo.icon}</Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text
                  className="text-base font-black text-text-primary dark:text-text-primary-dark leading-snug"
                  numberOfLines={2}
                >
                  {combo.title}
                </Text>
                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark font-medium" numberOfLines={1}>
                  ⏱️ {combo.prepTimeMinutes}m prep · {combo.goal}
                </Text>
              </View>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          {/* Scrollable Content */}
          <ScrollView
            className="flex-1 px-4 pt-3.5"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={true}
          >
            {/* Tagline & Goal Context Banner */}
            <View className="p-3 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark mb-3">
              <View className="flex-row items-center justify-between mb-1">
                <View className={`px-2 py-0.5 rounded-full border ${goalBadgeStyle.container}`}>
                  <Text style={{ color: goalBadgeStyle.color }} className="text-[9px] font-extrabold uppercase tracking-wider">
                    {combo.goal}
                  </Text>
                </View>
                <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark">
                  Ideal for: {MEAL_LABELS[combo.mealType]}
                </Text>
              </View>
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                {combo.tagline}
              </Text>
              {combo.description ? (
                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark leading-4 mt-0.5">
                  {combo.description}
                </Text>
              ) : null}
            </View>

            {/* Portion Scaler Selector: 4 Flexible Equal Segments */}
            <View className="mb-3">
              <Text className="text-[11px] font-black text-text-primary dark:text-text-primary-dark uppercase tracking-wider mb-1.5">
                Portion Size
              </Text>
              <View className="flex-row bg-input dark:bg-input-dark p-1 rounded-2xl border border-input-border dark:border-input-border-dark gap-1">
                {[
                  { label: '0.75x', sub: 'Light', val: 0.75 },
                  { label: '1.0x', sub: 'Standard', val: 1.0 },
                  { label: '1.25x', sub: 'Hearty', val: 1.25 },
                  { label: '1.5x', sub: 'Bulking', val: 1.5 },
                ].map((tier) => {
                  const active = scaleFactor === tier.val;
                  return (
                    <TouchableOpacity
                      key={tier.val}
                      onPress={() => setScaleFactor(tier.val)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      className={`flex-1 min-h-[44px] py-1.5 px-0.5 rounded-xl items-center justify-center ${
                        active ? 'bg-accent dark:bg-accent-dark' : ''
                      }`}
                    >
                      <Text
                        className={`text-xs font-black ${
                          active ? 'text-white' : 'text-text-primary dark:text-text-primary-dark'
                        }`}
                        numberOfLines={1}
                      >
                        {tier.label}
                      </Text>
                      <Text
                        className={`text-[9px] ${
                          active ? 'text-white/80' : 'text-text-muted dark:text-text-muted-dark'
                        }`}
                        numberOfLines={1}
                      >
                        {tier.sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Scaled Macro Nutrition Card */}
            <View className="p-3.5 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark mb-3">
              <View className="flex-row items-baseline justify-between mb-2">
                <Text className="text-xs text-text-muted dark:text-text-muted-dark font-medium">
                  Total Energy
                </Text>
                <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark">
                  {scaledCalories} <Text className="text-xs font-normal text-text-muted">kcal</Text>
                </Text>
              </View>

              {/* Macro Distribution Bar (P/C/F) */}
              <View className="h-2 rounded-full overflow-hidden flex-row bg-input dark:bg-input-dark mb-3">
                <View style={{ width: `${proteinPct}%`, backgroundColor: '#10B981' }} />
                <View style={{ width: `${carbsPct}%`, backgroundColor: '#0EA5E9' }} />
                <View style={{ width: `${fatPct}%`, backgroundColor: '#F59E0B' }} />
              </View>

              {/* Detailed 4-Column Macro Grid */}
              <View className="flex-row justify-between pt-2 border-t border-input-border/60 dark:border-input-border-dark/60">
                <View className="items-center flex-1 min-w-0">
                  <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Protein</Text>
                  <Text className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {scaledProtein}g
                  </Text>
                </View>
                <View className="items-center flex-1 min-w-0 border-x border-input-border/60 dark:border-input-border-dark/60">
                  <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Carbs</Text>
                  <Text className="text-sm font-black text-sky-600 dark:text-sky-400 mt-0.5">
                    {scaledCarbs}g
                  </Text>
                </View>
                <View className="items-center flex-1 min-w-0 border-r border-input-border/60 dark:border-input-border-dark/60">
                  <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Fats</Text>
                  <Text className="text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {scaledFat}g
                  </Text>
                </View>
                <View className="items-center flex-1 min-w-0">
                  <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Fiber</Text>
                  <Text className="text-sm font-black text-purple-600 dark:text-purple-400 mt-0.5">
                    {scaledFiber}g
                  </Text>
                </View>
              </View>
            </View>

            {/* Target Meal Selector Row (Reuses MealSelectorPill) */}
            <View className="flex-row items-center justify-between p-3 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark mb-3">
              <View className="pr-2">
                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                  Log into Meal
                </Text>
                <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                  Meal category for today's log
                </Text>
              </View>
              <MealSelectorPill
                selectedMeal={targetMeal}
                onSelectMeal={setTargetMeal}
                compact
              />
            </View>

            {/* Collapsible Section: Ingredients Breakdown */}
            <CollapsibleSection
              title="Ingredients & Portions"
              badge={`${combo.ingredients.length}`}
              initialExpanded={true}
            >
              <View className="gap-2 pt-1">
                {combo.ingredients.map((ing, idx) => (
                  <View
                    key={idx}
                    className="p-2.5 rounded-xl bg-input/70 dark:bg-input-dark/70 border border-input-border/50 dark:border-input-border-dark/50 flex-row items-center justify-between"
                  >
                    <View className="flex-1 min-w-0 pr-2">
                      <Text
                        className="text-xs font-bold text-text-primary dark:text-text-primary-dark"
                        numberOfLines={1}
                      >
                        {ing.name}
                      </Text>
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark mt-0.5">
                        {ing.portion}
                      </Text>
                    </View>
                    {ing.calories ? (
                      <View className="items-end shrink-0">
                        <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                          {Math.round(ing.calories * scaleFactor)} kcal
                        </Text>
                        <Text className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {Math.round((ing.protein || 0) * scaleFactor)}g protein
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </CollapsibleSection>

            {/* Collapsible Section: Chef & Prep Tips */}
            {combo.prepTips && combo.prepTips.length > 0 && (
              <CollapsibleSection
                title="Chef & Prep Tips"
                badge="💡"
                initialExpanded={false}
              >
                <View className="pt-1">
                  {combo.prepTips.map((tip, idx) => (
                    <Text
                      key={idx}
                      className="text-xs text-text-muted dark:text-text-muted-dark leading-5 mb-1.5"
                    >
                      • {tip}
                    </Text>
                  ))}
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
              onPress={handleConfirm}
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
