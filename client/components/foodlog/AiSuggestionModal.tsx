import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FoodLogItem, MealType } from './foodLogTypes';
import { getAIMealSuggestions, MealSuggestion } from '../../api/ai';
import { useThemeColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import ModalCloseButton from '../ui/ModalCloseButton';
import ModalErrorBanner from '../ui/ModalErrorBanner';
import QuotaUsageMeter from '../ui/QuotaUsageMeter';
import { getCurrentSubscriptionApi, getSubscriptionPlansApi } from '../../api/subscription';
import { getFriendlyErrorMessage } from '@/utils/errorMapper';
import { hapticFeedback } from '@/utils/haptics';

export type SuggestionMealSlot = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface AiSuggestionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSuggestion: (item: FoodLogItem | FoodLogItem[]) => void;
  goal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS';
  remainingCalories: number;
  remainingProtein: number;
  initialMealType?: SuggestionMealSlot;
  onUpgradePress?: () => void;
}

const MEAL_SLOTS: { id: SuggestionMealSlot; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', label: 'Whole Day', icon: 'fast-food-outline' },
  { id: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
  { id: 'lunch', label: 'Lunch', icon: 'restaurant-outline' },
  { id: 'dinner', label: 'Dinner', icon: 'moon-outline' },
  { id: 'snack', label: 'Snacks', icon: 'cafe-outline' },
];

export default function AiSuggestionModal({
  visible,
  onClose,
  onSelectSuggestion,
  goal,
  remainingCalories,
  remainingProtein,
  initialMealType = 'all',
  onUpgradePress,
}: AiSuggestionModalProps) {
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [cachedSlots, setCachedSlots] = useState<Partial<Record<SuggestionMealSlot, MealSuggestion[]>>>({});
  const [loggedMealTitles, setLoggedMealTitles] = useState<string[]>([]);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SuggestionMealSlot>(initialMealType || 'all');

  // Quota & Pro state
  const [isPro, setIsPro] = useState(false);
  const [dailySuggestCount, setDailySuggestCount] = useState(0);
  const [freeSuggestLimit, setFreeSuggestLimit] = useState(5);
  const [proSuggestLimit, setProSuggestLimit] = useState(30);
  const [suggestResetsAt, setSuggestResetsAt] = useState<string | null>(null);

  const isMuscleGain = goal === 'MUSCLE_GAIN';

  const currentRecommendations = cachedSlots[selectedSlot] || [];
  const hasGeneratedForCurrentSlot = currentRecommendations.length > 0;

  const generateRecommendations = async (slotOverride?: SuggestionMealSlot) => {
    const activeSlot = slotOverride || selectedSlot;
    const currentLimit = isPro ? proSuggestLimit : freeSuggestLimit;

    if (dailySuggestCount >= currentLimit) {
      const limitMsg = `Daily meal suggestion limit reached (${currentLimit}/${currentLimit}). Resets at midnight UTC.${!isPro ? ' Upgrade to Pro for 30 suggestions/day.' : ''}`;
      setSuggestionError(limitMsg);
      return;
    }

    setLoading(true);
    setSuggestionError(null);
    try {
      const res = await getAIMealSuggestions({
        goal: isMuscleGain ? 'MUSCLE_GAIN' : 'WEIGHT_LOSS',
        remainingCalories: typeof remainingCalories === 'number' ? remainingCalories : 2000,
        remainingProtein: typeof remainingProtein === 'number' ? remainingProtein : 120,
        mealType: activeSlot,
      });

      if (res.success && res.suggestions && res.suggestions.length > 0) {
        setCachedSlots((prev) => ({
          ...prev,
          [activeSlot]: res.suggestions,
        }));
        if (res.usage) {
          setDailySuggestCount(res.usage.used);
          if (res.usage.resetsAt) {
            setSuggestResetsAt(res.usage.resetsAt);
          }
        } else {
          setDailySuggestCount((prev) => prev + 1);
        }
      } else {
        setSuggestionError('No meal recommendations returned. Please try again.');
      }
    } catch (err: any) {
      console.log('AI Suggest Error:', err?.message);
      const errText = err?.message || '';
      if (errText.includes('LIMIT_REACHED') || err?.status === 429) {
        setDailySuggestCount(currentLimit);
        const limitMsg = `Daily meal suggestion limit reached (${currentLimit}/${currentLimit}). Resets at midnight UTC.${!isPro ? ' Upgrade to Pro for 30 suggestions/day.' : ''}`;
        setSuggestionError(limitMsg);
        return;
      }
      setSuggestionError(getFriendlyErrorMessage(err, 'Unable to load meal recommendations right now. Please check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (visible) {
      const slot = initialMealType || 'all';
      setSelectedSlot(slot);
      setSuggestionError(null);

      getCurrentSubscriptionApi()
        .then((res) => {
          if (res?.success && res.isPro) {
            setIsPro(true);
          }
        })
        .catch(() => {});

      getSubscriptionPlansApi()
        .then((res) => {
          if (res?.limits?.FREE?.MEAL_SUGGESTION?.max) {
            setFreeSuggestLimit(res.limits.FREE.MEAL_SUGGESTION.max);
          }
          if (res?.limits?.PRO?.MEAL_SUGGESTION?.max) {
            setProSuggestLimit(res.limits.PRO.MEAL_SUGGESTION.max);
          }
          if (res?.userUsage?.usage?.MEAL_SUGGESTION) {
            setDailySuggestCount(res.userUsage.usage.MEAL_SUGGESTION.used);
            if (res.userUsage.usage.MEAL_SUGGESTION.resetsAt) {
              setSuggestResetsAt(res.userUsage.usage.MEAL_SUGGESTION.resetsAt);
            }
          }
        })
        .catch(() => {});
    }
  }, [visible, initialMealType, goal]);

  const handleSelectSlot = (slot: SuggestionMealSlot) => {
    if (loading || slot === selectedSlot) return;
    setSelectedSlot(slot);
    setSuggestionError(null);
    // User can freely switch target meal time without consuming tokens.
  };

  const createFoodItem = (rec: MealSuggestion, idx: number = 0): FoodLogItem => {
    const ingredientsDesc =
      rec.ingredients && rec.ingredients.length > 0
        ? rec.ingredients.join(' · ')
        : `${rec.prepTime} prep`;

    const mappedCategory = (rec.category?.toLowerCase() || 'snack') as MealType;
    const finalMealType: MealType =
      selectedSlot !== 'all'
        ? (selectedSlot as MealType)
        : (['breakfast', 'lunch', 'dinner', 'snack'].includes(mappedCategory) ? mappedCategory : 'snack');

    return {
      id: `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      mealType: finalMealType,
      title: rec.title,
      subtitle: ingredientsDesc,
      calories: rec.calories,
      protein: rec.protein,
      carbs: rec.carbs,
      fat: rec.fat,
      goalBadge: isMuscleGain ? 'Muscle Builder' : 'Fat Loss Pick',
      goalBadgeColor: 'green',
      icon: rec.icon || '🥗',
      healthNotes: rec.reason,
    };
  };

  const handleLogMeal = (rec: MealSuggestion) => {
    hapticFeedback.light();
    const item = createFoodItem(rec);
    onSelectSuggestion(item);
    setLoggedMealTitles((prev) => [...prev, rec.title]);
  };

  const handleLogAll = () => {
    hapticFeedback.medium();
    const unlogged = currentRecommendations.filter((r) => !loggedMealTitles.includes(r.title));
    if (unlogged.length === 0) return;

    const itemsToAdd = unlogged.map((rec, idx) => createFoodItem(rec, idx));
    onSelectSuggestion(itemsToAdd);

    setLoggedMealTitles((prev) => [...prev, ...unlogged.map((r) => r.title)]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end md:justify-center md:items-center p-0 md:p-4">
        <Pressable className="hidden md:flex flex-1 w-full" onPress={onClose} />
        <View
          style={{ paddingTop: Platform.OS !== 'web' && insets.top > 0 ? insets.top + 8 : 16 }}
          className="bg-surface dark:bg-surface-dark rounded-none md:rounded-3xl flex-1 md:flex-none h-full md:h-[90%] w-full md:max-w-xl p-4 md:p-6 border-0 md:border border-input-border dark:border-input-border-dark shadow-2xl flex-col"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1 mr-2">
              <Text className="text-text-primary dark:text-text-primary-dark font-black text-xl">
                What Should I Eat?
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">
                AI meal suggestions based on your {isMuscleGain ? 'Muscle Gain' : 'Weight Loss'} goals
              </Text>
            </View>
            <ModalCloseButton onClose={onClose} />
          </View>

          {/* Subscription Quota Usage Meter */}
          <QuotaUsageMeter
            isPro={isPro}
            used={dailySuggestCount}
            limit={isPro ? proSuggestLimit : freeSuggestLimit}
            unit="suggestions"
            period="day"
            resetsAt={suggestResetsAt || undefined}
            onUpgradePress={onUpgradePress}
            className="mb-3"
          />

          {/* Inline Error Banner */}
          <ModalErrorBanner
            error={suggestionError}
            onDismiss={() => setSuggestionError(null)}
          />

          {/* Upgrade prompt if limit reached */}
          {suggestionError &&
          (suggestionError.includes('limit reached') ||
            suggestionError.includes('LIMIT_REACHED')) &&
          onUpgradePress &&
          !isPro ? (
            <TouchableOpacity
              onPress={onUpgradePress}
              activeOpacity={0.8}
              className="mb-3 py-2.5 px-3 bg-accent/15 dark:bg-accent-dark/20 border border-accent dark:border-accent-dark rounded-xl flex-row items-center justify-center gap-2"
            >
              <Ionicons name="sparkles" size={15} color={colors.accent} />
              <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                Upgrade to Pro (30 daily suggestions)
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Meal Timing / Category Scope Filter Pills */}
          <View className="mb-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
            >
              {MEAL_SLOTS.map((slot) => {
                const isSelected = selectedSlot === slot.id;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    onPress={() => handleSelectSlot(slot.id)}
                    disabled={loading}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                    className={`flex-row items-center gap-1.5 min-h-[32px] px-3.5 py-1.5 rounded-full border transition-all ${
                      isSelected
                        ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark shadow-xs'
                        : 'bg-input/80 dark:bg-input-dark/80 border-input-border dark:border-input-border-dark opacity-90'
                    }`}
                  >
                    <Ionicons
                      name={slot.icon}
                      size={13}
                      color={isSelected ? '#ffffff' : colors.accent}
                    />
                    <Text
                      className={`text-xs font-bold ${
                        isSelected
                          ? 'text-white'
                          : 'text-text-primary dark:text-text-primary-dark'
                      }`}
                    >
                      {slot.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Budget Snapshot Banner */}
          <View className="bg-input/60 dark:bg-input-dark/60 rounded-2xl p-3 mb-3.5 border border-input-border dark:border-input-border-dark flex-row justify-between items-center">
            <View className="flex-1 mr-2">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-bold uppercase">
                {remainingCalories <= 0 ? 'Daily Budget Status:' : 'Remaining Today:'}
              </Text>
              <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
                {remainingCalories <= 0
                  ? 'Goal Reached 🎉 · Light/Zero-cal picks'
                  : `${remainingCalories.toLocaleString()} kcal left · ${remainingProtein}g protein`}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              {currentRecommendations.length > 1 && !loading && remainingCalories > 0 && (
                <TouchableOpacity
                  onPress={handleLogAll}
                  disabled={currentRecommendations.every((r) => loggedMealTitles.includes(r.title))}
                  className={`px-3 py-1.5 rounded-xl border ${
                    currentRecommendations.every((r) => loggedMealTitles.includes(r.title))
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : 'bg-accent/15 dark:bg-accent-dark/20 border-accent/30'
                  }`}
                >
                  <Text
                    className={`font-bold text-xs ${
                      currentRecommendations.every((r) => loggedMealTitles.includes(r.title))
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : 'text-accent dark:text-accent-dark'
                    }`}
                  >
                    {currentRecommendations.every((r) => loggedMealTitles.includes(r.title))
                      ? '✓ All Added'
                      : `+ Log All (${currentRecommendations.filter((r) => !loggedMealTitles.includes(r.title)).length})`}
                  </Text>
                </TouchableOpacity>
              )}
              {hasGeneratedForCurrentSlot && (
                <TouchableOpacity
                  onPress={() => generateRecommendations(selectedSlot)}
                  disabled={loading}
                  className="bg-accent/15 dark:bg-accent-dark/20 px-2.5 py-1.5 rounded-xl border border-accent/30 flex-row items-center gap-1"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={13} color={colors.accent} />
                      <Text className="text-accent dark:text-accent-dark font-bold text-xs">
                        Regenerate
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color={colors.accent} />
              <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-3">
                Crafting personalized {selectedSlot !== 'all' ? `${selectedSlot} ` : ''}meal suggestions for you...
              </Text>
            </View>
          ) : !hasGeneratedForCurrentSlot ? (
            /* Pre-generation Ask / Confirmation Card - Saves tokens! */
            <View className="bg-input/40 dark:bg-input-dark/40 rounded-3xl p-6 border border-input-border dark:border-input-border-dark items-center my-3">
              <View className="w-16 h-16 rounded-2xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mb-3.5">
                <Ionicons name="sparkles" size={30} color={colors.accent} />
              </View>

              <Text className="text-text-primary dark:text-text-primary-dark font-black text-lg text-center mb-1.5">
                {selectedSlot === 'all'
                  ? 'Generate Meal Suggestions'
                  : `Generate ${selectedSlot.charAt(0).toUpperCase() + selectedSlot.slice(1)} Ideas`}
              </Text>

              <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center leading-5 mb-5 px-3">
                {remainingCalories <= 0
                  ? "You have reached today's calorie budget. FitTrack AI will generate 3 ultra-light, zero-calorie digestive & hydration recovery suggestions."
                  : selectedSlot === 'all'
                  ? `FitTrack AI will craft 3 balanced, macro-aligned meal options designed to fit your remaining ${remainingCalories.toLocaleString()} kcal and ${remainingProtein}g protein goal.`
                  : `FitTrack AI will curate 3 delicious, tailored ${selectedSlot} options that stay strictly within your remaining ${remainingCalories.toLocaleString()} kcal daily budget.`}
              </Text>

              <TouchableOpacity
                onPress={
                  !isPro && dailySuggestCount >= (isPro ? proSuggestLimit : freeSuggestLimit) && onUpgradePress
                    ? onUpgradePress
                    : () => generateRecommendations(selectedSlot)
                }
                activeOpacity={0.8}
                className="w-full bg-accent dark:bg-accent-dark py-3.5 px-5 rounded-2xl flex-row items-center justify-center gap-2 shadow-sm"
              >
                <Ionicons name="sparkles" size={16} color="#ffffff" />
                <Text className="text-white font-extrabold text-sm">
                  {!isPro && dailySuggestCount >= (isPro ? proSuggestLimit : freeSuggestLimit)
                    ? 'Daily Limit Reached · Upgrade to Pro'
                    : remainingCalories <= 0
                    ? 'Generate Light Recovery Ideas'
                    : selectedSlot === 'all'
                    ? 'Generate Whole Day Ideas'
                    : `Generate ${selectedSlot.charAt(0).toUpperCase() + selectedSlot.slice(1)} Suggestions`}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              className="flex-1 min-h-0 mb-2"
              contentContainerStyle={{ paddingBottom: 28 }}
            >
              {currentRecommendations.map((rec, idx) => (
                <View
                  key={`${rec.title}-${idx}`}
                  className="bg-input/50 dark:bg-input-dark/50 rounded-2xl p-4 mb-3 border border-input-border dark:border-input-border-dark"
                >
                  <View className="flex-row justify-between items-start mb-1.5">
                    <View className="flex-row items-center gap-2 flex-1 pr-2">
                      <Text className="text-2xl">{rec.icon}</Text>
                      <View className="flex-1">
                        <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
                          {rec.title}
                        </Text>
                        <Text className="text-text-muted dark:text-text-muted-dark text-[11px]">
                          {rec.prepTime} · Ideal for {(selectedSlot !== 'all' ? selectedSlot : rec.category).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-1.5 shrink-0">
                      {remainingCalories > 0 && rec.calories <= remainingCalories ? (
                        <View className="px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25">
                          <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                            Fits Budget ✓
                          </Text>
                        </View>
                      ) : remainingCalories > 0 && rec.calories > remainingCalories ? (
                        <View className="px-2 py-0.5 rounded-md bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25">
                          <Text className="text-[10px] font-bold text-amber-500">
                            +{rec.calories - remainingCalories} kcal over
                          </Text>
                        </View>
                      ) : (
                        <View className="px-2 py-0.5 rounded-md bg-accent/10 dark:bg-accent-dark/15 border border-accent/25">
                          <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                            Ultra-Light
                          </Text>
                        </View>
                      )}
                      <View className="bg-surface dark:bg-surface-dark px-2.5 py-1 rounded-xl border border-input-border dark:border-input-border-dark items-end">
                        <Text className="text-accent dark:text-accent-dark font-extrabold text-sm">
                          {rec.calories}
                        </Text>
                        <Text className="text-text-muted dark:text-text-muted-dark text-[9px]">kcal</Text>
                      </View>
                    </View>
                  </View>

                  {/* Why it helps */}
                  <Text className="text-text-muted dark:text-text-muted-dark text-xs italic mb-2.5 bg-surface/50 dark:bg-surface-dark/50 p-2 rounded-lg leading-4">
                    💡 {rec.reason}
                  </Text>

                  {/* Ingredients & Portions */}
                  <View className="mb-3 bg-surface/60 dark:bg-surface-dark/60 rounded-xl p-2.5 border border-input-border/60 dark:border-input-border-dark/60">
                    <View className="flex-row items-center gap-1.5 mb-1.5">
                      <Ionicons name="scale-outline" size={12} color={colors.accent} />
                      <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold uppercase tracking-wider">
                        Ingredients & Portions:
                      </Text>
                    </View>
                    <View className="gap-1">
                      {rec.ingredients.map((ing, i) => (
                        <View key={i} className="flex-row items-start gap-1.5">
                          <Text className="text-accent dark:text-accent-dark text-xs font-bold leading-4">•</Text>
                          <Text className="text-text-primary dark:text-text-primary-dark text-xs flex-1 leading-4">
                            {ing}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Macros and Action */}
                  <View className="flex-row justify-between items-center pt-2 border-t border-input-border/50 dark:border-input-border-dark/50">
                    <View className="flex-row gap-1.5">
                      <Text className="text-xs font-bold text-emerald-500 dark:text-emerald-400">{rec.protein}g P</Text>
                      <Text className="text-text-muted dark:text-text-muted-dark text-xs">·</Text>
                      <Text className="text-xs font-bold text-sky-500 dark:text-sky-400">{rec.carbs}g C</Text>
                      <Text className="text-text-muted dark:text-text-muted-dark text-xs">·</Text>
                      <Text className="text-xs font-bold text-purple-500 dark:text-purple-400">{rec.fat}g F</Text>
                    </View>

                    {loggedMealTitles.includes(rec.title) ? (
                      <View className="flex-row items-center gap-1.5">
                        <View className="bg-emerald-500/15 dark:bg-emerald-500/25 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                          <Text className="text-emerald-500 dark:text-emerald-400 font-extrabold text-xs">
                            ✓ Added
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleLogMeal(rec)}
                          activeOpacity={0.7}
                          className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-2 py-1.5 rounded-xl"
                        >
                          <Text className="text-text-muted dark:text-text-muted-dark font-bold text-[11px]">
                            +1
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleLogMeal(rec)}
                        activeOpacity={0.8}
                        className="bg-accent dark:bg-accent-dark px-3 py-1.5 rounded-xl"
                      >
                        <Text className="text-white font-bold text-xs">
                          + Log Meal
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              {/* Bottom Regenerate Action */}
              <View className="items-center py-2 pb-4">
                <TouchableOpacity
                  onPress={() => generateRecommendations(selectedSlot)}
                  disabled={loading}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-1.5 px-4 py-2 rounded-xl bg-input/60 dark:bg-input-dark/60 border border-input-border dark:border-input-border-dark"
                >
                  <Ionicons name="refresh" size={13} color={colors.accent} />
                  <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                    Want different ideas? Regenerate {selectedSlot === 'all' ? 'Meals' : selectedSlot.charAt(0).toUpperCase() + selectedSlot.slice(1)}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

        </View>
      </View>
    </Modal>
  );
}
