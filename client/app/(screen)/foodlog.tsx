import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Pressable, DeviceEventEmitter, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { hapticFeedback } from '@/utils/haptics';
import { LAYOUT } from '@/constants/layout';

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
import AiInsightsCard from '@/components/foodlog/AiInsightsCard';
import { generateDynamicCoachingInsights } from '@/utils/dynamicCoaching';
import { getAIInsights, AIInsight, NutritionInsightsPayload } from '@/api/ai';
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
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const { showToast } = useToast();
  const userId = user?.id;
  const foodKey = authStorage.getScopedKey(userId, 'food_log_today');
  const waterKey = authStorage.getScopedKey(userId, 'water_log_today');
  const params = useLocalSearchParams<{ tab?: FoodLogTabType }>();
  const [activeTab, setActiveTab] = useState<FoodLogTabType>(
    params.tab && ['today', 'library', 'history'].includes(params.tab) ? params.tab : 'today'
  );

  useEffect(() => {
    if (params.tab && ['today', 'library', 'history'].includes(params.tab)) {
      setActiveTab(params.tab);
    }
  }, [params.tab]);
  const cachedSnapshot = screenCache.getFoodLogSnapshot(userId);
  const [goal, setGoal] = useState<'MUSCLE_GAIN' | 'WEIGHT_LOSS'>('MUSCLE_GAIN');
  const [items, setItems] = useState<FoodLogItem[]>(cachedSnapshot?.items || []);
  const [waterMl, setWaterMl] = useState(cachedSnapshot?.waterMl || 0);
  const [isDayCompleted, setIsDayCompleted] = useState(cachedSnapshot?.isDayCompleted || false);
  const [loading, setLoading] = useState(!screenCache.foodLogLoaded && !cachedSnapshot);

  // AI Nutrition Insights State - Local Dynamic vs Gemini Deep AI
  const [loadingAi, setLoadingAi] = useState(false);
  const [geminiInsights, setGeminiInsights] = useState<AIInsight[] | null>(null);
  const [insightMode, setInsightMode] = useState<'local' | 'gemini'>('local');

  const isLoadingRef = useRef(false);
  const waterMlRef = useRef(0);
  const itemsRef = useRef<FoodLogItem[]>([]);
  const lastSaveTimeRef = useRef<number>(0);
  const lastAnalyzedHashRef = useRef<string>('');
  const insightDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }, [user?.weight, user?.height, user?.age, user?.gender, user?.goal, user?.activityLevel, goal]);

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
      let hasLocalFoodCache = false;
      const savedFood = await AsyncStorage.getItem(foodKey);
      if (savedFood !== null) {
        hasLocalFoodCache = true;
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
              // Only populate from cloud if there is NO existing local cache on this device (e.g. fresh login/new device)
              let resolvedItems = localItems;
              if (Array.isArray(cloudRes.data.meals) && cloudRes.data.meals.length > 0) {
                if (!hasLocalFoodCache) {
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
                }
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
      if (userId) {
        screenCache.setFoodLogSnapshot(userId, {
          items: itemsRef.current,
          waterMl: waterMlRef.current,
        });
      }
      screenCache.setFoodLogLoaded(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      screenCache.setFoodLogSnapshot(userId, {
        items,
        waterMl,
        isDayCompleted,
      });
    }
  }, [userId, items, waterMl, isDayCompleted]);

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [foodKey, waterKey, userId])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('FOOD_LOG_UPDATED', (evt?: { sender?: string; items?: FoodLogItem[]; waterMl?: number }) => {
      if (evt?.sender === 'foodlog_screen') return;
      if (evt?.items && Array.isArray(evt.items)) {
        setItems(evt.items);
        itemsRef.current = evt.items;
        setIsDayCompleted(false);
      }
      if (Date.now() - lastSaveTimeRef.current < 2500 && !evt?.items) return;
      loadInitialData();
    });
    return () => {
      sub.remove();
    };
  }, [foodKey, waterKey, userId]);

  const saveFoodLog = async (newItems: FoodLogItem[], immediate = false, markCompleted?: boolean) => {
    lastSaveTimeRef.current = Date.now();
    setItems(newItems);
    itemsRef.current = newItems;
    try {
      await AsyncStorage.setItem(foodKey, JSON.stringify(newItems));
      DeviceEventEmitter.emit('FOOD_LOG_UPDATED', { sender: 'foodlog_screen', items: newItems });
      autoSyncFoodAndWater(userId, getTodayDateString(), newItems, waterMlRef.current, immediate, markCompleted);
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

    if (isDayCompleted) {
      setIsDayCompleted(false);
      const todayStr = getTodayDateString();
      const dayCompletedKey = authStorage.getScopedKey(userId, `food_log_completed_${todayStr}`);
      AsyncStorage.setItem(dayCompletedKey, 'false').catch(() => {});
    }

    lastSaveTimeRef.current = Date.now();
    const updated = [...itemsRef.current, ...toAdd];
    saveFoodLog(updated, false, false);

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

    const viewLogAction = activeTab !== 'today' ? {
      actionLabel: 'View Log',
      onAction: () => {
        setScanTargetMeal(undefined);
        setActiveTab('today');
      },
    } : {};

    if (toAdd.length === 1) {
      const single = toAdd[0];
      showToast({
        message: `Added ${single.title}`,
        description: `${single.calories} kcal · ${single.protein}g Protein to ${MEAL_LABELS[single.mealType] || single.mealType}`,
        type: 'success',
        iconName: 'restaurant',
        ...viewLogAction,
      });
    } else {
      const totalCals = toAdd.reduce((sum, i) => sum + (i.calories || 0), 0);
      showToast({
        message: `Added ${toAdd.length} Meals`,
        description: `${totalCals} total kcal added to your log`,
        type: 'success',
        iconName: 'restaurant',
        ...viewLogAction,
      });
    }
  };

  // Update Item handler
  const handleUpdateMealItem = (updatedItem: FoodLogItem) => {
    lastSaveTimeRef.current = Date.now();
    const updated = itemsRef.current.map((i) => (i.id === updatedItem.id ? updatedItem : i));
    saveFoodLog(updated, true);
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
    lastSaveTimeRef.current = Date.now();
    const updated = itemsRef.current.filter((i) => i.id !== idToDelete);
    saveFoodLog(updated, true);
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
      gender: user?.gender,
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

  // Fetch & Cache Real Gemini Nutrition Insights
  const syncGeminiNutritionInsights = useCallback(
    async (currentItems: FoodLogItem[], currentWater: number) => {
      const userId = user?.id;
      if (!userId) return;

      const todayStr = getTodayDateString();
      const cacheKey = authStorage.getScopedKey(userId, `ai_nutrition_insights_${todayStr}`);
      const mealHash = currentItems
        .map((i) => `${i.id}_${i.calories}_${i.protein}_${i.carbs}_${i.fat}`)
        .join('|');

      // 1. If hash matches what was already loaded in memory, skip
      if (lastAnalyzedHashRef.current === mealHash && geminiInsights && geminiInsights.length > 0) {
        return;
      }

      // 2. Check disk cache first
      try {
        const cachedRaw = await AsyncStorage.getItem(cacheKey);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (
            parsed &&
            parsed.mealHash === mealHash &&
            Array.isArray(parsed.insights) &&
            parsed.insights.length > 0
          ) {
            setGeminiInsights(parsed.insights);
            setInsightMode('gemini');
            lastAnalyzedHashRef.current = mealHash;
            return;
          }
        }
      } catch {
        // Cache miss or read error, proceed to fetch
      }

      // 3. Call Gemini API on server
      try {
        setLoadingAi(true);
        const loggedCals = currentItems.reduce((acc, i) => acc + (i.calories || 0), 0);
        const loggedProt = currentItems.reduce((acc, i) => acc + (i.protein || 0), 0);
        const loggedCarbs = currentItems.reduce((acc, i) => acc + (i.carbs || 0), 0);
        const loggedFat = currentItems.reduce((acc, i) => acc + (i.fat || 0), 0);

        const payload: NutritionInsightsPayload = {
          loggedMeals: currentItems.map((i) => ({
            title: i.title,
            mealType: i.mealType,
            calories: i.calories,
            protein: i.protein,
            carbs: i.carbs,
            fat: i.fat,
          })),
          targets: {
            calories: targets.calories,
            protein: targets.protein,
            carbs: targets.carbs,
            fat: targets.fat,
            waterMl: targetWaterMl,
          },
          loggedMacros: {
            calories: loggedCals,
            protein: loggedProt,
            carbs: loggedCarbs,
            fat: loggedFat,
            waterMl: currentWater,
          },
          userGoal: goal,
        };

        const res = await getAIInsights(payload);
        if (res?.success && Array.isArray(res.insights) && res.insights.length > 0) {
          setGeminiInsights(res.insights);
          setInsightMode('gemini');
          lastAnalyzedHashRef.current = mealHash;

          // Save to local cache
          await AsyncStorage.setItem(
            cacheKey,
            JSON.stringify({
              mealHash,
              insights: res.insights,
              savedAt: Date.now(),
            })
          );
        } else {
          setInsightMode('local');
        }
      } catch (err) {
        console.log('[FoodLog] Gemini insights call failed, keeping local fallback:', err);
        setInsightMode('local');
      } finally {
        setLoadingAi(false);
      }
    },
    [user?.id, targets, targetWaterMl, goal, geminiInsights]
  );

  useEffect(() => {
    // When items change (user logs, edits, or deletes a meal), debounce and sync with Gemini
    if (insightDebounceTimerRef.current) {
      clearTimeout(insightDebounceTimerRef.current);
    }

    insightDebounceTimerRef.current = setTimeout(() => {
      syncGeminiNutritionInsights(items, waterMl);
    }, 1200);

    return () => {
      if (insightDebounceTimerRef.current) {
        clearTimeout(insightDebounceTimerRef.current);
      }
    };
  }, [items, waterMl, syncGeminiNutritionInsights]);

  const activeNutritionInsights = useMemo(() => {
    if (insightMode === 'gemini' && geminiInsights && geminiInsights.length > 0) {
      return geminiInsights;
    }
    return dynamicNutritionInsights;
  }, [insightMode, geminiInsights, dynamicNutritionInsights]);

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
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      {/* Top Fixed Screen Header & Tabs */}
      <View className="w-full max-w-5xl self-center mx-auto px-4 pt-3 pb-1">
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
      </View>

      {activeTab === 'library' ? (
        /* Food Library Tab View with fixed search & filter header */
        <View className="flex-1 min-h-0 w-full max-w-5xl self-center mx-auto px-4 pt-1">
          <FoodLibraryTab
            onAddFood={handleAddMealItem}
            defaultMeal={scanTargetMeal}
            onSwitchToToday={() => {
              setScanTargetMeal(undefined);
              setActiveTab('today');
            }}
          />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: LAYOUT.getTabBarPadding(insets.bottom) }}>
          <View className="w-full max-w-5xl self-center mx-auto">
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

                  <View className="flex-row items-center gap-1.5">
                    <TouchableOpacity
                      onPress={() => {
                        setScanTargetMeal(undefined);
                        setScanInitialMode('text');
                        setShowScanModal(true);
                      }}
                      activeOpacity={0.8}
                      className="rounded-xl border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark px-2.5 py-1.5 flex-row items-center gap-1.5"
                    >
                      <Ionicons name="create-outline" size={13} color={colors.accent} />
                      <Text className="text-accent dark:text-accent-dark font-bold text-xs">
                        Describe
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setAiSuggestTargetMeal('all');
                        setShowAiSuggestModal(true);
                      }}
                      activeOpacity={0.8}
                      className="rounded-xl border border-input-border dark:border-input-border-dark bg-input dark:bg-input-dark px-2.5 py-1.5 flex-row items-center gap-1.5"
                    >
                      <Ionicons name="sparkles" size={13} color={colors.accent} />
                      <Text className="text-accent dark:text-accent-dark font-bold text-xs">
                        AI Suggest
                      </Text>
                    </TouchableOpacity>
                  </View>
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
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      className="px-2.5 py-1.5 min-h-[36px] justify-center items-center rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-60 shrink-0"
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
      )}

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
      {showSubscriptionModal && (
        <SubscriptionModal
          visible={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
        />
      )}

      {/* AI "What should I eat next?" Suggestions Modal */}
      {showAiSuggestModal && (
        <AiSuggestionModal
          visible={showAiSuggestModal}
          onClose={() => setShowAiSuggestModal(false)}
          onSelectSuggestion={handleAddMealItem}
          goal={goal}
          remainingCalories={remainingCalories}
          remainingProtein={remainingProtein}
          initialMealType={aiSuggestTargetMeal}
          onUpgradePress={() => {
            setShowAiSuggestModal(false);
            setShowSubscriptionModal(true);
          }}
        />
      )}

      {/* Edit Meal / Portion Adjustment Modal */}
      {Boolean(itemToEdit) && (
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
      )}

      {/* Delete Item Confirmation Modal */}
      {Boolean(itemToDelete) && (
        <RemoveFoodModal
          visible={Boolean(itemToDelete)}
          item={itemToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={() => setItemToDelete(null)}
        />
      )}

      {/* Complete Day Confirmation Modal */}
      {showCompleteConfirm && (
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
      )}

      {/* Reopen Day Choice Modal (Relog Previous Meals vs Start Fresh) */}
      {showReopenModal && (
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
              style={{ paddingBottom: Math.max(32, insets.bottom + 16) }}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Header Icon */}
              <View className="w-14 h-14 rounded-2xl bg-accent/15 items-center justify-center mb-3.5 mt-2">
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
      )}
    </SafeAreaView>
  );
}