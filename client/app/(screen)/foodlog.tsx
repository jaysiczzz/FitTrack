import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Pressable, DeviceEventEmitter, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { hapticFeedback } from '@/utils/haptics';

import MacroSummaryCard from '@/components/foodlog/MacroSummaryCard';
import MealCategoryCard from '@/components/foodlog/MealCategoryCard';
import WaterTrackerCard from '@/components/foodlog/WaterTrackerCard';
import AiScanModal from '@/components/foodlog/AiScanModal';
import AiSuggestionModal from '@/components/foodlog/AiSuggestionModal';
import SubscriptionModal from '@/components/subscription/SubscriptionModal';
import FoodLogTabs, { FoodLogTabType } from '@/components/foodlog/FoodLogTabs';
import FoodLibraryTab from '@/components/foodlog/FoodLibraryTab';
import FoodHistoryTab from '@/components/foodlog/FoodHistoryTab';
import EditMealModal from '@/components/foodlog/EditMealModal';
import RemoveFoodModal from '@/components/foodlog/RemoveFoodModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AiInsightsCard from '@/components/ai/AiInsightsCard';
import { generateDynamicCoachingInsights } from '@/utils/dynamicCoaching';
import { getAIInsights, AIInsight } from '@/api/ai';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import { FoodLogItem, MacroTargets, MealType, getTodayDateString, MEAL_LABELS, getSmartFoodBadge, calculatePersonalizedTargets } from '@/components/foodlog/foodLogTypes';
import Button from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { saveDailyFoodLogApi, getDailyFoodLogApi, autoSyncFoodAndWater, saveFoodToRecentHistory } from '@/api/foodlog';
import { screenCache } from '@/utils/screenCache';
import { useThemeColors } from '@/constants/colors';
import {
  DEFAULT_WATER_TARGET_ML,
  MIN_WATER_TARGET_ML,
  WATER_INCREMENT_SMALL_ML,
} from '@/constants/fitnessDefaults';

export type { FoodLogItem, MealType } from '@/components/foodlog/foodLogTypes';

