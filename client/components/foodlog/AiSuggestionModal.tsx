import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MealType, FoodLogItem } from './foodLogTypes';
import { getAIMealSuggestions, MealSuggestion } from '../../api/ai';
import { useToast } from '../../context/ToastContext';
import { COLORS } from '@/constants/colors';
import ModalCloseButton from '../ui/ModalCloseButton';
import InModalToast from '../ui/InModalToast';

interface AiSuggestionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSuggestion: (item: FoodLogItem) => void;
  goal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS';
  remainingCalories: number;
  remainingProtein: number;
}

export default function AiSuggestionModal({
  visible,
  onClose,
  onSelectSuggestion,
  goal,
  remainingCalories,
  remainingProtein,
}: AiSuggestionModalProps) {
  const { showWarning, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<MealSuggestion[]>([]);
  const [loggedMealTitles, setLoggedMealTitles] = useState<string[]>([]);
  const [inModalToast, setInModalToast] = useState<{
    message: string;
    description?: string;
    icon?: string;
  } | null>(null);

  const isMuscleGain = goal === 'MUSCLE_GAIN';

  const generateRecommendations = async () => {
    setLoading(true);
    setLoggedMealTitles([]);
    setInModalToast(null);
    try {
      const res = await getAIMealSuggestions({
        goal: isMuscleGain ? 'MUSCLE_GAIN' : 'WEIGHT_LOSS',
        remainingCalories: remainingCalories || 2000,
        remainingProtein: remainingProtein || 120,
      });

      if (res.success && res.suggestions && res.suggestions.length > 0) {
        setRecommendations(res.suggestions);
      } else {
        showWarning('AI Notice', 'No meal recommendations returned. Please try again.');
      }
    } catch (err: any) {
      console.log('AI Suggest Error:', err?.message);
      showError('Suggestions Unavailable', 'Unable to load meal recommendations right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (visible) {
      setLoggedMealTitles([]);
      generateRecommendations();
    }
  }, [visible, goal]);

  const handleLogMeal = (rec: MealSuggestion) => {
    const ingredientsDesc =
      rec.ingredients && rec.ingredients.length > 0
        ? rec.ingredients.join(' · ')
        : `${rec.prepTime} prep`;

    const item: FoodLogItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      mealType: rec.category,
      title: rec.title,
      subtitle: ingredientsDesc,
      calories: rec.calories,
      protein: rec.protein,
      carbs: rec.carbs,
      fat: rec.fat,
      goalBadge: isMuscleGain ? '💪 Muscle Builder' : '🔥 Fat Loss Pick',
      goalBadgeColor: 'green',
      icon: rec.icon || '🥗',
      healthNotes: rec.reason,
    };
    onSelectSuggestion(item);
    setLoggedMealTitles((prev) => [...prev, rec.title]);
    setInModalToast({
      message: `Added ${rec.title}`,
      description: `${rec.calories} kcal · ${rec.protein}g Protein to ${rec.category.toUpperCase()}`,
      icon: rec.icon || '✓',
    });
  };

  const handleLogAll = () => {
    const unlogged = recommendations.filter((r) => !loggedMealTitles.includes(r.title));
    unlogged.forEach((rec, idx) => {
      setTimeout(() => {
        handleLogMeal(rec);
      }, idx * 60);
    });
    if (unlogged.length > 1) {
      setTimeout(() => {
        setInModalToast({
          message: `Added ${unlogged.length} meals to food log`,
          description: `${unlogged.reduce((s, r) => s + r.calories, 0)} total kcal added`,
          icon: '🎉',
        });
      }, unlogged.length * 65);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl max-h-[88%] p-5 border-t border-input-border dark:border-input-border-dark shadow-2xl">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1 mr-2">
              <Text className="text-text-primary dark:text-text-primary-dark font-black text-xl">
                What Should I Eat? 💡
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">
                AI meal suggestions based on your {isMuscleGain ? 'Muscle Gain' : 'Weight Loss'} goals
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              {loggedMealTitles.length > 0 && (
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.8}
                  className="bg-accent dark:bg-accent-dark px-3 py-1.5 rounded-xl shadow-xs"
                >
                  <Text className="text-background dark:text-background-dark font-extrabold text-xs">
                    Done ({loggedMealTitles.length})
                  </Text>
                </TouchableOpacity>
              )}
              <ModalCloseButton onClose={onClose} />
            </View>
          </View>

          {/* Budget Snapshot Banner */}
          <View className="bg-input/60 dark:bg-input-dark/60 rounded-2xl p-3 mb-3.5 border border-input-border dark:border-input-border-dark flex-row justify-between items-center">
            <View className="flex-1 mr-2">
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-bold uppercase">
                Remaining Today:
              </Text>
              <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
                {remainingCalories} kcal left · {remainingProtein}g protein
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              {recommendations.length > 1 && !loading && (
                <TouchableOpacity
                  onPress={handleLogAll}
                  disabled={recommendations.every((r) => loggedMealTitles.includes(r.title))}
                  className={`px-3 py-1.5 rounded-xl border ${
                    recommendations.every((r) => loggedMealTitles.includes(r.title))
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : 'bg-accent/15 dark:bg-accent-dark/20 border-accent/30'
                  }`}
                >
                  <Text
                    className={`font-bold text-xs ${
                      recommendations.every((r) => loggedMealTitles.includes(r.title))
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : 'text-accent dark:text-accent-dark'
                    }`}
                  >
                    {recommendations.every((r) => loggedMealTitles.includes(r.title))
                      ? '✓ All Added'
                      : `+ Log All (${recommendations.filter((r) => !loggedMealTitles.includes(r.title)).length})`}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={generateRecommendations}
                disabled={loading}
                className="bg-accent/15 dark:bg-accent-dark/20 px-2.5 py-1.5 rounded-xl border border-accent/30"
              >
                <Text className="text-accent dark:text-accent-dark font-bold text-xs">
                  {loading ? '...' : '🔄'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color={COLORS.accent.DEFAULT} />
              <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-3">
                Crafting personalized meal suggestions for you...
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
              {recommendations.map((rec, idx) => (
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
                          ⏱️ {rec.prepTime} · Ideal for {rec.category.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View className="bg-surface dark:bg-surface-dark px-2.5 py-1 rounded-xl border border-input-border dark:border-input-border-dark items-end">
                      <Text className="text-accent dark:text-accent-dark font-extrabold text-sm">
                        {rec.calories}
                      </Text>
                      <Text className="text-text-muted dark:text-text-muted-dark text-[9px]">kcal</Text>
                    </View>
                  </View>

                  {/* Why it helps */}
                  <Text className="text-text-muted dark:text-text-muted-dark text-xs italic mb-2.5 bg-surface/50 dark:bg-surface-dark/50 p-2 rounded-lg leading-4">
                    💡 {rec.reason}
                  </Text>

                  {/* Ingredients */}
                  <View className="mb-3">
                    <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold uppercase mb-1">
                      Ingredients:
                    </Text>
                    {rec.ingredients.map((ing, i) => (
                      <Text key={i} className="text-text-primary dark:text-text-primary-dark text-xs mb-0.5">
                        • {ing}
                      </Text>
                    ))}
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
                        className="bg-accent dark:bg-accent-dark px-4 py-2 rounded-xl"
                      >
                        <Text className="text-background dark:text-background-dark font-bold text-xs">
                          + Log This Meal
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* In-Modal Toast Notification */}
          <InModalToast
            visible={Boolean(inModalToast)}
            message={inModalToast?.message || ''}
            description={inModalToast?.description}
            icon={inModalToast?.icon || '✓'}
            onDismiss={() => setInModalToast(null)}
            bottomOffset={20}
          />
        </View>
      </View>
    </Modal>
  );
}
