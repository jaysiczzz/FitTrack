import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';

import MacroSummaryCard from '@/components/foodlog/MacroSummaryCard';
import QuickActionToolbar from '@/components/foodlog/QuickActionToolbar';
import MealCategoryCard from '@/components/foodlog/MealCategoryCard';
import WaterTrackerCard from '@/components/foodlog/WaterTrackerCard';
import AiScanModal from '@/components/foodlog/AiScanModal';
import AiSuggestionModal from '@/components/foodlog/AiSuggestionModal';
import FoodLogTabs, { FoodLogTabType } from '@/components/foodlog/FoodLogTabs';
import FoodLibraryTab from '@/components/foodlog/FoodLibraryTab';
import FoodHistoryTab from '@/components/foodlog/FoodHistoryTab';
import EditMealModal from '@/components/foodlog/EditMealModal';
import RemoveFoodModal from '@/components/foodlog/RemoveFoodModal';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import { FoodLogItem, MacroTargets, MealType, getTodayDateString, MEAL_LABELS, MEAL_ICONS, getSmartFoodBadge, calculatePersonalizedTargets } from '@/components/foodlog/foodLogTypes';
import Button from '@/components/ui/Button';
import { saveDailyFoodLogApi, getDailyFoodLogApi, completeDailyFoodLogApi, autoSyncFoodAndWater } from '@/api/foodlog';

export type { FoodLogItem, MealType } from '@/components/foodlog/foodLogTypes';

export default function FoodLog() {
  const router = useRouter();
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

  const isLoadingRef = useRef(false);
  const waterMlRef = useRef(0);
  const itemsRef = useRef<FoodLogItem[]>([]);

  // Modals state
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanInitialMode, setScanInitialMode] = useState<'photo' | 'barcode' | 'text'>('photo');
  const [scanTargetMeal, setScanTargetMeal] = useState<MealType | undefined>(undefined);
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
        const cachedCompleted = await AsyncStorage.getItem(dayCompletedKey);
        let resolvedCompleted = cachedCompleted === 'true';
        setIsDayCompleted(resolvedCompleted);

        try {
          const cloudRes = await getDailyFoodLogApi(todayStr);
          if (cloudRes?.data) {
            if (typeof cloudRes.data.isCompleted === 'boolean') {
              resolvedCompleted = cloudRes.data.isCompleted;
              setIsDayCompleted(resolvedCompleted);
              await AsyncStorage.setItem(dayCompletedKey, resolvedCompleted ? 'true' : 'false');
            }

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
    ? Math.max(2000, Math.round((user.weight * 35) / 250) * 250)
    : 2500;

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
    AsyncStorage.setItem(dateWaterKey, clamped.toString()).catch(() => {});

    DeviceEventEmitter.emit('FOOD_LOG_UPDATED', { sender: 'foodlog_screen', waterMl: clamped });
    autoSyncFoodAndWater(userId, todayStr, itemsRef.current, clamped);
  };

  const saveWater = (newWater: number) => {
    const current = waterMlRef.current;
    handleAddWaterDelta(newWater - current);
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
        AsyncStorage.setItem(dayCompletedKey, 'true'),
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

  const handleReopenDay = async () => {
    const todayStr = getTodayDateString();
    const dayCompletedKey = authStorage.getScopedKey(userId, `food_log_completed_${todayStr}`);
    setIsDayCompleted(false);
    try {
      await AsyncStorage.setItem(dayCompletedKey, 'false');
      await saveDailyFoodLogApi({
        date: todayStr,
        items: itemsRef.current,
        waterMl: waterMlRef.current,
        isCompleted: false,
      });
      DeviceEventEmitter.emit('FOOD_LOG_UPDATED', { sender: 'foodlog_screen' });
      showToast({
        message: 'Day Reopened',
        description: 'You can continue logging meals and tracking macros for today.',
        type: 'info',
        iconName: 'create-outline',
      });
    } catch (e) {
      console.log('Error reopening day:', e);
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
    setActiveTab('library');
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 115 }}>
        {/* Screen Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-3xl font-black text-text-primary dark:text-text-primary-dark tracking-tight">
              Nutrition
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-1 font-normal">
              Real-time daily fuel & macro tracking
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(screen)/calendar' as any)}
            activeOpacity={0.8}
            className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-2xl border bg-amber-500/10 border-amber-500/30"
            accessibilityLabel="Activity Calendar"
          >
            <Ionicons
              name="calendar"
              size={15}
              color="#F59E0B"
            />
            <Text className="text-xs font-black text-amber-500">
              Calendar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Top Navigation Tabs (Today's Log | Library | History) */}
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
        ) : activeTab === 'library' ? (
          /* Food Library Tab View */
          <FoodLibraryTab
            onAddFood={handleAddMealItem}
            defaultMeal={scanTargetMeal}
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

            {/* 2. Quick Action Toolbar (Photo Scan, Barcode Scan, Describe Meal & AI Suggest) */}
            <QuickActionToolbar
              onPhotoScan={() => {
                setScanTargetMeal(undefined);
                setScanInitialMode('photo');
                setShowScanModal(true);
              }}
              onBarcodeScan={() => {
                setScanTargetMeal(undefined);
                setScanInitialMode('barcode');
                setShowScanModal(true);
              }}
              onTextLog={() => {
                setScanTargetMeal(undefined);
                setScanInitialMode('text');
                setShowScanModal(true);
              }}
              onAiSuggest={() => setShowAiSuggestModal(true)}
            />

            {/* 3. Meal Category Cards */}
            <View className="mb-2">
              <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm mb-2.5">
                Today's Logged Meals
              </Text>

              {/* Breakfast */}
              <MealCategoryCard
                type="breakfast"
                title="Breakfast"
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
              onAddWater={handleAddWaterDelta}
            />

            {/* 5. Daily Summary Completion Control */}
            <View className="mt-2 mb-4">
              {isDayCompleted ? (
                <View className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                    <View className="w-8 h-8 rounded-full bg-emerald-500/20 items-center justify-center">
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Daily Intake Completed 🎉
                      </Text>
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark mt-0.5">
                        {loggedCalories} kcal · {loggedProtein}g Protein sealed into History
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handleReopenDay}
                    activeOpacity={0.7}
                    className="px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
                  >
                    <Text className="text-[11px] font-bold text-text-primary dark:text-text-primary-dark">
                      Reopen Day
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Button
                  title="Complete Day"
                  onPress={handleSaveAndCompleteDay}
                />
              )}
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