import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

import MacroSummaryCard from '@/components/foodlog/MacroSummaryCard';
import QuickActionToolbar from '@/components/foodlog/QuickActionToolbar';
import MealCategoryCard from '@/components/foodlog/MealCategoryCard';
import WaterTrackerCard from '@/components/foodlog/WaterTrackerCard';
import FoodSearchModal from '@/components/foodlog/FoodSearchModal';
import AiScanModal from '@/components/foodlog/AiScanModal';
import AiSuggestionModal from '@/components/foodlog/AiSuggestionModal';
import FoodLogTabs, { FoodLogTabType } from '@/components/foodlog/FoodLogTabs';
import FoodHistoryTab from '@/components/foodlog/FoodHistoryTab';
import EditMealModal from '@/components/foodlog/EditMealModal';
import RemoveFoodModal from '@/components/foodlog/RemoveFoodModal';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import { FoodLogItem, MacroTargets, MealType, getTodayDateString, MEAL_LABELS, MEAL_ICONS, getSmartFoodBadge, calculatePersonalizedTargets } from '@/components/foodlog/foodLogTypes';
import { saveDailyFoodLogApi, getDailyFoodLogApi } from '@/api/foodlog';

export type { FoodLogItem, MealType } from '@/components/foodlog/foodLogTypes';

