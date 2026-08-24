import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MealType, FoodLogItem } from './foodLogTypes';
import { getAIMealSuggestions, MealSuggestion } from '../../api/ai';

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
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<MealSuggestion[]>([]);

  const isMuscleGain = goal === 'MUSCLE_GAIN';

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const res = await getAIMealSuggestions({
        goal: isMuscleGain ? 'MUSCLE_GAIN' : 'WEIGHT_LOSS',
        remainingCalories: remainingCalories || 2000,
        remainingProtein: remainingProtein || 120,
      });

      if (res.success && res.suggestions && res.suggestions.length > 0) {
        setRecommendations(res.suggestions);
      } else {
        Alert.alert('AI Notice', 'No recommendations returned. Please try again.');
      }
    } catch (err: any) {
      console.log('AI Suggest Error:', err.message);
      Alert.alert('AI Connection', err.message || 'Could not fetch Gemini AI meal suggestions.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (visible) {
      generateRecommendations();
    }
  }, [visible, goal]);

  const handleLogMeal = (rec: MealSuggestion) => {
    const item: FoodLogItem = {
      id: Date.now().toString(),
      mealType: rec.category,
      title: rec.title,
      subtitle: `${rec.prepTime} prep · (${rec.calories} kcal)`,
      calories: rec.calories,
      protein: rec.protein,
      carbs: rec.carbs,
      fat: rec.fat,
      goalBadge: isMuscleGain ? '💪 Muscle Builder' : '🔥 Fat Loss Pick',
      goalBadgeColor: 'green',
      healthNotes: rec.reason,
    };
    onSelectSuggestion(item);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface dark:bg-surface-dark rounded-t-[28px] max-h-[88%] p-5 border-t border-input-border dark:border-input-border-dark shadow-2xl">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-text-primary dark:text-text-primary-dark font-black text-xl">
                What Should I Eat? 💡
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs">
                AI meal suggestions based on your {isMuscleGain ? 'Muscle Gain' : 'Weight Loss'} goals
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-input dark:bg-input-dark items-center justify-center"
            >
              <Text className="text-text-primary dark:text-text-primary-dark font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Budget Snapshot Banner */}
          <View className="bg-input/60 dark:bg-input-dark/60 rounded-2xl p-3 mb-3.5 border border-input-border dark:border-input-border-dark flex-row justify-between items-center">
            <View>
              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-bold uppercase">
                Remaining Today:
              </Text>
              <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
                {remainingCalories} kcal left · {remainingProtein}g protein to hit
              </Text>
            </View>
            <TouchableOpacity
              onPress={generateRecommendations}
              disabled={loading}
              className="bg-accent/15 dark:bg-accent-dark/20 px-3 py-1.5 rounded-xl border border-accent/30"
            >
              <Text className="text-accent dark:text-accent-dark font-bold text-xs">
                {loading ? 'Refreshing...' : '🔄 Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#00E5A0" />
              <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-3">
                Crafting personalized beginner meal suggestions with Gemini AI...
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
                      <Text className="text-xs font-bold text-emerald-500">{rec.protein}g P</Text>
                      <Text className="text-text-muted text-xs">·</Text>
                      <Text className="text-xs font-bold text-sky-500">{rec.carbs}g C</Text>
                      <Text className="text-xs font-muted text-xs">·</Text>
                      <Text className="text-xs font-bold text-purple-500">{rec.fat}g F</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleLogMeal(rec)}
                      activeOpacity={0.8}
                      className="bg-accent dark:bg-accent-dark px-4 py-2 rounded-xl"
                    >
                      <Text className="text-background dark:text-background-dark font-bold text-xs">
                        + Log This Meal
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
