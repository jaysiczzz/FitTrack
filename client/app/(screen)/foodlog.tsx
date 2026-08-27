import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

import MacroSummaryCard from '@/components/foodlog/MacroSummaryCard';
import QuickActionToolbar from '@/components/foodlog/QuickActionToolbar';
import MealCategoryCard from '@/components/foodlog/MealCategoryCard';
import WaterTrackerCard from '@/components/foodlog/WaterTrackerCard';
import QuickStaplesModal from '@/components/foodlog/QuickStaplesModal';
import AiScanModal from '@/components/foodlog/AiScanModal';
import AiSuggestionModal from '@/components/foodlog/AiSuggestionModal';
import FoodLogTabs, { FoodLogTabType } from '@/components/foodlog/FoodLogTabs';
import FoodHistoryTab from '@/components/foodlog/FoodHistoryTab';
import ConfirmModal from '@/components/ui/ConfirmModal';
import NotificationToast, { NotificationType } from '@/components/ui/NotificationToast';
import { FoodLogItem, MacroTargets, MealType, BeginnerStaple, getTodayDateString, MEAL_LABELS, MEAL_ICONS } from '@/components/foodlog/foodLogTypes';
import { saveDailyFoodLogApi } from '@/api/foodlog';

export type { FoodLogItem, MealType } from '@/components/foodlog/foodLogTypes';

