import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeMeal, MealAnalysisResult } from '../../api/ai';

export interface FoodLogItem {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  title: string;
  subtitle?: string;
  macros: string[];
}

const FoodItem: React.FC<{
  title: string;
  subtitle?: string;
  macros: string[];
  onDelete?: () => void;
}> = ({ title, subtitle, macros, onDelete }) => (
  <View className="bg-surface dark:bg-surface-dark rounded-[14px] p-3.5 mb-2.5 border border-input-border dark:border-input-border-dark flex-row justify-between items-center">
    <View className="flex-1 pr-3">
      <Text className="text-text-primary dark:text-text-primary-dark text-sm font-semibold mb-1.5">
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-text-muted dark:text-text-muted-dark text-xs">{subtitle}</Text>
      ) : null}
    </View>
    <View className="items-end flex-row items-center gap-3">
      <View className="items-end">
        {macros.map((line, index) => (
          <Text key={index} className="text-text-primary dark:text-text-primary-dark text-xs text-right">
            {line}
          </Text>
        ))}
      </View>
      {onDelete ? (
        <TouchableOpacity onPress={onDelete} className="p-1">
          <Text className="text-red-500/70 text-xs font-bold">✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

export default function FoodLog() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<MealAnalysisResult | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast');

  const [items, setItems] = useState<FoodLogItem[]>([
    { id: '1', mealType: 'breakfast', title: 'Greek Yogurt with Granola', subtitle: '1 cup · 180g (280 kcal)', macros: ['18g Protein', '32g Carbs', '8g Fat'] },
    { id: '2', mealType: 'breakfast', title: 'Banana', subtitle: '1 medium · 120g (105 kcal)', macros: ['1g Protein', '27g Carbs', '0g Fat'] },
    { id: '3', mealType: 'lunch', title: 'Grilled Chicken Salad', subtitle: '1 bowl · 350g (380 kcal)', macros: ['45g Protein', '18g Carbs', '14g Fat'] },
    { id: '4', mealType: 'lunch', title: 'Whole Wheat Bread', subtitle: '2 slices · 60g (140 kcal)', macros: ['6g Protein', '24g Carbs', '2g Fat'] },
    { id: '5', mealType: 'dinner', title: 'Baked Salmon', subtitle: '200g fillet (410 kcal)', macros: ['40g Protein', '0g Carbs', '22g Fat'] },
    { id: '6', mealType: 'dinner', title: 'Brown Rice', subtitle: '1 cup cooked · 200g (215 kcal)', macros: ['5g Protein', '45g Carbs', '2g Fat'] },
  ]);

  useEffect(() => {
    const loadSavedItems = async () => {
      try {
        const saved = await AsyncStorage.getItem('food_log_today');
        if (saved) {
          setItems(JSON.parse(saved));
        }
      } catch (err) {
        console.log('Error loading saved food log:', err);
      }
    };
    loadSavedItems();
  }, []);

  const saveFoodLogToStorage = async (updatedItems: FoodLogItem[]) => {
    setItems(updatedItems);
    try {
      await AsyncStorage.setItem('food_log_today', JSON.stringify(updatedItems));
    } catch (err) {
      console.log('Error saving food log:', err);
    }
  };

  const handleAnalyzeMeal = async () => {
    if (!prompt.trim()) {
      Alert.alert('Empty Input', 'Please describe what you ate to analyze it with AI.');
      return;
    }

    setLoading(true);
    setAiResult(null);

    try {
      const res = await analyzeMeal({ description: prompt });
      if (res.success && res.data) {
        setAiResult(res.data);
      }
    } catch (err: any) {
      Alert.alert('AI Error', err.message || 'Failed to analyze meal with AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAiMeal = () => {
    if (!aiResult) return;

    const newItem: FoodLogItem = {
      id: Date.now().toString(),
      mealType: selectedMeal,
      title: aiResult.foodName,
      subtitle: `${aiResult.servingSize} (${aiResult.calories} kcal)`,
      macros: [
        `${aiResult.protein}g Protein`,
        `${aiResult.carbs}g Carbs`,
        `${aiResult.fat}g Fat`,
      ],
    };

    const updated = [...items, newItem];
    saveFoodLogToStorage(updated);
    setPrompt('');
    setAiResult(null);
    Alert.alert('Success', `Added ${aiResult.foodName} to ${selectedMeal}!`);
  };

  const handleDeleteItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    saveFoodLogToStorage(updated);
  };

  const breakfastItems = items.filter((i) => i.mealType === 'breakfast');
  const lunchItems = items.filter((i) => i.mealType === 'lunch');
  const dinnerItems = items.filter((i) => i.mealType === 'dinner');

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-20">
        <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-bold mt-2">
          Nutrition Tracker 🥗
        </Text>
        <Text className="text-text-muted dark:text-text-muted-dark mt-0.5 mb-4 text-sm">
          Track your daily meals with AI-powered nutritional analysis
        </Text>

        {/* AI Quick Meal Log Card */}
        <View className="bg-surface dark:bg-surface-dark p-4 rounded-[20px] mb-5 border border-accent/30 dark:border-accent-dark/30">
          <Text className="text-accent dark:text-accent-dark font-bold text-base mb-1">
            ✨ AI Fast Meal Analyzer
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs mb-3">
            Describe your meal (e.g. "2 poached eggs, 1 avocado toast and orange juice"):
          </Text>

          <TextInput
            className="bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark p-3 rounded-xl mb-3 border border-input-border dark:border-input-border-dark text-sm"
            placeholder="Type your meal description..."
            placeholderTextColor="#8E8E93"
            value={prompt}
            onChangeText={setPrompt}
            multiline
          />

          <View className="flex-row items-center justify-between">
            <View className="flex-row gap-1">
              {(['breakfast', 'lunch', 'dinner'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setSelectedMeal(m)}
                  className={`px-2.5 py-1 rounded-lg ${
                    selectedMeal === m
                      ? 'bg-accent dark:bg-accent-dark'
                      : 'bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark'
                  }`}
                >
                  <Text
                    className={`text-xs capitalize font-medium ${
                      selectedMeal === m
                        ? 'text-background dark:text-background-dark'
                        : 'text-text-muted dark:text-text-muted-dark'
                    }`}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              className="bg-accent dark:bg-accent-dark px-4 py-2 rounded-xl flex-row items-center justify-center"
              onPress={handleAnalyzeMeal}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#101828" />
              ) : (
                <Text className="text-background dark:text-background-dark font-bold text-xs">
                  Analyze with AI
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* AI Result preview */}
          {aiResult ? (
            <View className="mt-4 p-3 bg-input dark:bg-input-dark rounded-xl border border-accent/40">
              <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm mb-1">
                {aiResult.foodName} ({aiResult.calories} kcal)
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-xs mb-2">
                Portion: {aiResult.servingSize} | {aiResult.protein}g Protein | {aiResult.carbs}g Carbs | {aiResult.fat}g Fat
              </Text>
              {aiResult.healthNotes ? (
                <Text className="text-accent dark:text-accent-dark text-xs italic mb-2">
                  💡 {aiResult.healthNotes}
                </Text>
              ) : null}
              <TouchableOpacity
                className="bg-accent dark:bg-accent-dark py-2 rounded-lg items-center mt-1"
                onPress={handleAddAiMeal}
              >
                <Text className="text-background dark:text-background-dark font-bold text-xs">
                  + Add to {selectedMeal.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Breakfast */}
        <View className="flex-row justify-between items-center mt-2 mb-2">
          <Text className="text-text-primary dark:text-text-primary-dark text-[15px] font-bold">
            🍳 Breakfast
          </Text>
        </View>
        {breakfastItems.map((item) => (
          <FoodItem key={item.id} title={item.title} subtitle={item.subtitle} macros={item.macros} onDelete={() => handleDeleteItem(item.id)} />
        ))}

        {/* Lunch */}
        <View className="flex-row justify-between items-center mt-4 mb-2">
          <Text className="text-text-primary dark:text-text-primary-dark text-[15px] font-bold">
            🍽️ Lunch
          </Text>
        </View>
        {lunchItems.map((item) => (
          <FoodItem key={item.id} title={item.title} subtitle={item.subtitle} macros={item.macros} onDelete={() => handleDeleteItem(item.id)} />
        ))}

        {/* Dinner */}
        <View className="flex-row justify-between items-center mt-4 mb-2">
          <Text className="text-text-primary dark:text-text-primary-dark text-[15px] font-bold">
            🌙 Dinner
          </Text>
        </View>
        {dinnerItems.map((item) => (
          <FoodItem key={item.id} title={item.title} subtitle={item.subtitle} macros={item.macros} onDelete={() => handleDeleteItem(item.id)} />
        ))}

        <View className="h-7" />
        <TouchableOpacity
          className="bg-accent dark:bg-accent-dark mx-2 py-3 rounded-xl items-center mt-1.5"
          onPress={() => Alert.alert('Daily Log', 'Your daily nutrition log has been saved!')}
        >
          <Text className="text-background dark:text-background-dark font-bold text-base">
            Complete Daily Log
          </Text>
        </TouchableOpacity>
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}