export default function FoodLog() {
  const { user } = useAuth();
  const userId = user?.id;
  const foodKey = authStorage.getScopedKey(userId, 'food_log_today');
  const waterKey = authStorage.getScopedKey(userId, 'water_log_today');
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<FoodLogTabType>('today');
  const [goal, setGoal] = useState<'MUSCLE_GAIN' | 'WEIGHT_LOSS'>('MUSCLE_GAIN');
  const [items, setItems] = useState<FoodLogItem[]>([]);
  const [waterMl, setWaterMl] = useState(0);

  const isLoadingRef = useRef(false);

  // Modals state
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanInitialMode, setScanInitialMode] = useState<'photo' | 'text'>('photo');
  const [scanTargetMeal, setScanTargetMeal] = useState<MealType | undefined>(undefined);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAiSuggestModal, setShowAiSuggestModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FoodLogItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<FoodLogItem | null>(null);

  // Targets computed dynamically based on user body stats & goal
  const targets: MacroTargets = useMemo(() => {
    return calculatePersonalizedTargets(user, goal);
  }, [user?.weight, user?.height, user?.age, user?.goal, goal]);

  // Load user profile & cached food log
  const loadInitialData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      if (user?.goal) {
        setGoal(user.goal === 'WEIGHT_LOSS' ? 'WEIGHT_LOSS' : 'MUSCLE_GAIN');
      }

      // 1. Read user-scoped local storage for instant UI render
      const savedFood = await AsyncStorage.getItem(foodKey);
      if (savedFood) {
        try {
          const parsed = JSON.parse(savedFood);
          if (Array.isArray(parsed)) {
            const normalized = parsed.map((item: any) => {
              if (!item.goalBadge || !item.goalBadgeColor) {
                const b = getSmartFoodBadge(item);
                return { ...item, goalBadge: b.badge, goalBadgeColor: b.color };
              }
              return item;
            });
            setItems(normalized);
          } else {
            setItems([]);
          }
        } catch {
          setItems([]);
        }
      } else {
        setItems([]);
      }

      const savedWater = await AsyncStorage.getItem(waterKey);
      if (savedWater) {
        setWaterMl(parseInt(savedWater, 10) || 0);
      } else {
        setWaterMl(0);
      }

      // 2. Fetch authenticated user's actual database log for today
      if (userId) {
        const todayStr = getTodayDateString();
        try {
          const cloudRes = await getDailyFoodLogApi(todayStr);
          if (cloudRes?.data) {
            if (Array.isArray(cloudRes.data.meals) && cloudRes.data.meals.length > 0) {
              const cloudItems: FoodLogItem[] = cloudRes.data.meals.map((m: any) => {
                const badgeInfo = (m.goalBadge && m.goalBadgeColor)
                  ? { badge: m.goalBadge, color: m.goalBadgeColor }
                  : getSmartFoodBadge(m);
                return {
                  id: m.id,
                  mealType: m.mealType as MealType,
                  title: m.title,
                  subtitle: m.subtitle || undefined,
                  calories: m.calories,
                  protein: m.protein,
                  carbs: m.carbs,
                  fat: m.fat,
                  goalBadge: badgeInfo.badge,
                  goalBadgeColor: badgeInfo.color,
                  icon: m.icon || undefined,
                  healthNotes: m.healthNotes || undefined,
                  imageUri: m.imageUri || undefined,
                  loggedAt: m.loggedAt || undefined,
                };
              });
              setItems(cloudItems);
              await AsyncStorage.setItem(foodKey, JSON.stringify(cloudItems));
            }
            if (typeof cloudRes.data.waterMl === 'number') {
              setWaterMl(cloudRes.data.waterMl);
              await AsyncStorage.setItem(waterKey, cloudRes.data.waterMl.toString());
            }
          }
        } catch (apiErr) {
          console.log('[FoodLog] Offline mode, using user-scoped local cache');
        }
      }
    } catch (err) {
      console.log('Error loading initial food log:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [foodKey, waterKey, userId])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('FOOD_LOG_UPDATED', () => {
      loadInitialData();
    });
    return () => {
      sub.remove();
    };
  }, [foodKey, waterKey, userId]);

  const saveFoodLog = async (newItems: FoodLogItem[]) => {
    setItems(newItems);
    try {
      await AsyncStorage.setItem(foodKey, JSON.stringify(newItems));
      DeviceEventEmitter.emit('FOOD_LOG_UPDATED');
    } catch (err) {
      console.log('Error saving food log:', err);
    }
  };

  // Target hydration based on bodyweight (35ml / kg), clamped to min 2000ml, rounded to nearest 250ml
  const targetWaterMl = user?.weight
    ? Math.max(2000, Math.round((user.weight * 35) / 250) * 250)
    : 2500;

  const saveWater = async (newWater: number) => {
    const clamped = Math.min(6000, Math.max(0, newWater));
    if (waterMl < targetWaterMl && clamped >= targetWaterMl) {
      showToast({
        message: 'Hydration Goal Reached! 💧',
        description: `You reached your daily water goal of ${targetWaterMl.toLocaleString()} ml! Outstanding work!`,
        type: 'success',
        icon: '🎉',
      });
    }
    setWaterMl(clamped);
    try {
      await AsyncStorage.setItem(waterKey, clamped.toString());
    } catch (err) {
      console.log('Error saving water:', err);
    }
  };

  // Add Item handler
  const handleAddMealItem = (item: FoodLogItem) => {
    const updated = [...items, item];
    saveFoodLog(updated);
    showToast({
      message: `Added ${item.title}`,
      description: `${item.calories} kcal · ${item.protein}g Protein to ${MEAL_LABELS[item.mealType] || item.mealType}`,
      type: 'success',
      icon: MEAL_ICONS[item.mealType] || '🥗',
    });
  };

  // Update Item handler
  const handleUpdateMealItem = (updatedItem: FoodLogItem) => {
    const updated = items.map((i) => (i.id === updatedItem.id ? updatedItem : i));
    saveFoodLog(updated);
    showToast({
      message: `Updated ${updatedItem.title}`,
      description: `${updatedItem.calories} kcal · ${updatedItem.protein}g Protein (${MEAL_LABELS[updatedItem.mealType]})`,
      type: 'success',
      icon: MEAL_ICONS[updatedItem.mealType] || '✏️',
    });
  };

  const promptDeleteItem = (id: string) => {
    const found = items.find((i) => i.id === id);
    if (found) {
      setItemToDelete(found);
    }
  };

  // Delete Item
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const removedTitle = itemToDelete.title;
    const updated = items.filter((i) => i.id !== itemToDelete.id);
    saveFoodLog(updated);
    setItemToDelete(null);
    showToast({
      message: `Removed ${removedTitle}`,
      description: 'Item removed from food log',
      type: 'info',
      icon: '🗑️',
    });
  };

  // Save & Complete Daily Intake -> Commits snapshot into History and resets active day
  const handleSaveAndCompleteDay = async () => {
    if (items.length === 0 && waterMl === 0) {
      showToast({
        message: 'No Meals Logged',
        description: 'Please scan or log at least one meal or water intake before completing.',
        type: 'warning',
        icon: '⚠️',
      });
      return;
    }

    const todayStr = getTodayDateString();
    const currentItems = [...items];
    const currentWater = waterMl;
    const archivedCalories = loggedCalories;
    const archivedProtein = loggedProtein;

    const historyDateKey = authStorage.getScopedKey(userId, `food_log_${todayStr}`);
    const historyWaterKey = authStorage.getScopedKey(userId, `water_log_${todayStr}`);
    const historyDatesKey = authStorage.getScopedKey(userId, 'food_log_history_dates');

    // 1. Instantly reset active UI state & show notification (0ms delay)
    setItems([]);
    setWaterMl(0);

    showToast({
      message: '🎉 Daily Intake Completed!',
      description: `Saved ${archivedCalories} kcal · ${archivedProtein}g Protein to History.`,
      type: 'success',
      icon: '🎉',
      actionLabel: 'View History 📅',
      onAction: () => setActiveTab('history'),
    });

    // 2. Persist to storage & cloud API concurrently in the background
    try {
      await Promise.all([
        AsyncStorage.setItem(historyDateKey, JSON.stringify(currentItems)),
        AsyncStorage.setItem(historyWaterKey, currentWater.toString()),
        AsyncStorage.removeItem(foodKey),
        AsyncStorage.removeItem(waterKey),
        (async () => {
          const rawDates = await AsyncStorage.getItem(historyDatesKey);
          let datesArr: string[] = [];
          if (rawDates) {
            try {
              const parsed = JSON.parse(rawDates);
              if (Array.isArray(parsed)) datesArr = parsed;
            } catch {}
          }
          if (!datesArr.includes(todayStr)) {
            datesArr.unshift(todayStr);
            await AsyncStorage.setItem(historyDatesKey, JSON.stringify(datesArr));
          }
        })(),
        saveDailyFoodLogApi({
          date: todayStr,
          items: currentItems,
          waterMl: currentWater,
        }).catch((apiErr) => {
          console.log('[FoodLog API] Failed to sync to cloud database, cached locally:', apiErr);
        }),
      ]);
      DeviceEventEmitter.emit('FOOD_LOG_UPDATED');
    } catch (err) {
      console.log('Error in background food log archiving:', err);
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

  const openSearchForMeal = (meal: MealType) => {
    setScanTargetMeal(meal);
    setShowSearchModal(true);
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 92 }}>
        {/* Screen Header */}
        <View className="mb-2.5">
          <Text className="text-2xl font-black text-text-primary dark:text-text-primary-dark">
            Nutrition Log 🥗
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
            Real-time daily fuel & macro tracking
          </Text>
        </View>

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

            {/* 2. Quick Action Toolbar (Photo Scan, AI Suggest, Search Food, Describe) */}
            <QuickActionToolbar
              onScanPhoto={() => {
                setScanTargetMeal(undefined);
                setScanInitialMode('photo');
                setShowScanModal(true);
              }}
              onAiSuggest={() => setShowAiSuggestModal(true)}
              onSearchFood={() => {
                setScanTargetMeal(undefined);
                setShowSearchModal(true);
              }}
              onTextLog={() => {
                setScanTargetMeal(undefined);
                setScanInitialMode('text');
                setShowScanModal(true);
              }}
            />

            {/* 3. Meal Category Cards */}
            <View className="mb-2">
              <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm mb-2.5">
                Today's Logged Meals 🍽️
              </Text>

              {/* Breakfast */}
              <MealCategoryCard
                type="breakfast"
                title="Breakfast"
                icon="🍳"
                items={breakfastItems}
                onAddPress={openSearchForMeal}
                onScanPress={openScanForMeal}
                onDeleteItem={promptDeleteItem}
                onEditItem={(item) => setItemToEdit(item)}
              />

              {/* Lunch */}
              <MealCategoryCard
                type="lunch"
                title="Lunch"
                icon="🍽️"
                items={lunchItems}
                onAddPress={openSearchForMeal}
                onScanPress={openScanForMeal}
                onDeleteItem={promptDeleteItem}
                onEditItem={(item) => setItemToEdit(item)}
              />

              {/* Dinner */}
              <MealCategoryCard
                type="dinner"
                title="Dinner"
                icon="🌙"
                items={dinnerItems}
                onAddPress={openSearchForMeal}
                onScanPress={openScanForMeal}
                onDeleteItem={promptDeleteItem}
                onEditItem={(item) => setItemToEdit(item)}
              />

              {/* Snacks & Drinks */}
              <MealCategoryCard
                type="snack"
                title="Snacks & Drinks"
                icon="🥪"
                items={snackItems}
                onAddPress={openSearchForMeal}
                onScanPress={openScanForMeal}
                onDeleteItem={promptDeleteItem}
                onEditItem={(item) => setItemToEdit(item)}
              />
            </View>

            {/* 4. Hydration Water Tracker */}
            <WaterTrackerCard
              waterMl={waterMl}
              targetMl={targetWaterMl}
              onAddWater={(delta) => saveWater(waterMl + delta)}
            />

            {/* 5. Daily Summary Completion Control */}
            <View className="mt-1">
              <TouchableOpacity
                onPress={handleSaveAndCompleteDay}
                activeOpacity={0.8}
                className="w-full bg-accent dark:bg-accent-dark py-3.5 rounded-xl items-center justify-center"
              >
                <Text className="text-background dark:text-background-dark font-black text-sm">
                  ✓ Complete Day
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

      {/* Search & Log Food Modal (Offline 100+ Catalog + Online Open Food Facts) */}
      <FoodSearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onAddFood={handleAddMealItem}
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

      {/* Edit Meal / Portion Adjustment Modal */}
      <EditMealModal
        visible={Boolean(itemToEdit)}
        item={itemToEdit}
        onClose={() => setItemToEdit(null)}
        onSave={handleUpdateMealItem}
        onDelete={(id) => {
          setItemToEdit(null);
          promptDeleteItem(id);
        }}
      />

      {/* Delete Item Confirmation Modal */}
      <RemoveFoodModal
        visible={Boolean(itemToDelete)}
        item={itemToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </SafeAreaView>
  );
}