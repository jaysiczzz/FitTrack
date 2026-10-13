import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { ScrollView, View, Text, RefreshControl, DeviceEventEmitter, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { hapticFeedback } from '@/utils/haptics';

import DailyCheckInCard from '@/components/dashboard/DailyCheckInCard';
import DailyGoalsCard from '@/components/dashboard/DailyGoalsCard';
import StatCard from '@/components/dashboard/StatCard';
import MacroProgressCard from '@/components/dashboard/MacroProgressCard';
import WeeklyNutritionChartCard from '@/components/dashboard/WeeklyNutritionChartCard';
import TodayWorkoutCard, { DashboardWorkoutExercise } from '@/components/dashboard/TodayWorkoutCard';
import CommunityStoriesCard from '@/components/dashboard/CommunityStoriesCard';
import TestimonialModal from '@/components/settings/TestimonialModal';
import { CardSkeleton, StatCardSkeleton } from '@/components/ui/Skeleton';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutRoutineTemplate, WeeklySplit } from '@/components/workouts/workoutTypes';
import { DEFAULT_ROUTINE_TEMPLATES, DEFAULT_WEEKLY_SPLIT, getTodayDayOfWeek } from '@/components/workouts/plannerPresets';
import { mergeWithDefaultTemplates } from '@/components/workouts/WorkoutPlannerTab';

import { getTodayWorkoutSession, getWorkoutHistory, ApiWorkoutSession, ApiWorkoutExercise } from '@/api/workout';
import { getCheckInHistoryApi } from '@/api/checkin';
import { FoodLogItem, calculatePersonalizedTargets } from '@/components/foodlog/foodLogTypes';
import { getDailyFoodLogApi, getFoodLogHistoryApi, autoSyncFoodAndWater } from '@/api/foodlog';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import { useToast } from '@/context/ToastContext';
import { useThemeColors } from '@/constants/colors';
import { screenCache } from '@/utils/screenCache';
import { useResponsive } from '@/hooks/useResponsive';
import { capitalizeWords } from '@/utils/formatters';
import { calculateActiveStreak, formatDateKey } from '@/utils/streakUtils';
import {
  DEFAULT_WATER_TARGET_ML,
  MIN_WATER_TARGET_ML,
  WATER_INCREMENT_SMALL_ML,
} from '@/constants/fitnessDefaults';