export default function FoodLog() {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const userId = user?.id;
  const foodKey = authStorage.getScopedKey(userId, 'food_log_today');
  const waterKey = authStorage.getScopedKey(userId, 'water_log_today');
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<FoodLogTabType>('today');
  const [goal, setGoal] = useState<'MUSCLE_GAIN' | 'WEIGHT_LOSS'>('MUSCLE_GAIN');
  const [items, setItems] = useState<FoodLogItem[]>([]);
  const [waterMl, setWaterMl] = useState(0);
  const [isDayCompleted, setIsDayCompleted] = useState(false);
  const [loading, setLoading] = useState(!screenCache.foodLogLoaded);

  // AI Nutrition Insights State - Local Dynamic vs Gemini Deep AI
  const [loadingAi, setLoadingAi] = useState(false);
  const [geminiInsights, setGeminiInsights] = useState<AIInsight[] | null>(null);
  const [insightMode, setInsightMode] = useState<'local' | 'gemini'>('local');

  const isLoadingRef = useRef(false);
  const waterMlRef = useRef(0);
  const itemsRef = useRef<FoodLogItem[]>([]);

  // Modals state
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanInitialMode, setScanInitialMode] = useState<'photo' | 'text'>('photo');
  const [scanTargetMeal, setScanTargetMeal] = useState<MealType | undefined>(undefined);
  const [showAiSuggestModal, setShowAiSuggestModal] = useState(false);
  const [aiSuggestTargetMeal, setAiSuggestTargetMeal] = useState<MealType | 'all'>('all');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FoodLogItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<FoodLogItem | null>(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [archivedTodayMeals, setArchivedTodayMeals] = useState<FoodLogItem[]>([]);
  const [archivedTodayWater, setArchivedTodayWater] = useState<number>(0);

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

      const todayStr = getTodayDateString();
      const activeDateKey = authStorage.getScopedKey(userId, 'food_log_active_date');
      const cachedDate = await AsyncStorage.getItem(activeDateKey);
      if (cachedDate && cachedDate !== todayStr) {
        await AsyncStorage.multiRemove([foodKey, waterKey]);
      }
      await AsyncStorage.setItem(activeDateKey, todayStr);

      // 1. Read user-scoped local storage for instant UI render
      let localItems: FoodLogItem[] = [];
      const savedFood = await AsyncStorage.getItem(foodKey);
      if (savedFood) {
        try {
          const parsed = JSON.parse(savedFood);
          if (Array.isArray(parsed)) {
            localItems = parsed.map((item: any) => {
              if (!item.goalBadge || !item.goalBadgeColor) {
                const b = getSmartFoodBadge(item);
                return { ...item, goalBadge: b.badge, goalBadgeColor: b.color };
              }
              return item;
            });
            setItems(localItems);
            itemsRef.current = localItems;
          } else {
            setItems([]);
            itemsRef.current = [];
          }
        } catch {
          setItems([]);
          itemsRef.current = [];
        }
      } else {
        setItems([]);
        itemsRef.current = [];
      }

      let localWater = 0;
      let hasLocalWater = false;
      const savedWater = await AsyncStorage.getItem(waterKey);
      if (savedWater !== null) {
        localWater = parseInt(savedWater, 10) || 0;
        hasLocalWater = true;
      }
      setWaterMl(localWater);
      waterMlRef.current = localWater;

      // 2. Fetch authenticated user's actual database log for today
      if (userId) {
        const dayCompletedKey = authStorage.getScopedKey(userId, `food_log_completed_${todayStr}`);
        const archivedKey = authStorage.getScopedKey(userId, `food_log_archived_${todayStr}`);
        const archivedWaterKey = authStorage.getScopedKey(userId, `water_log_archived_${todayStr}`);
        const cachedCompleted = await AsyncStorage.getItem(dayCompletedKey);
        let resolvedCompleted = cachedCompleted === 'true';
        setIsDayCompleted(resolvedCompleted);

        // Load cached archived meals if exists
        const cachedArchived = await AsyncStorage.getItem(archivedKey);
        if (cachedArchived) {
          try {
            const parsedArchived = JSON.parse(cachedArchived);
            if (Array.isArray(parsedArchived)) {
              setArchivedTodayMeals(parsedArchived);
            }
          } catch {}
        }
        const cachedArchivedWater = await AsyncStorage.getItem(archivedWaterKey);
        if (cachedArchivedWater !== null) {
          setArchivedTodayWater(parseInt(cachedArchivedWater, 10) || 0);
        }

        try {
          const cloudRes = await getDailyFoodLogApi(todayStr);
          if (cloudRes?.data) {
            if (typeof cloudRes.data.isCompleted === 'boolean') {
              resolvedCompleted = cloudRes.data.isCompleted;
              setIsDayCompleted(resolvedCompleted);
              await AsyncStorage.setItem(dayCompletedKey, resolvedCompleted ? 'true' : 'false');
            }

            if (resolvedCompleted) {
              // Day is completed: preserve archived meals from cloud for reopening, keep active items cleaned
              if (Array.isArray(cloudRes.data.meals) && cloudRes.data.meals.length > 0) {
                const cloudArchivedMeals = cloudRes.data.meals.map((m: any) => {
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
                setArchivedTodayMeals(cloudArchivedMeals);
                await AsyncStorage.setItem(archivedKey, JSON.stringify(cloudArchivedMeals));
              }
              const cloudWater = typeof cloudRes.data.waterMl === 'number' ? cloudRes.data.waterMl : 0;
              setArchivedTodayWater(cloudWater);
              await AsyncStorage.setItem(archivedWaterKey, cloudWater.toString());

              // Active Today list remains clean
              setItems([]);
              itemsRef.current = [];
              await AsyncStorage.setItem(foodKey, JSON.stringify([]));
            } else {
              // Day is still in progress: regular sync
              let resolvedItems = localItems;
              if (Array.isArray(cloudRes.data.meals) && cloudRes.data.meals.length > 0) {
                if (localItems.length === 0 || localItems.length < cloudRes.data.meals.length) {
                  resolvedItems = cloudRes.data.meals.map((m: any) => {
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
                  setItems(resolvedItems);
                  itemsRef.current = resolvedItems;
                  await AsyncStorage.setItem(foodKey, JSON.stringify(resolvedItems));
                } else if (localItems.length > cloudRes.data.meals.length) {
                  autoSyncFoodAndWater(userId, todayStr, localItems, waterMlRef.current);
                }
              } else if (localItems.length > 0) {
                autoSyncFoodAndWater(userId, todayStr, localItems, waterMlRef.current);
              }

              const cloudWater = typeof cloudRes.data.waterMl === 'number' ? cloudRes.data.waterMl : 0;
              let resolvedWater = localWater;
              if (!hasLocalWater) {
                resolvedWater = cloudWater;
                setWaterMl(resolvedWater);
                waterMlRef.current = resolvedWater;
                await AsyncStorage.setItem(waterKey, resolvedWater.toString());
              } else {
                resolvedWater = localWater;
                if (localWater !== cloudWater) {
                  autoSyncFoodAndWater(userId, todayStr, resolvedItems, localWater);
                }
              }
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
      screenCache.setFoodLogLoaded(true);
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [foodKey, waterKey, userId])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('FOOD_LOG_UPDATED', (evt?: { sender?: string; waterMl?: number }) => {
      if (evt?.sender === 'foodlog_screen') return;
      loadInitialData();
    });
    return () => {
      sub.remove();
    };
  }, [foodKey, waterKey, userId]);

  const saveFoodLog = async (newItems: FoodLogItem[]) => {
    setItems(newItems);
    itemsRef.current = newItems;
    try {
      await AsyncStorage.setItem(foodKey, JSON.stringify(newItems));
      DeviceEventEmitter.emit('FOOD_LOG_UPDATED', { sender: 'foodlog_screen' });
      autoSyncFoodAndWater(userId, getTodayDateString(), newItems, waterMlRef.current);
    } catch (err) {
      console.log('Error saving food log:', err);
    }
  };

  // Target hydration based on bodyweight (35ml / kg), clamped to min 2000ml, rounded to nearest 250ml
  const targetWaterMl = user?.weight
    ? Math.max(
        MIN_WATER_TARGET_ML,
        Math.round((user.weight * 35) / WATER_INCREMENT_SMALL_ML) * WATER_INCREMENT_SMALL_ML
      )
    : DEFAULT_WATER_TARGET_ML;

  const handleAddWaterDelta = (delta: number) => {
    const current = waterMlRef.current;
    const clamped = Math.min(6000, Math.max(0, current + delta));
    if (current === clamped) return;

    if (current < targetWaterMl && clamped >= targetWaterMl) {
      showToast({
        message: 'Hydration Goal Reached!',
        description: `You reached your daily water goal of ${targetWaterMl.toLocaleString()} ml.`,
        type: 'success',
        iconName: 'water',
      });
    }

    waterMlRef.current = clamped;
    setWaterMl(clamped);

    const todayStr = getTodayDateString();
    const dateWaterKey = authStorage.getScopedKey(userId, `water_log_${todayStr}`);
    AsyncStorage.setItem(waterKey, clamped.toString()).catch((err) =>
      console.log('Error saving water:', err)
    );
    AsyncStorage.setItem(dateWaterKey, clamped.toString()).catch(() => { });

    DeviceEventEmitter.emit('FOOD_LOG_UPDATED', { sender: 'foodlog_screen', waterMl: clamped });
    autoSyncFoodAndWater(userId, todayStr, itemsRef.current, clamped);
  };

  // Add Item handler (supports single item or batch array)
  const handleAddMealItem = (incoming: FoodLogItem | FoodLogItem[]) => {
    const toAdd = Array.isArray(incoming) ? incoming : [incoming];
    if (toAdd.length === 0) return;

    setItems((prevItems) => {
      const updated = [...prevItems, ...toAdd];
      itemsRef.current = updated;
      AsyncStorage.setItem(foodKey, JSON.stringify(updated))
        .then(() => {
          DeviceEventEmitter.emit('FOOD_LOG_UPDATED', { sender: 'foodlog_screen' });
          autoSyncFoodAndWater(userId, getTodayDateString(), updated, waterMlRef.current);
        })
        .catch((err) => console.log('Error saving food log:', err));
      return updated;
    });

    // Automatically record to Recents history so all meals appear in Recents tab
    toAdd.forEach((item) => {
      saveFoodToRecentHistory({
        id: item.id || `food-${Date.now()}`,
        name: item.title,
        category: 'Staples',
        servingSize: item.subtitle || '1 serving',
        servingWeightG: 100,
        servingUnit: 'serving',
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        icon: item.icon || 'restaurant',
        imageUri: item.imageUri,
        keywords: [item.title.toLowerCase()],
      }).catch(() => { });
    });
    DeviceEventEmitter.emit('RECENT_FOODS_UPDATED');

    if (toAdd.length === 1) {
      const single = toAdd[0];
      showToast({
        message: `Added ${single.title}`,
        description: `${single.calories} kcal · ${single.protein}g Protein to ${MEAL_LABELS[single.mealType] || single.mealType}`,
        type: 'success',
        iconName: 'restaurant',
      });
    } else {
      const totalCals = toAdd.reduce((sum, i) => sum + (i.calories || 0), 0);
      showToast({
        message: `Added ${toAdd.length} Meals`,
        description: `${totalCals} total kcal added to your log`,
        type: 'success',
        iconName: 'restaurant',
      });
    }
  };

  // Update Item handler
  const handleUpdateMealItem = (updatedItem: FoodLogItem) => {
    setItems((prevItems) => {
      const updated = prevItems.map((i) => (i.id === updatedItem.id ? updatedItem : i));
      saveFoodLog(updated);
      return updated;
    });
    showToast({
      message: `Updated ${updatedItem.title}`,
      description: `${updatedItem.calories} kcal · ${updatedItem.protein}g Protein (${MEAL_LABELS[updatedItem.mealType]})`,
      type: 'success',
      iconName: 'create',
    });
  };

  // Duplicate single meal item
  const handleDuplicateMeal = (item: FoodLogItem) => {
    hapticFeedback.light();
    const cloned: FoodLogItem = {
      ...item,
      id: `meal-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    handleAddMealItem(cloned);
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
    const idToDelete = itemToDelete.id;
    setItemToDelete(null);
    setItems((prevItems) => {
      const updated = prevItems.filter((i) => i.id !== idToDelete);
      saveFoodLog(updated);
      return updated;
    });
    showToast({
      message: `Removed ${removedTitle}`,
      description: 'Item removed from food log',
      type: 'info',
      iconName: 'trash',
    });
  };

  // Save & Complete Daily Intake -> Commits snapshot into History and marks day completed
  const handleSaveAndCompleteDay = async () => {
    if (items.length === 0 && waterMl === 0) {
      showToast({
        message: 'No Meals Logged',
        description: 'Please scan or log at least one meal or water intake before completing.',
        type: 'warning',
        iconName: 'alert-circle',
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
    const dayCompletedKey = authStorage.getScopedKey(userId, `food_log_completed_${todayStr}`);
    const archivedKey = authStorage.getScopedKey(userId, `food_log_archived_${todayStr}`);
    const archivedWaterKey = authStorage.getScopedKey(userId, `water_log_archived_${todayStr}`);

    // Clean active items & store archived snapshot
    setArchivedTodayMeals(currentItems);
    setArchivedTodayWater(currentWater);
    setItems([]);
    itemsRef.current = [];
    setIsDayCompleted(true);

    showToast({
      message: 'Daily Intake Completed! 🎉',
      description: `Saved ${archivedCalories} kcal · ${archivedProtein}g Protein to History.`,
      type: 'success',
      iconName: 'checkmark-circle',
      actionLabel: 'View History',
      onAction: () => setActiveTab('history'),
    });

    // 2. Persist to storage & cloud API concurrently in the background
    try {
      await Promise.all([
        AsyncStorage.setItem(historyDateKey, JSON.stringify(currentItems)),
        AsyncStorage.setItem(historyWaterKey, currentWater.toString()),
        AsyncStorage.setItem(archivedKey, JSON.stringify(currentItems)),
        AsyncStorage.setItem(archivedWaterKey, currentWater.toString()),
        AsyncStorage.setItem(foodKey, JSON.stringify([])),
        AsyncStorage.setItem(dayCompletedKey, 'true'),
        (async () => {
          const rawDates = await AsyncStorage.getItem(historyDatesKey);
          let datesArr: string[] = [];
          if (rawDates) {
            try {
              const parsed = JSON.parse(rawDates);
              if (Array.isArray(parsed)) datesArr = parsed;
            } catch { }
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
          isCompleted: true,
        }).catch((apiErr) => {
          console.log('[FoodLog API] Failed to sync to cloud database, cached locally:', apiErr);
        }),
      ]);
      DeviceEventEmitter.emit('FOOD_LOG_UPDATED', { sender: 'foodlog_screen' });
    } catch (err) {
      console.log('Error in background food log archiving:', err);
    }
  };

  const handleReopenWithMeals = async () => {
    setShowReopenModal(false);
    const todayStr = getTodayDateString();
    const dayCompletedKey = authStorage.getScopedKey(userId, `food_log_completed_${todayStr}`);
    const archivedKey = authStorage.getScopedKey(userId, `food_log_archived_${todayStr}`);
    const archivedWaterKey = authStorage.getScopedKey(userId, `water_log_archived_${todayStr}`);

    let mealsToRestore = archivedTodayMeals;
    let waterToRestore = archivedTodayWater;

    if (mealsToRestore.length === 0) {
      const savedArchived = await AsyncStorage.getItem(archivedKey);
      if (savedArchived) {
        try {
          const parsed = JSON.parse(savedArchived);
          if (Array.isArray(parsed)) mealsToRestore = parsed;
        } catch {}
      }
      if (mealsToRestore.length === 0) {
        const historyKey = authStorage.getScopedKey(userId, `food_log_${todayStr}`);
        const savedHistory = await AsyncStorage.getItem(historyKey);
        if (savedHistory) {
          try {
            const parsed = JSON.parse(savedHistory);
            if (Array.isArray(parsed)) mealsToRestore = parsed;
          } catch {}
        }
      }
    }

    if (waterToRestore === 0) {
      const savedArchivedWater = await AsyncStorage.getItem(archivedWaterKey);
      if (savedArchivedWater) {
        waterToRestore = parseInt(savedArchivedWater, 10) || 0;
      }
    }

    setItems(mealsToRestore);
    itemsRef.current = mealsToRestore;
    if (waterToRestore > 0) {
      setWaterMl(waterToRestore);
      waterMlRef.current = waterToRestore;
    }
    setIsDayCompleted(false);

    try {
      await Promise.all([
        AsyncStorage.setItem(foodKey, JSON.stringify(mealsToRestore)),
        AsyncStorage.setItem(waterKey, waterToRestore.toString()),
        AsyncStorage.setItem(dayCompletedKey, 'false'),
        saveDailyFoodLogApi({
          date: todayStr,
          items: mealsToRestore,
          waterMl: waterToRestore,
          isCompleted: false,
        }),
      ]);
      DeviceEventEmitter.emit('FOOD_LOG_UPDATED', { sender: 'foodlog_screen', waterMl: waterToRestore });
      showToast({
        message: 'Day Reopened',
        description: `Restored ${mealsToRestore.length} previous meals to your log.`,
        type: 'info',
        iconName: 'create-outline',
      });
    } catch (e) {
      console.log('Error reopening day with meals:', e);
    }
  };

  const handleReopenStartFresh = async () => {
    setShowReopenModal(false);
    const todayStr = getTodayDateString();
    const dayCompletedKey = authStorage.getScopedKey(userId, `food_log_completed_${todayStr}`);
    const historyDateKey = authStorage.getScopedKey(userId, `food_log_${todayStr}`);
    const historyWaterKey = authStorage.getScopedKey(userId, `water_log_${todayStr}`);
    const archivedKey = authStorage.getScopedKey(userId, `food_log_archived_${todayStr}`);
    const archivedWaterKey = authStorage.getScopedKey(userId, `water_log_archived_${todayStr}`);

    setItems([]);
    itemsRef.current = [];
    setArchivedTodayMeals([]);
    setWaterMl(0);
    waterMlRef.current = 0;
    setArchivedTodayWater(0);
    setIsDayCompleted(false);

    try {
      await Promise.all([
        AsyncStorage.setItem(foodKey, JSON.stringify([])),
        AsyncStorage.setItem(waterKey, '0'),
        AsyncStorage.setItem(historyDateKey, JSON.stringify([])),
        AsyncStorage.setItem(historyWaterKey, '0'),
        AsyncStorage.setItem(archivedKey, JSON.stringify([])),
        AsyncStorage.setItem(archivedWaterKey, '0'),
        AsyncStorage.setItem(dayCompletedKey, 'false'),
        saveDailyFoodLogApi({
          date: todayStr,
          items: [],
          waterMl: 0,
          isCompleted: false,
        }),
      ]);
      DeviceEventEmitter.emit('FOOD_LOG_UPDATED', { sender: 'foodlog_screen', waterMl: 0 });
      showToast({
        message: 'Day Reopened Fresh',
        description: 'Previous meals cleared. Ready for fresh logging.',
        type: 'info',
        iconName: 'sparkles-outline',
      });
    } catch (e) {
      console.log('Error reopening day fresh:', e);
    }
  };

  // Aggregated logged macros
  const loggedCalories = items.reduce((sum, item) => sum + (item.calories || 0), 0);
  const loggedProtein = items.reduce((sum, item) => sum + (item.protein || 0), 0);
  const loggedCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const loggedFat = items.reduce((sum, item) => sum + (item.fat || 0), 0);

  const sealedCalories = useMemo(() => {
    if (items.length > 0) return loggedCalories;
    return archivedTodayMeals.reduce((sum, item) => sum + (item.calories || 0), 0);
  }, [items, loggedCalories, archivedTodayMeals]);

  const sealedProtein = useMemo(() => {
    if (items.length > 0) return loggedProtein;
    return archivedTodayMeals.reduce((sum, item) => sum + (item.protein || 0), 0);
  }, [items, loggedProtein, archivedTodayMeals]);

  const sealedCarbs = useMemo(() => {
    if (items.length > 0) return loggedCarbs;
    return archivedTodayMeals.reduce((sum, item) => sum + (item.carbs || 0), 0);
  }, [items, loggedCarbs, archivedTodayMeals]);

  const sealedFat = useMemo(() => {
    if (items.length > 0) return loggedFat;
    return archivedTodayMeals.reduce((sum, item) => sum + (item.fat || 0), 0);
  }, [items, loggedFat, archivedTodayMeals]);

  const remainingCalories = Math.max(0, targets.calories - loggedCalories);
  const remainingProtein = Math.max(0, targets.protein - loggedProtein);

  // Dynamic local coaching tips for nutrition & hydration
  const dynamicNutritionInsights = useMemo<AIInsight[]>(() => {
    const all = generateDynamicCoachingInsights({
      caloriesLogged: loggedCalories,
      proteinLogged: loggedProtein,
      carbsLogged: loggedCarbs,
      fatLogged: loggedFat,
      targetCalories: targets.calories,
      targetProtein: targets.protein,
      targetCarbs: targets.carbs,
      targetFat: targets.fat,
      waterMl,
      targetWater: targetWaterMl,
      userGoal: goal,
      todayExercises: [],
      workoutSessionDone: false,
      todayCompletedWorkoutStats: null,
      currentStreak: 0,
      userName: user?.name || 'Athlete',
    });
    // all[1] is nutrition insight, all[2] is hydration insight
    return all.slice(1).filter(Boolean);
  }, [
    loggedCalories,
    loggedProtein,
    loggedCarbs,
    loggedFat,
    targets,
    waterMl,
    targetWaterMl,
    goal,
    user?.name,
  ]);

  const nutritionGeminiInsights = useMemo(() => {
    if (!geminiInsights || geminiInsights.length === 0) return [];
    const nutritionKeywords = ['nutrition', 'macro', 'calorie', 'protein', 'carb', 'fat', 'diet', 'meal', 'water', 'hydrat'];
    const matches = geminiInsights.filter((item) =>
      nutritionKeywords.some(
        (kw) =>
          item.title.toLowerCase().includes(kw) ||
          item.lines.some((l) => l.toLowerCase().includes(kw))
      )
    );
    return matches.length > 0 ? matches : geminiInsights.slice(1);
  }, [geminiInsights]);

  const activeNutritionInsights = useMemo(() => {
    if (insightMode === 'gemini' && nutritionGeminiInsights.length > 0) {
      return nutritionGeminiInsights;
    }
    return dynamicNutritionInsights;
  }, [insightMode, nutritionGeminiInsights, dynamicNutritionInsights]);

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
    setActiveTab('library');
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 125 }}>
        <View className="w-full max-w-5xl self-center mx-auto">
          {/* Streamlined Screen Header */}
          <View className="mb-3.5">
            <Text className="text-2xl font-black text-text-primary dark:text-text-primary-dark tracking-tight">
              Nutrition
            </Text>
          </View>

          {/* Top Navigation Tabs (Today's Log | Library | History) */}
          <FoodLogTabs
            activeTab={activeTab}
            onChange={(tab) => {
              setActiveTab(tab);
              if (tab === 'today') {
                setScanTargetMeal(undefined);
              }
            }}
          />

          {activeTab === 'history' ? (
            /* History & Trends Tab View */
            <FoodHistoryTab
              targets={targets}
              onReLogItem={handleAddMealItem}
              onSwitchToToday={() => {
                setScanTargetMeal(undefined);
                setActiveTab('today');
              }}
            />
          ) : activeTab === 'library' ? (
            /* Food Library Tab View */
            <FoodLibraryTab
              onAddFood={handleAddMealItem}
              defaultMeal={scanTargetMeal}
              onSwitchToToday={() => {
                setScanTargetMeal(undefined);
                setActiveTab('today');
              }}
            />
          ) : (
            /* Today's Log Tab View */
            <>
              {/* 1. Daily Macro & Calorie Budget Summary Card */}
              <MacroSummaryCard
                targets={targets}
                loggedCalories={isDayCompleted ? sealedCalories : loggedCalories}
                loggedProtein={isDayCompleted ? sealedProtein : loggedProtein}
                loggedCarbs={isDayCompleted ? sealedCarbs : loggedCarbs}
                loggedFat={isDayCompleted ? sealedFat : loggedFat}
                goal={goal}
              />

              {/* 2. Today's Logged Meals Header with Compact AI Suggest Button */}
              <View className="mb-2">
                <View className="flex-row items-center justify-between mb-2.5">
                  <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm">
                    Today's Logged Meals
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      setAiSuggestTargetMeal('all');
                      setShowAiSuggestModal(true);
                    }}
                    activeOpacity={0.8}
                    className="rounded-xl border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark px-3 py-1.5 flex-row items-center gap-1.5"
                  >
                    <Ionicons name="sparkles" size={13} color={colors.accent} />
                    <Text className="text-accent dark:text-accent-dark font-bold text-xs">
                      AI Suggest
                    </Text>
                  </TouchableOpacity>
                </View>

                {loading && items.length === 0 ? (
                  <View className="my-2 gap-y-3">
                    <CardSkeleton lines={3} />
                    <CardSkeleton lines={3} />
                  </View>
                ) : (
                  <View className="flex-col md:flex-row md:flex-wrap md:justify-between">
                    {/* Breakfast */}
                    <View className="w-full md:w-[49%]">
                      <MealCategoryCard
                        type="breakfast"
                        title="Breakfast"
                        items={breakfastItems}
                        onAddPress={openSearchForMeal}
                        onScanPress={openScanForMeal}
                        onDeleteItem={promptDeleteItem}
                        onEditItem={(item) => setItemToEdit(item)}
                        onDuplicateItem={handleDuplicateMeal}
                      />
                    </View>

                    {/* Lunch */}
                    <View className="w-full md:w-[49%]">
                      <MealCategoryCard
                        type="lunch"
                        title="Lunch"
                        items={lunchItems}
                        onAddPress={openSearchForMeal}
                        onScanPress={openScanForMeal}
                        onDeleteItem={promptDeleteItem}
                        onEditItem={(item) => setItemToEdit(item)}
                        onDuplicateItem={handleDuplicateMeal}
                      />
                    </View>

                    {/* Dinner */}
                    <View className="w-full md:w-[49%]">
                      <MealCategoryCard
                        type="dinner"
                        title="Dinner"
                        items={dinnerItems}
                        onAddPress={openSearchForMeal}
                        onScanPress={openScanForMeal}
                        onDeleteItem={promptDeleteItem}
                        onEditItem={(item) => setItemToEdit(item)}
                        onDuplicateItem={handleDuplicateMeal}
                      />
                    </View>

                    {/* Snacks & Drinks */}
                    <View className="w-full md:w-[49%]">
                      <MealCategoryCard
                        type="snack"
                        title="Snacks & Drinks"
                        items={snackItems}
                        onAddPress={openSearchForMeal}
                        onScanPress={openScanForMeal}
                        onDeleteItem={promptDeleteItem}
                        onEditItem={(item) => setItemToEdit(item)}
                        onDuplicateItem={handleDuplicateMeal}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* 3. Hydration Water Tracker */}
              <WaterTrackerCard
                waterMl={waterMl}
                targetMl={targetWaterMl}
                onAddWater={handleAddWaterDelta}
              />

              {/* 4. AI Nutrition Insights */}
              <AiInsightsCard
                category="nutrition"
                insights={activeNutritionInsights}
                loading={loadingAi}
              />


              {/* 6. Daily Summary Completion Control */}
              <View className="mt-2 mb-4">
                {isDayCompleted ? (
                  <View className="p-4 rounded-2xl bg-accent/10 dark:bg-accent-dark/15 border border-accent/30 dark:border-accent-dark/30 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                      <View className="w-8 h-8 rounded-full bg-accent/20 items-center justify-center">
                        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-baloo-bold text-accent dark:text-accent-dark">
                          Daily Intake Completed 🎉
                        </Text>
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark mt-0.5">
                          {sealedCalories} kcal · {sealedProtein}g Protein sealed into History
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowReopenModal(true)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Reopen today's food log"
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      className="px-3.5 py-2 min-h-[44px] justify-center items-center rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-60"
                    >
                      <Text className="text-xs font-baloo-bold text-text-primary dark:text-text-primary-dark">
                        Reopen Day
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Button
                    title="Complete Day"
                    onPress={() => setShowCompleteConfirm(true)}
                  />
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* AI Scan & Photo Modal */}
      <AiScanModal
        visible={showScanModal}
        onClose={() => {
          setShowScanModal(false);
          setScanTargetMeal(undefined);
        }}
        onAddMealItem={handleAddMealItem}
        initialMealType={scanTargetMeal}
        initialMode={scanInitialMode}
        onUpgradePress={() => {
          setShowScanModal(false);
          setShowSubscriptionModal(true);
        }}
      />

      {/* Subscription Modal for In-App Upgrades */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />


      {/* AI "What should I eat next?" Suggestions Modal */}
      <AiSuggestionModal
        visible={showAiSuggestModal}
        onClose={() => setShowAiSuggestModal(false)}
        onSelectSuggestion={handleAddMealItem}
        goal={goal}
        remainingCalories={remainingCalories}
        remainingProtein={remainingProtein}
        initialMealType={aiSuggestTargetMeal}
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

      {/* Complete Day Confirmation Modal */}
      <ConfirmModal
        visible={showCompleteConfirm}
        title="Complete Day's Log?"
        message="This will seal your logged meals, calories, and hydration into your history trends. You can reopen it anytime if you need to log more."
        confirmText="Complete Day"
        cancelText="Keep Logging"
        onConfirm={() => {
          setShowCompleteConfirm(false);
          handleSaveAndCompleteDay();
        }}
        onCancel={() => setShowCompleteConfirm(false)}
      />

      {/* Reopen Day Choice Modal (Relog Previous Meals vs Start Fresh) */}
      <Modal
        visible={showReopenModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReopenModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/70 justify-end md:justify-center p-0 md:p-6"
          onPress={() => setShowReopenModal(false)}
        >
          <Pressable
            className="w-full max-w-[480px] self-center bg-surface dark:bg-surface-dark border-t md:border border-input-border/70 dark:border-input-border-dark/70 rounded-t-[32px] md:rounded-[32px] px-6 pt-3 md:pt-6 pb-8 items-center shadow-2xl max-h-[90%]"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Action Sheet Drag Indicator (Phone only) */}
            <View className="w-12 h-1.5 bg-input-border dark:bg-input-border-dark rounded-full mb-5 md:hidden" />

            {/* Header Icon */}
            <View className="w-14 h-14 rounded-2xl bg-accent/15 items-center justify-center mb-3.5">
              <Ionicons name="refresh" size={28} color={colors.accent} />
            </View>

            <Text className="text-xl font-baloo-bold text-text-primary dark:text-text-primary-dark text-center mb-1.5">
              Reopen Today's Log
            </Text>

            <Text className="text-xs text-text-muted dark:text-text-muted-dark text-center leading-relaxed mb-6 px-3">
              How would you like to continue tracking today's food log? You can restore your previously logged meals or start completely fresh.
            </Text>

            {/* Option 1: Relog Previous Meals */}
            <TouchableOpacity
              onPress={handleReopenWithMeals}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Relog previous meals"
              className="w-full p-4 mb-3 rounded-2xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark flex-row items-center gap-3.5 active:opacity-70"
            >
              <View className="w-11 h-11 rounded-xl bg-accent/20 items-center justify-center">
                <Ionicons name="receipt-outline" size={22} color={colors.accent} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-baloo-bold text-text-primary dark:text-text-primary-dark">
                  Relog Previous Meals
                </Text>
                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5 leading-tight">
                  Restore {archivedTodayMeals.length} previous items ({sealedCalories} kcal) to edit or add more meals.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Option 2: Start Fresh */}
            <TouchableOpacity
              onPress={handleReopenStartFresh}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Start fresh food log"
              className="w-full p-4 mb-4 rounded-2xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark flex-row items-center gap-3.5 active:opacity-70"
            >
              <View className="w-11 h-11 rounded-xl bg-orange-500/20 items-center justify-center">
                <Ionicons name="sparkles-outline" size={22} color="#f97316" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-baloo-bold text-text-primary dark:text-text-primary-dark">
                  Start Fresh
                </Text>
                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5 leading-tight">
                  Clear today's logged meals and start tracking from a clean 0 kcal slate.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setShowReopenModal(false)}
              activeOpacity={0.7}
              className="w-full py-3 items-center justify-center rounded-xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark active:opacity-60"
            >
              <Text className="text-xs font-baloo-bold text-text-muted dark:text-text-muted-dark">
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}