export default function FoodLog() {
  const [activeTab, setActiveTab] = useState<FoodLogTabType>('today');
  const [goal, setGoal] = useState<'MUSCLE_GAIN' | 'WEIGHT_LOSS'>('MUSCLE_GAIN');
  const [items, setItems] = useState<FoodLogItem[]>([]);
  const [waterMl, setWaterMl] = useState(0);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    description?: string;
    type?: NotificationType;
    icon?: string;
    actionLabel?: string;
    onAction?: () => void;
  }>({
    visible: false,
    message: '',
  });

  // Modals state
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanInitialMode, setScanInitialMode] = useState<'photo' | 'text'>('photo');
  const [scanTargetMeal, setScanTargetMeal] = useState<MealType | undefined>(undefined);
  const [showStaplesModal, setShowStaplesModal] = useState(false);
  const [showAiSuggestModal, setShowAiSuggestModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Targets computed dynamically based on goal
  const targets: MacroTargets =
    goal === 'MUSCLE_GAIN'
      ? { calories: 2400, protein: 160, carbs: 260, fat: 75 }
      : { calories: 1900, protein: 145, carbs: 180, fat: 55 };

  // Load user profile & cached food log
  const loadInitialData = async () => {
    try {
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        if (u.goal) {
          setGoal(u.goal === 'WEIGHT_LOSS' ? 'WEIGHT_LOSS' : 'MUSCLE_GAIN');
        }
      }

      const savedFood = await AsyncStorage.getItem('food_log_today');
      if (savedFood) {
        const parsed = JSON.parse(savedFood);
        if (Array.isArray(parsed)) {
          // Normalize items with default calories/macros if missing
          const normalized = parsed.map((it: any) => ({
            ...it,
            calories: it.calories || extractCalories(it.subtitle) || 200,
            protein: it.protein || extractMacro(it.macros, 'protein') || 15,
            carbs: it.carbs || extractMacro(it.macros, 'carbs') || 25,
            fat: it.fat || extractMacro(it.macros, 'fat') || 8,
          }));
          setItems(normalized);
        }
      }

      const savedWater = await AsyncStorage.getItem('water_log_today');
      if (savedWater) {
        setWaterMl(parseInt(savedWater, 10) || 0);
      }
    } catch (err) {
      console.log('Error loading initial food log:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  const extractCalories = (subtitle?: string): number => {
    if (!subtitle) return 0;
    const match = subtitle.match(/(\d+)\s*kcal/i);
    return match ? parseInt(match[1], 10) : 0;
  };

  const extractMacro = (macros: string[] | undefined, key: string): number => {
    if (!macros || !Array.isArray(macros)) return 0;
    const regex = new RegExp(`(\\d+)g\\s*${key}`, 'i');
    for (const m of macros) {
      const match = m.match(regex);
      if (match) return parseInt(match[1], 10);
    }
    return 0;
  };

  const saveFoodLog = async (newItems: FoodLogItem[]) => {
    setItems(newItems);
    try {
      // Format macros array for backward compatibility with dashboard
      const formatted = newItems.map((item) => ({
        ...item,
        macros: [
          `${item.protein}g Protein`,
          `${item.carbs}g Carbs`,
          `${item.fat}g Fat`,
        ],
      }));
      await AsyncStorage.setItem('food_log_today', JSON.stringify(formatted));
    } catch (err) {
      console.log('Error saving food log:', err);
    }
  };

  const saveWater = async (newWater: number) => {
    const clamped = Math.max(0, newWater);
    setWaterMl(clamped);
    try {
      await AsyncStorage.setItem('water_log_today', clamped.toString());
    } catch (err) {
      console.log('Error saving water:', err);
    }
  };

  const showNotification = (opts: {
    message: string;
    description?: string;
    type?: NotificationType;
    icon?: string;
    actionLabel?: string;
    onAction?: () => void;
  }) => {
    setToast({
      visible: true,
      ...opts,
    });
  };

  const hideNotification = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  // Add Item handler
  const handleAddMealItem = (item: FoodLogItem) => {
    const updated = [...items, item];
    saveFoodLog(updated);
    showNotification({
      message: `Added ${item.title}`,
      description: `${item.calories} kcal · ${item.protein}g Protein to ${MEAL_LABELS[item.mealType] || item.mealType}`,
      type: 'success',
      icon: MEAL_ICONS[item.mealType] || '🥗',
    });
  };

  // Quick Staple Selection
  const handleSelectStaple = (staple: BeginnerStaple, targetMeal: MealType) => {
    const newItem: FoodLogItem = {
      id: Date.now().toString(),
      mealType: targetMeal,
      title: staple.title,
      subtitle: staple.subtitle,
      calories: staple.calories,
      protein: staple.protein,
      carbs: staple.carbs,
      fat: staple.fat,
      goalBadge: staple.badge,
      goalBadgeColor: staple.recommendedFor === 'MUSCLE_GAIN' ? 'green' : 'blue',
    };
    handleAddMealItem(newItem);
  };

  // Delete Item
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const updated = items.filter((i) => i.id !== itemToDelete);
    saveFoodLog(updated);
    setItemToDelete(null);
    showNotification({
      message: 'Item removed from food log',
      type: 'info',
      icon: '🗑️',
    });
  };

  // Reset / Clear Today's Active Workspace (Leaves permanent History untouched)
  const handleResetLog = async () => {
    setItems([]);
    setWaterMl(0);
    try {
      await AsyncStorage.removeItem('food_log_today');
      await AsyncStorage.removeItem('water_log_today');
    } catch (err) {
      console.log('Error resetting today log:', err);
    }
    setShowResetModal(false);
    showNotification({
      message: "Today's log cleared",
      description: 'Active meals and water intake have been reset.',
      type: 'info',
      icon: '🔄',
    });
  };

  // Save & Complete Daily Intake -> Commits snapshot into History and resets active day
  const handleSaveAndCompleteDay = async () => {
    if (items.length === 0 && waterMl === 0) {
      showNotification({
        message: 'No Meals Logged',
        description: 'Please scan or log at least one meal or water intake before completing.',
        type: 'warning',
        icon: '⚠️',
      });
      return;
    }

    const todayStr = getTodayDateString();
    const formatted = items.map((item) => ({
      ...item,
      macros: [
        `${item.protein}g Protein`,
        `${item.carbs}g Carbs`,
        `${item.fat}g Fat`,
      ],
    }));

    const archivedCalories = loggedCalories;
    const archivedProtein = loggedProtein;

    try {
      // 1. Save to PostgreSQL Database via API
      try {
        await saveDailyFoodLogApi({
          date: todayStr,
          items,
          waterMl,
        });
      } catch (apiErr) {
        console.log('[FoodLog API] Failed to sync to cloud database, cached locally:', apiErr);
      }

      // 2. Commit snapshot into local date-keyed storage
      await AsyncStorage.setItem(`food_log_${todayStr}`, JSON.stringify(formatted));
      await AsyncStorage.setItem(`water_log_${todayStr}`, waterMl.toString());

      // 3. Register date in history dates array
      const rawDates = await AsyncStorage.getItem('food_log_history_dates');
      let datesArr: string[] = [];
      if (rawDates) {
        try {
          const parsed = JSON.parse(rawDates);
          if (Array.isArray(parsed)) datesArr = parsed;
        } catch {}
      }
      if (!datesArr.includes(todayStr)) {
        datesArr.unshift(todayStr);
        await AsyncStorage.setItem('food_log_history_dates', JSON.stringify(datesArr));
      }

      // 4. Reset active today workspace since it is now safely stored in History & Database
      setItems([]);
      setWaterMl(0);
      await AsyncStorage.removeItem('food_log_today');
      await AsyncStorage.removeItem('water_log_today');

      // 5. Show rewarding bottom notification toast with quick action to view history
      showNotification({
        message: '🎉 Daily Intake Completed!',
        description: `Saved ${archivedCalories} kcal · ${archivedProtein}g Protein to History.`,
        type: 'success',
        icon: '🎉',
        actionLabel: 'View History 📅',
        onAction: () => setActiveTab('history'),
      });
    } catch (err) {
      console.log('Error saving daily intake to history:', err);
      showNotification({
        message: 'Could not save to history',
        description: 'An unexpected error occurred. Please try again.',
        type: 'error',
        icon: '✕',
      });
    }
  };

  // Aggregated logged macros
  const loggedCalories = items.reduce((sum, item) => sum + (item.calories || 0), 0);
  const loggedProtein = items.reduce((sum, item) => sum + (item.protein || 0), 0);
  const loggedCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const loggedFat = items.reduce((sum, item) => sum + (item.fat || 0), 0);

  const remainingCalories = Math.max(0, targets.calories - loggedCalories);
  const remainingProtein = Math.max(0, targets.protein - loggedProtein);

  // Grouped by Meal Category
  const breakfastItems = items.filter((i) => i.mealType === 'breakfast');
  const lunchItems = items.filter((i) => i.mealType === 'lunch');
  const dinnerItems = items.filter((i) => i.mealType === 'dinner');
  const snackItems = items.filter((i) => i.mealType === 'snack');

  const openScanForMeal = (meal: MealType) => {
    setScanTargetMeal(meal);
    setScanInitialMode('photo');
    setShowScanModal(true);
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 90 }}>
        {/* Screen Header */}
        <View className="flex-row justify-between items-center mt-2 mb-1">
          <Text className="text-[28px] font-black text-text-primary dark:text-text-primary-dark">
            Nutrition Log 🥗
          </Text>
        </View>
        <Text className="text-text-muted dark:text-text-muted-dark text-xs mb-3.5">
          Beginner nutrition tracker powered by Google Gemini AI
        </Text>

        {/* Top Navigation Tabs (Today's Log | History & Trends) */}
        <FoodLogTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'history' ? (
          /* History & Trends Tab View */
          <FoodHistoryTab
            targets={targets}
            onReLogItem={handleAddMealItem}
            onSwitchToToday={() => setActiveTab('today')}
          />
        ) : (
          /* Today's Log Tab View */
          <>
            {/* 1. Daily Macro & Calorie Budget Summary Card */}
            <MacroSummaryCard
              targets={targets}
              loggedCalories={loggedCalories}
              loggedProtein={loggedProtein}
              loggedCarbs={loggedCarbs}
              loggedFat={loggedFat}
              goal={goal}
            />

            {/* 2. Quick Action Toolbar (Photo Scan, AI Suggest, Staples, Describe) */}
            <QuickActionToolbar
              onScanPhoto={() => {
                setScanTargetMeal(undefined);
                setScanInitialMode('photo');
                setShowScanModal(true);
              }}
              onAiSuggest={() => setShowAiSuggestModal(true)}
              onQuickStaples={() => {
                setScanTargetMeal(undefined);
                setShowStaplesModal(true);
              }}
              onTextLog={() => {
                setScanTargetMeal(undefined);
                setScanInitialMode('text');
                setShowScanModal(true);
              }}
            />

            {/* 3. Meal Category Cards */}
            <View className="mb-2">
              <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm mb-3">
                Today's Logged Meals 🍽️
              </Text>

              {/* Breakfast */}
              <MealCategoryCard
                type="breakfast"
                title="Breakfast"
                icon="🍳"
                items={breakfastItems}
                onAddPress={openScanForMeal}
                onDeleteItem={(id) => setItemToDelete(id)}
              />

              {/* Lunch */}
              <MealCategoryCard
                type="lunch"
                title="Lunch"
                icon="🍽️"
                items={lunchItems}
                onAddPress={openScanForMeal}
                onDeleteItem={(id) => setItemToDelete(id)}
              />

              {/* Dinner */}
              <MealCategoryCard
                type="dinner"
                title="Dinner"
                icon="🌙"
                items={dinnerItems}
                onAddPress={openScanForMeal}
                onDeleteItem={(id) => setItemToDelete(id)}
              />

              {/* Snacks & Drinks */}
              <MealCategoryCard
                type="snack"
                title="Snacks & Drinks"
                icon="🥪"
                items={snackItems}
                onAddPress={openScanForMeal}
                onDeleteItem={(id) => setItemToDelete(id)}
              />
            </View>

            {/* 4. Hydration Water Tracker */}
            <WaterTrackerCard
              waterMl={waterMl}
              targetMl={2000}
              onAddWater={(delta) => saveWater(waterMl + delta)}
            />

            {/* 5. Daily Summary Completion & Reset Controls */}
            <View className="mt-2 flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowResetModal(true)}
                activeOpacity={0.8}
                className="flex-1 bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark py-3.5 rounded-2xl items-center justify-center"
              >
                <Text className="text-text-muted dark:text-text-muted-dark font-bold text-xs">
                  🔄 Clear Today's Log
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveAndCompleteDay}
                activeOpacity={0.8}
                className="flex-1 bg-accent dark:bg-accent-dark py-3.5 rounded-2xl items-center justify-center shadow-xs"
              >
                <Text className="text-background dark:text-background-dark font-black text-xs">
                  ✓ Save & Complete
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* AI Scan & Photo Modal */}
      <AiScanModal
        visible={showScanModal}
        onClose={() => setShowScanModal(false)}
        onAddMealItem={handleAddMealItem}
        initialMealType={scanTargetMeal}
        initialMode={scanInitialMode}
      />

      {/* Beginner Quick Staples Modal */}
      <QuickStaplesModal
        visible={showStaplesModal}
        onClose={() => setShowStaplesModal(false)}
        onSelectStaple={handleSelectStaple}
        defaultMeal={scanTargetMeal}
      />

      {/* AI "What should I eat next?" Suggestions Modal */}
      <AiSuggestionModal
        visible={showAiSuggestModal}
        onClose={() => setShowAiSuggestModal(false)}
        onSelectSuggestion={handleAddMealItem}
        goal={goal}
        remainingCalories={remainingCalories}
        remainingProtein={remainingProtein}
      />

      {/* Delete Item Confirmation Modal */}
      <ConfirmModal
        visible={Boolean(itemToDelete)}
        title="Remove Item"
        message="Are you sure you want to delete this food item from your log?"
        icon="🗑️"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Reset Daily Log Modal */}
      <ConfirmModal
        visible={showResetModal}
        title="Reset Today's Log"
        message="This will clear all meals and water logged for today. Are you sure?"
        icon="⚠️"
        confirmText="Reset All"
        cancelText="Keep Log"
        onConfirm={handleResetLog}
        onCancel={() => setShowResetModal(false)}
      />

      {/* Floating Bottom Notification Toast */}
      <NotificationToast
        visible={toast.visible}
        message={toast.message}
        description={toast.description}
        type={toast.type}
        icon={toast.icon}
        actionLabel={toast.actionLabel}
        onAction={toast.onAction}
        onDismiss={hideNotification}
        bottomOffset={16}
      />
    </SafeAreaView>
  );
}