export default function Dashboard() {
  const { colors, isDark } = useThemeColors();
  const { isTablet } = useResponsive();
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const { showToast } = useToast();

  const [userName, setUserName] = useState('Athlete');
  const [userGoal, setUserGoal] = useState<'MUSCLE_GAIN' | 'WEIGHT_LOSS'>('MUSCLE_GAIN');
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!screenCache.dashboardLoaded);

  // Check-In state
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Testimonials & Athlete Stories Modal State
  const [showTestimonialsModal, setShowTestimonialsModal] = useState(false);
  const [testimonialInitialTab, setTestimonialInitialTab] = useState<'feed' | 'write'>('feed');

  const params = useLocalSearchParams<{ modal?: string; tab?: string }>();

  // Deep-link modal listener (e.g. from notifications or external links)
  useEffect(() => {
    if (params.modal === 'testimonials') {
      setTestimonialInitialTab(params.tab === 'write' ? 'write' : 'feed');
      setShowTestimonialsModal(true);
    }
  }, [params.modal, params.tab]);

  // Nutrition Progress States
  const [caloriesLogged, setCaloriesLogged] = useState(0);
  const [proteinLogged, setProteinLogged] = useState(0);
  const [carbsLogged, setCarbsLogged] = useState(0);
  const [fatLogged, setFatLogged] = useState(0);
  const [waterMl, setWaterMl] = useState(0);
  const [isNutritionDone, setIsNutritionDone] = useState(false);

  const waterMlRef = useRef(0);
  const dashboardItemsRef = useRef<FoodLogItem[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  // Workout Progress States
  const [activeMinutesToday, setActiveMinutesToday] = useState(0);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayExercises, setTodayExercises] = useState<DashboardWorkoutExercise[]>([]);
  const [workoutSessionDone, setWorkoutSessionDone] = useState(false);
  const [todayCompletedWorkoutStats, setTodayCompletedWorkoutStats] = useState<{ duration: number; caloriesBurned: number } | null>(null);
  const [todayScheduledRoutine, setTodayScheduledRoutine] = useState<WorkoutRoutineTemplate | null>(null);
  const [isTodayRestDay, setIsTodayRestDay] = useState(false);

  // Dynamic targets based on goal and user personalized body metrics
  const personalizedTargets = useMemo(() => {
    return calculatePersonalizedTargets(user, userGoal);
  }, [user?.weight, user?.height, user?.age, user?.gender, user?.goal, userGoal]);

  const targetCalories = personalizedTargets.calories;
  const targetProtein = personalizedTargets.protein;
  const targetCarbs = personalizedTargets.carbs;
  const targetFat = personalizedTargets.fat;
  const targetWater = user?.weight
    ? Math.max(
        MIN_WATER_TARGET_ML,
        Math.round((user.weight * 35) / WATER_INCREMENT_SMALL_ML) * WATER_INCREMENT_SMALL_ML
      )
    : DEFAULT_WATER_TARGET_ML;

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const loadUserData = async () => {
    try {
      if (user) {
        if (user.firstName) setUserName(capitalizeWords(user.firstName));
        if (user.goal) setUserGoal(user.goal);
      } else {
        const cachedUser = await authStorage.getUser();
        if (cachedUser) {
          if (cachedUser.firstName) setUserName(capitalizeWords(cachedUser.firstName));
          if (cachedUser.goal) setUserGoal(cachedUser.goal);
        }
      }
    } catch (err) {
      console.log('Error loading user data:', err);
    }
  };

  const getTodayDateKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const historicalActiveDatesRef = useRef<Set<string>>(new Set());

  // Calculates active streak based on Today's Goals (at least 1 goal completed = active day)
  const syncTodayStreak = (overrides?: {
    workoutDone?: boolean;
    checkinDone?: boolean;
    nutritionDone?: boolean;
    waterAmount?: number;
  }) => {
    const isWorkout = overrides?.workoutDone !== undefined ? overrides.workoutDone : workoutSessionDone;
    const isCheckin = overrides?.checkinDone !== undefined ? overrides.checkinDone : isCheckedIn;
    const isNutr = overrides?.nutritionDone !== undefined ? overrides.nutritionDone : isNutritionDone;
    const currentWater = overrides?.waterAmount !== undefined ? overrides.waterAmount : (waterMlRef.current || waterMl);
    const isHydra = currentWater >= targetWater;

    const isTodayGoalCompleted = Boolean(isWorkout || isCheckin || isNutr || isHydra);
    const computedStreak = calculateActiveStreak(historicalActiveDatesRef.current, isTodayGoalCompleted);
    setCurrentStreak(computedStreak);

    if (userId) {
      const streakKey = authStorage.getScopedKey(userId, 'fittrack_today_streak_cache');
      AsyncStorage.setItem(streakKey, String(computedStreak)).catch(() => {});
    }

    return computedStreak;
  };

  const loadDailyCheckIn = async () => {
    try {
      const todayKey = getTodayDateKey();
      const checkinKey = authStorage.getScopedKey(userId, `daily_checkin_${todayKey}`);
      const checkin = await AsyncStorage.getItem(checkinKey);
      const isChecked = Boolean(checkin);
      setIsCheckedIn(isChecked);

      // Populate historical active dates with check-ins
      try {
        const checkinHistoryRes = await getCheckInHistoryApi(60);
        if (checkinHistoryRes?.success && Array.isArray(checkinHistoryRes.history)) {
          checkinHistoryRes.history.forEach((c) => {
            if (c.date) historicalActiveDatesRef.current.add(c.date);
          });
        }
      } catch {}

      syncTodayStreak({ checkinDone: isChecked });
    } catch (e) {
      console.log('Error checking daily checkin:', e);
    }
  };

  const loadFoodProgress = async () => {
    try {
      const todayKey = getTodayDateKey();
      const activeDateKey = authStorage.getScopedKey(userId, 'food_log_active_date');
      const foodKey = authStorage.getScopedKey(userId, 'food_log_today');
      const waterKey = authStorage.getScopedKey(userId, 'water_log_today');
      const dayCompletedKey = authStorage.getScopedKey(userId, `food_log_completed_${todayKey}`);

      const cachedDate = await AsyncStorage.getItem(activeDateKey);
      if (cachedDate && cachedDate !== todayKey) {
        await AsyncStorage.multiRemove([foodKey, waterKey]);
      }
      await AsyncStorage.setItem(activeDateKey, todayKey);

      let localItems: FoodLogItem[] = [];
      const savedLog = await AsyncStorage.getItem(foodKey);
      if (savedLog) {
        try {
          const parsed = JSON.parse(savedLog);
          if (Array.isArray(parsed)) localItems = parsed;
        } catch { }
      }
      dashboardItemsRef.current = localItems;

      let localWater = 0;
      let hasLocalWater = false;
      const waterSaved = await AsyncStorage.getItem(waterKey);
      if (waterSaved !== null) {
        localWater = parseInt(waterSaved, 10) || 0;
        hasLocalWater = true;
      }
      waterMlRef.current = localWater;
      setWaterMl(localWater);

      const cachedCompleted = await AsyncStorage.getItem(dayCompletedKey);
      let isCompleted = cachedCompleted === 'true';

      let items = localItems;
      let finalWater = localWater;

      // If today is completed and active items are cleaned, read sealed today meals for metrics display
      if (isCompleted && items.length === 0) {
        const historyDayKey = authStorage.getScopedKey(userId, `food_log_${todayKey}`);
        const archivedSaved = await AsyncStorage.getItem(historyDayKey);
        if (archivedSaved) {
          try {
            const parsedArchived = JSON.parse(archivedSaved);
            if (Array.isArray(parsedArchived)) items = parsedArchived;
          } catch {}
        }
      }

      // Update state immediately from local cache so the dashboard renders with 0ms delay
      const computeAndSetMacros = (currentItems: FoodLogItem[], water: number, completed: boolean) => {
        let totalCals = 0;
        let totalProt = 0;
        let totalCarbs = 0;
        let totalFat = 0;

        currentItems.forEach((item) => {
          totalCals += item.calories || 0;
          totalProt += item.protein || 0;
          totalCarbs += item.carbs || 0;
          totalFat += item.fat || 0;
        });

        setCaloriesLogged(totalCals);
        setProteinLogged(totalProt);
        setCarbsLogged(totalCarbs);
        setFatLogged(totalFat);
        setWaterMl(water);
        waterMlRef.current = water;
        setIsNutritionDone(completed);
      };

      computeAndSetMacros(items, finalWater, isCompleted);

      // Sync authenticated user's actual database food log without stale downgrades
      if (userId) {
        try {
          const cloudRes = await getDailyFoodLogApi(todayKey);
          if (cloudRes?.data) {
            if (typeof cloudRes.data.isCompleted === 'boolean') {
              isCompleted = cloudRes.data.isCompleted;
              await AsyncStorage.setItem(dayCompletedKey, isCompleted ? 'true' : 'false');
            }

            if (Array.isArray(cloudRes.data.meals) && cloudRes.data.meals.length > 0) {
              const mappedCloudMeals = cloudRes.data.meals.map((m: any) => ({
                id: m.id,
                mealType: m.mealType,
                title: m.title,
                subtitle: m.subtitle || undefined,
                calories: m.calories,
                protein: m.protein,
                carbs: m.carbs,
                fat: m.fat,
                goalBadge: m.goalBadge || undefined,
                goalBadgeColor: m.goalBadgeColor || undefined,
                icon: m.icon || undefined,
                healthNotes: m.healthNotes || undefined,
                imageUri: m.imageUri || undefined,
                loggedAt: m.loggedAt || undefined,
              }));

              if (isCompleted) {
                // If day is completed, use meals for dashboard metrics but keep active foodKey clean
                items = mappedCloudMeals;
              } else if (localItems.length === 0 || localItems.length < cloudRes.data.meals.length) {
                items = mappedCloudMeals;
                await AsyncStorage.setItem(foodKey, JSON.stringify(items));
                dashboardItemsRef.current = items;
              } else if (localItems.length > cloudRes.data.meals.length) {
                autoSyncFoodAndWater(userId, todayKey, localItems, waterMlRef.current);
              }
            } else if (!isCompleted && localItems.length > 0) {
              autoSyncFoodAndWater(userId, todayKey, localItems, waterMlRef.current);
            }

            const cloudWater = typeof cloudRes.data.waterMl === 'number' ? cloudRes.data.waterMl : 0;
            if (!hasLocalWater) {
              finalWater = cloudWater;
              await AsyncStorage.setItem(waterKey, finalWater.toString());
            } else {
              finalWater = localWater;
              if (localWater !== cloudWater) {
                autoSyncFoodAndWater(userId, todayKey, items, localWater);
              }
            }

            computeAndSetMacros(items, finalWater, isCompleted);
          }
        } catch (e) {
          // Offline fallback
        }

        try {
          const foodHistoryRes = await getFoodLogHistoryApi();
          if (foodHistoryRes?.success && Array.isArray(foodHistoryRes.history)) {
            foodHistoryRes.history.forEach((day) => {
              if (day.isCompleted || (day.totalCalories > 0 && day.meals && day.meals.length > 0) || (day.waterMl && day.waterMl >= targetWater)) {
                if (day.date) historicalActiveDatesRef.current.add(day.date);
              }
            });
          }
        } catch {}
      }

      syncTodayStreak({ nutritionDone: isCompleted, waterAmount: finalWater });
    } catch (err) {
      console.log('Error calculating food progress:', err);
    }
  };

  const loadWorkoutProgress = async () => {
    try {
      const todayKey = getTodayDateKey();
      const cachedExercisesKey = authStorage.getScopedKey(userId, `fittrack_today_exercises_${todayKey}`);
      const cachedHistoryKey = authStorage.getScopedKey(userId, 'fittrack_workout_history_cache');
      const legacyHistoryKey = authStorage.getScopedKey(userId, 'fittrack_workout_history');

      // 1. Immediately populate from local cache if available
      try {
        const [cachedExercisesRaw, cachedHistoryRaw] = await Promise.all([
          AsyncStorage.getItem(cachedExercisesKey),
          AsyncStorage.getItem(cachedHistoryKey),
        ]);

        // Clean up legacy cache key if present
        AsyncStorage.removeItem(legacyHistoryKey).catch(() => {});

        if (cachedExercisesRaw) {
          const parsed = JSON.parse(cachedExercisesRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const formatted: DashboardWorkoutExercise[] = parsed.map((ex: any) => ({
              id: ex.key || ex.id,
              name: ex.name,
              isCompleted: Boolean(ex.sets && ex.sets.length > 0 && ex.sets.every((s: any) => s.done)),
            }));
            setTodayExercises(formatted);
            const completedSetsCount = parsed.reduce(
              (acc: number, ex: any) => acc + (ex.sets ? ex.sets.filter((s: any) => s.done).length : 0),
              0
            );
            setActiveMinutesToday(completedSetsCount * 4);
          }
        }

        if (cachedHistoryRaw) {
          const sessions: ApiWorkoutSession[] = JSON.parse(cachedHistoryRaw);
          if (Array.isArray(sessions)) {
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const completedThisWeek = sessions.filter((s) => {
              const timestamp = s.completedAt || (s.completed ? s.createdAt : null);
              if (!timestamp) return false;
              const compDate = new Date(timestamp);
              return compDate >= startOfWeek;
            });

            setWorkoutsThisWeek(completedThisWeek.length);

            sessions.forEach((s) => {
              const timestamp = s.completedAt || (s.completed ? s.createdAt : null);
              if (timestamp) {
                const d = new Date(timestamp);
                const key = formatDateKey(d);
                if (key) historicalActiveDatesRef.current.add(key);
              }
            });
          }
        }

        const streakKey = authStorage.getScopedKey(userId, 'fittrack_today_streak_cache');
        const cachedStreakRaw = await AsyncStorage.getItem(streakKey);
        if (cachedStreakRaw !== null) {
          const parsed = parseInt(cachedStreakRaw, 10);
          if (!isNaN(parsed)) setCurrentStreak(parsed);
        }

        // Dynamically compute weekly workouts target and today's scheduled routine from weeklySplit
        const splitKey = authStorage.getScopedKey(userId, 'workout_planner_split');
        const templatesKey = authStorage.getScopedKey(userId, 'workout_planner_templates');
        const [savedSplit, savedTemplates] = await Promise.all([
          AsyncStorage.getItem(splitKey),
          AsyncStorage.getItem(templatesKey),
        ]);

        let split: WeeklySplit = DEFAULT_WEEKLY_SPLIT;
        if (savedSplit) {
          try {
            const parsed = JSON.parse(savedSplit);
            if (parsed && typeof parsed === 'object') {
              split = parsed;
            }
          } catch {}
        }

        let templates: WorkoutRoutineTemplate[] = DEFAULT_ROUTINE_TEMPLATES;
        if (savedTemplates) {
          try {
            const parsed = JSON.parse(savedTemplates);
            if (Array.isArray(parsed) && parsed.length > 0) {
              templates = mergeWithDefaultTemplates(parsed);
            }
          } catch {}
        }

        const todayDay = getTodayDayOfWeek();
        const routineId = split[todayDay];
        const matchedRoutine = templates.find((r) => r.id === routineId) || null;
        const isRest = !matchedRoutine && (routineId === null || routineId === undefined);

        setTodayScheduledRoutine(matchedRoutine);
        setIsTodayRestDay(isRest);
      } catch (cacheErr) {
        console.log('Error reading local workout cache:', cacheErr);
      }

      // 2. Fetch fresh data from server in background
      let sessions: ApiWorkoutSession[] = [];
      try {
        const historyRes = await getWorkoutHistory();
        sessions = historyRes.sessions || [];
        // Persist fresh history cache unconditionally (including empty array on session deletions)
        AsyncStorage.setItem(cachedHistoryKey, JSON.stringify(sessions)).catch(() => {});
      } catch (e) {
        // Offline
      }

      const todayCompletedSession = sessions.find((s) => {
        const timestamp = s.completedAt || (s.completed ? s.createdAt : null);
        if (!timestamp) return false;
        const d = new Date(timestamp);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return dateKey === todayKey;
      });

      let todayRes: any = null;
      try {
        todayRes = await getTodayWorkoutSession();
      } catch (e) {
        // Offline
      }

      const isExplicitlyCompleted = Boolean(todayCompletedSession);

      if (todayCompletedSession) {
        setTodayCompletedWorkoutStats({
          duration: todayCompletedSession.duration || 35,
          caloriesBurned: todayCompletedSession.caloriesBurned || 240,
        });
        setActiveMinutesToday(todayCompletedSession.duration || 35);
      } else {
        setTodayCompletedWorkoutStats(null);
        if (todayRes?.session?.exercises && todayRes.session.exercises.length > 0) {
          const completedSetsCount = todayRes.session.exercises.reduce(
            (acc: number, ex: ApiWorkoutExercise) =>
              acc + (ex.sets ? ex.sets.filter((s) => s.done).length : 0),
            0
          );
          setActiveMinutesToday(completedSetsCount * 4); // ~4 min per completed set
        } else {
          setActiveMinutesToday(0);
        }
      }

      if (todayRes?.session?.exercises && !todayCompletedSession) {
        const formatted: DashboardWorkoutExercise[] = todayRes.session.exercises.map((ex: ApiWorkoutExercise) => {
          const allSetsDone = Boolean(ex.sets && ex.sets.length > 0 && ex.sets.every((s) => s.done));
          return {
            id: ex.id,
            name: ex.name,
            isCompleted: allSetsDone,
          };
        });
        setTodayExercises(formatted);
      } else if (!todayCompletedSession) {
        setTodayExercises([]);
      }

      setWorkoutSessionDone(isExplicitlyCompleted);

      // 3. Weekly count & Streak (always update, even when sessions is empty)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start of week
      startOfWeek.setHours(0, 0, 0, 0);

      const completedThisWeek = sessions.filter((s) => {
        const timestamp = s.completedAt || (s.completed ? s.createdAt : null);
        if (!timestamp) return false;
        const compDate = new Date(timestamp);
        return compDate >= startOfWeek;
      });

      setWorkoutsThisWeek(completedThisWeek.length);

      // Add workout session dates to historical active dates
      sessions.forEach((s) => {
        const timestamp = s.completedAt || (s.completed ? s.createdAt : null);
        if (timestamp) {
          const d = new Date(timestamp);
          const key = formatDateKey(d);
          if (key) historicalActiveDatesRef.current.add(key);
        }
      });

      syncTodayStreak({ workoutDone: isExplicitlyCompleted });
    } catch (err) {
      console.log('Error calculating workout progress:', err);
    }
  };

  const loadAll = async () => {
    try {
      await Promise.all([
        loadUserData(),
        loadDailyCheckIn(),
        loadFoodProgress(),
        loadWorkoutProgress(),
      ]);
    } finally {
      screenCache.setDashboardLoaded(true);
      setInitialLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [userId])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('FOOD_LOG_UPDATED', (evt?: { sender?: string; waterMl?: number }) => {
      if (evt?.sender === 'dashboard_screen') return;
      loadFoodProgress();
    });
    const subW = DeviceEventEmitter.addListener('WORKOUT_SESSION_COMPLETED', () => {
      loadWorkoutProgress();
    });
    const subWD = DeviceEventEmitter.addListener('WORKOUT_SESSION_DELETED', () => {
      loadWorkoutProgress();
    });
    const subC = DeviceEventEmitter.addListener('DAILY_CHECKIN_UPDATED', (evt?: { isCheckedIn?: boolean }) => {
      if (typeof evt?.isCheckedIn === 'boolean') {
        setIsCheckedIn(evt.isCheckedIn);
        syncTodayStreak({ checkinDone: evt.isCheckedIn });
      } else {
        loadDailyCheckIn();
      }
    });
    const subS = DeviceEventEmitter.addListener('WORKOUT_SPLIT_UPDATED', () => {
      loadWorkoutProgress();
    });
    return () => {
      sub.remove();
      subW.remove();
      subWD.remove();
      subC.remove();
      subS.remove();
    };
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleQuickAddWater = async (amount: number = 250) => {
    hapticFeedback.light();
    const current = waterMlRef.current;
    if (current >= targetWater) {
      showToast({
        message: 'Daily Hydration Complete',
        description: `You've reached your ${targetWater.toLocaleString()}ml daily target.`,
        type: 'success',
        icon: '✓',
      });
      return;
    }

    const newTotal = Math.min(targetWater, current + amount);
    waterMlRef.current = newTotal;
    setWaterMl(newTotal);
    syncTodayStreak({ waterAmount: newTotal });

    try {
      const todayKey = getTodayDateKey();
      const foodKey = authStorage.getScopedKey(userId, 'food_log_today');
      const waterKey = authStorage.getScopedKey(userId, 'water_log_today');
      const dateWaterKey = authStorage.getScopedKey(userId, `water_log_${todayKey}`);

      await Promise.all([
        AsyncStorage.setItem(waterKey, newTotal.toString()),
        AsyncStorage.setItem(dateWaterKey, newTotal.toString()),
      ]);
      await AsyncStorage.removeItem('water_log_today').catch(() => { });

      DeviceEventEmitter.emit('FOOD_LOG_UPDATED', { sender: 'dashboard_screen', waterMl: newTotal });

      const savedFood = await AsyncStorage.getItem(foodKey);
      let currentItems: FoodLogItem[] = [];
      if (savedFood) {
        try {
          const parsed = JSON.parse(savedFood);
          if (Array.isArray(parsed)) currentItems = parsed;
        } catch { }
      }
      dashboardItemsRef.current = currentItems;

      autoSyncFoodAndWater(userId, todayKey, currentItems, newTotal);
    } catch (e) {
      console.log('Error saving quick water:', e);
    }

    if (newTotal >= targetWater) {
      showToast({
        message: 'Daily Hydration Goal Met',
        description: `Reached ${targetWater.toLocaleString()} / ${targetWater.toLocaleString()} ml.`,
        type: 'success',
        icon: '✓',
      });
    } else {
      showToast({
        message: `Added ${amount}ml Water`,
        description: `Total today: ${newTotal.toLocaleString()} / ${targetWater.toLocaleString()} ml (${Math.round((newTotal / targetWater) * 100)}%)`,
        type: 'info',
        icon: '✓',
      });
    }
  };

  const completedExercisesCount = todayExercises.filter((e) => e.isCompleted).length;

  // Daily workout metric calculations for StatCard
  const workoutStatValue = workoutSessionDone
    ? `${activeMinutesToday || todayCompletedWorkoutStats?.duration || 35} min`
    : activeMinutesToday > 0
    ? `${activeMinutesToday} min`
    : isTodayRestDay
    ? 'Rest Day'
    : todayScheduledRoutine
    ? `${todayScheduledRoutine.estimatedDurationMinutes || 45} min`
    : todayExercises.length > 0
    ? `${todayExercises.length} planned`
    : 'Rest Day';

  const workoutStatSubtitle = workoutSessionDone
    ? (todayCompletedWorkoutStats?.caloriesBurned
        ? `${todayCompletedWorkoutStats.caloriesBurned} kcal burned`
        : 'Session completed')
    : activeMinutesToday > 0
    ? `${completedExercisesCount}/${todayExercises.length} exercises done`
    : isTodayRestDay
    ? 'Active recovery'
    : todayScheduledRoutine
    ? `${todayScheduledRoutine.targetMuscleGroup || 'Split'} · Ready`
    : todayExercises.length > 0
    ? 'Ready to start'
    : workoutsThisWeek > 0
    ? `${workoutsThisWeek} workouts this week`
    : 'Active recovery';

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 125 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <View className="w-full max-w-5xl self-center mx-auto">
          {/* Header Greeting */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 mr-2">
              <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-black tracking-tight">
                {getGreeting()}, {userName} 
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark font-medium mt-0.5">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                hapticFeedback.light();
                router.push('/(screen)/calendar' as any);
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-surface dark:bg-surface-dark border-0 shadow-sm shadow-slate-200/70 dark:shadow-none"
              accessibilityLabel="Activity Calendar"
            >
              <Ionicons name="calendar-outline" size={15} color={colors.textPrimary} style={{ marginRight: 2 }} />
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                Calendar
              </Text>
            </TouchableOpacity>
          </View>

          {initialLoading ? (
            <View className="my-2">
              <CardSkeleton className="mb-3" />

              {/* Skeleton placeholder stats */}
              <View className="flex-row gap-2.5 mb-2.5">
                <StatCardSkeleton />
                <StatCardSkeleton />
              </View>
              <View className="flex-row gap-2.5 mb-3">
                <StatCardSkeleton />
                <StatCardSkeleton />
              </View>

              <CardSkeleton className="mb-3" />
            </View>
          ) : (
            <>
              {/* Motivation-Based Daily Check-In */}
              <DailyCheckInCard
                onCheckInCompleted={() => {
                  setIsCheckedIn(true);
                  syncTodayStreak({ checkinDone: true });
                }}
              />

              {/* Key Metrics Grid: 2x2 on phone, 4 across on tablet */}
              <View className="flex-col md:flex-row gap-2.5 mb-3">
                <View className="flex-row flex-1 gap-2.5">
                  <StatCard
                    variant="calories"
                    iconName="restaurant"
                    title="Calories"
                    value={`${caloriesLogged.toLocaleString()} kcal`}
                    subtitle={`Goal: ${targetCalories.toLocaleString()} kcal`}
                    onPress={() => router.push('/(screen)/foodlog' as any)}
                  />
                  <StatCard
                    variant="hydration"
                    iconName="water"
                    title="Hydration"
                    value={`${waterMl.toLocaleString()} ml`}
                    subtitle={`Goal: ${targetWater.toLocaleString()} ml`}
                  />
                </View>

                <View className="flex-row flex-1 gap-2.5">
                  <StatCard
                    variant="workout"
                    iconName="barbell"
                    title="Workout"
                    value={workoutStatValue}
                    subtitle={workoutStatSubtitle}
                    onPress={() => router.push('/(screen)/workouts' as any)}
                  />
                  <StatCard
                    variant="streak"
                    iconName="flame"
                    title="Streak"
                    value={`${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`}
                    subtitle={currentStreak > 0 ? 'Active streak' : 'Check in daily'}
                  />
                </View>
              </View>

              {/* Today's Workout & Daily Nutrition Breakdown (Side-by-side on wide screens) */}
              <View className="flex-col lg:flex-row lg:gap-4 items-start">
                <View className="w-full lg:flex-1">
                  <TodayWorkoutCard
                    exercises={todayExercises}
                    isSessionCompleted={workoutSessionDone}
                    completedStats={todayCompletedWorkoutStats}
                    scheduledRoutine={todayScheduledRoutine}
                    isRestDay={isTodayRestDay}
                  />
                </View>

                <View className="w-full lg:flex-1">
                  <MacroProgressCard
                    caloriesLogged={caloriesLogged}
                    targetCalories={targetCalories}
                    proteinLogged={proteinLogged}
                    targetProtein={targetProtein}
                    carbsLogged={carbsLogged}
                    targetCarbs={targetCarbs}
                    fatLogged={fatLogged}
                    targetFat={targetFat}
                  />
                </View>
              </View>

              {/* 7-Day Nutrition & Workout Trends Weekly Chart */}
              <WeeklyNutritionChartCard
                currentDayCalories={caloriesLogged}
                currentDayProtein={proteinLogged}
                currentDayCarbs={carbsLogged}
                currentDayFat={fatLogged}
                targetCalories={targetCalories}
                targetProtein={targetProtein}
                targetCarbs={targetCarbs}
                targetFat={targetFat}
                activeMinutesToday={activeMinutesToday}
                workoutSessionDone={workoutSessionDone}
                todayCompletedWorkoutStats={todayCompletedWorkoutStats}
                targetWorkoutMinutes={45}
              />

              {/* Interactive Daily Goals Checklist */}
              <DailyGoalsCard
                isCheckedIn={isCheckedIn}
                caloriesLogged={caloriesLogged}
                targetCalories={targetCalories}
                activeMinutes={activeMinutesToday}
                completedExercisesCount={completedExercisesCount}
                totalExercisesCount={todayExercises.length}
                workoutSessionDone={workoutSessionDone}
                isNutritionDone={isNutritionDone}
                waterMl={waterMl}
                targetWaterMl={targetWater}
                onQuickAddWater={handleQuickAddWater}
                onCheckInPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
                scheduledRoutine={todayScheduledRoutine}
                isRestDay={isTodayRestDay}
              />

              {/* Community Athlete Stories & Testimonials */}
              <CommunityStoriesCard
                onOpenFeed={() => {
                  setTestimonialInitialTab('feed');
                  setShowTestimonialsModal(true);
                }}
                onOpenWrite={() => {
                  setTestimonialInitialTab('write');
                  setShowTestimonialsModal(true);
                }}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Athlete Testimonials Full Feed & Submission Modal */}
      <TestimonialModal
        visible={showTestimonialsModal}
        initialTab={testimonialInitialTab}
        onClose={() => setShowTestimonialsModal(false)}
      />
    </SafeAreaView>
  );
}