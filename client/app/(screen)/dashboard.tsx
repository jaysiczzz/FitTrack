import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, RefreshControl, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';

import DailyCheckInCard from '@/components/dashboard/DailyCheckInCard';
import DailyGoalsCard from '@/components/dashboard/DailyGoalsCard';
import StatCard from '@/components/dashboard/StatCard';
import MacroProgressCard from '@/components/dashboard/MacroProgressCard';
import TodayWorkoutCard, { DashboardWorkoutExercise } from '@/components/dashboard/TodayWorkoutCard';
import AiInsightsCard from '@/components/dashboard/AiInsightsCard';

import { getAIInsights, AIInsight } from '@/api/ai';
import { getTodayWorkoutSession, getWorkoutHistory, ApiWorkoutSession, ApiWorkoutExercise } from '@/api/workout';
import { FoodLogItem } from '@/components/foodlog/foodLogTypes';
import { getDailyFoodLogApi, autoSyncFoodAndWater } from '@/api/foodlog';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import { useToast } from '@/context/ToastContext';
import { useThemeColors } from '@/constants/colors';

function calculateWorkoutStreak(
  sessions: ApiWorkoutSession[],
  isTodayCompleted: boolean = false
): number {
  const formatDateKey = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const completedDays = new Set<string>();

  for (const s of sessions) {
    const timestamp = s.completedAt || (s.completed ? s.createdAt : null);
    if (timestamp) {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        completedDays.add(formatDateKey(d));
      }
    }
  }

  const today = new Date();
  const todayKey = formatDateKey(today);

  if (isTodayCompleted) {
    completedDays.add(todayKey);
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  // If neither today nor yesterday has a completed session, streak is broken
  let anchorDate: Date | null = null;
  if (completedDays.has(todayKey)) {
    anchorDate = new Date(today);
  } else if (completedDays.has(yesterdayKey)) {
    anchorDate = new Date(yesterday);
  } else {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(anchorDate);

  while (completedDays.has(formatDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export default function Dashboard() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const { showSuccess, showToast } = useToast();

  const [userName, setUserName] = useState('Athlete');
  const [userGoal, setUserGoal] = useState<'MUSCLE_GAIN' | 'WEIGHT_LOSS'>('MUSCLE_GAIN');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  // Check-In state
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Nutrition Progress States
  const [caloriesLogged, setCaloriesLogged] = useState(0);
  const [proteinLogged, setProteinLogged] = useState(0);
  const [carbsLogged, setCarbsLogged] = useState(0);
  const [fatLogged, setFatLogged] = useState(0);
  const [waterMl, setWaterMl] = useState(0);

  // Workout Progress States
  const [activeMinutesToday, setActiveMinutesToday] = useState(0);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
  const targetWorkoutsThisWeek = 5;
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayExercises, setTodayExercises] = useState<DashboardWorkoutExercise[]>([]);
  const [workoutSessionDone, setWorkoutSessionDone] = useState(false);

  // AI Insights State
  const [insights, setInsights] = useState<AIInsight[]>([
    {
      title: 'Workout & Nutrition Synergy',
      lines: [
        'Log your meals and completed sets to unlock customized AI performance & recovery recommendations.',
      ],
    },
    {
      title: 'Post-Workout Anabolic Window',
      lines: [
        'Consuming 25-35g of high quality protein within 60 minutes after exercise accelerates muscle protein synthesis.',
      ],
    },
  ]);

  // Dynamic targets based on goal
  const targetCalories = userGoal === 'MUSCLE_GAIN' ? 2400 : 1900;
  const targetProtein = userGoal === 'MUSCLE_GAIN' ? 160 : 145;
  const targetCarbs = userGoal === 'MUSCLE_GAIN' ? 260 : 180;
  const targetFat = userGoal === 'MUSCLE_GAIN' ? 75 : 55;
  const targetWater = 2000;

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
        if (user.firstName) setUserName(user.firstName);
        if (user.goal) setUserGoal(user.goal);
      } else {
        const uStr = await AsyncStorage.getItem('user');
        if (uStr) {
          const parsed = JSON.parse(uStr);
          if (parsed.firstName) setUserName(parsed.firstName);
          if (parsed.goal) setUserGoal(parsed.goal);
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

  const loadDailyCheckIn = async () => {
    try {
      const todayKey = getTodayDateKey();
      const checkinKey = authStorage.getScopedKey(userId, `daily_checkin_${todayKey}`);
      const checkin = await AsyncStorage.getItem(checkinKey);
      setIsCheckedIn(!!checkin);
    } catch (e) {
      console.log('Error checking daily checkin:', e);
    }
  };

  const loadFoodProgress = async () => {
    try {
      const todayKey = getTodayDateKey();
      const foodKey = authStorage.getScopedKey(userId, 'food_log_today');
      const waterKey = authStorage.getScopedKey(userId, 'water_log_today');

      let localItems: FoodLogItem[] = [];
      const savedLog = await AsyncStorage.getItem(foodKey);
      if (savedLog) {
        try {
          const parsed = JSON.parse(savedLog);
          if (Array.isArray(parsed)) localItems = parsed;
        } catch {}
      }

      let localWater = 0;
      const waterSaved = await AsyncStorage.getItem(waterKey);
      if (waterSaved) {
        localWater = parseInt(waterSaved, 10) || 0;
      }

      let items = localItems;
      let finalWater = localWater;

      // Sync authenticated user's actual database food log without stale downgrades
      if (userId) {
        try {
          const cloudRes = await getDailyFoodLogApi(todayKey);
          if (cloudRes?.data) {
            if (Array.isArray(cloudRes.data.meals) && cloudRes.data.meals.length > 0) {
              if (localItems.length === 0 || localItems.length < cloudRes.data.meals.length) {
                items = cloudRes.data.meals.map((m: any) => ({
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
                await AsyncStorage.setItem(foodKey, JSON.stringify(items));
              } else if (localItems.length > cloudRes.data.meals.length) {
                autoSyncFoodAndWater(userId, todayKey, localItems, Math.max(localWater, cloudRes.data.waterMl || 0));
              }
            } else if (localItems.length > 0) {
              autoSyncFoodAndWater(userId, todayKey, localItems, localWater);
            }

            const cloudWater = typeof cloudRes.data.waterMl === 'number' ? cloudRes.data.waterMl : 0;
            finalWater = Math.max(localWater, cloudWater);
            await AsyncStorage.setItem(waterKey, finalWater.toString());
            if (localWater > cloudWater) {
              autoSyncFoodAndWater(userId, todayKey, items, finalWater);
            }
          }
        } catch (e) {
          // Offline fallback
        }
      }

      let totalCals = 0;
      let totalProt = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      items.forEach((item) => {
        totalCals += item.calories || 0;
        totalProt += item.protein || 0;
        totalCarbs += item.carbs || 0;
        totalFat += item.fat || 0;
      });

      setCaloriesLogged(totalCals);
      setProteinLogged(totalProt);
      setCarbsLogged(totalCarbs);
      setFatLogged(totalFat);
      setWaterMl(finalWater);
    } catch (err) {
      console.log('Error calculating food progress:', err);
    }
  };

  const loadWorkoutProgress = async () => {
    try {
      // 1. Fetch today's active session exercises
      const todayRes = await getTodayWorkoutSession();
      if (todayRes.session && todayRes.session.exercises) {
        const formatted: DashboardWorkoutExercise[] = todayRes.session.exercises.map((ex: ApiWorkoutExercise) => {
          const allSetsDone = Boolean(ex.sets && ex.sets.length > 0 && ex.sets.every((s) => s.done));
          return {
            id: ex.id,
            name: ex.name,
            isCompleted: allSetsDone,
          };
        });
        setTodayExercises(formatted);

        const completedSetsCount = todayRes.session.exercises.reduce(
          (acc: number, ex: ApiWorkoutExercise) =>
            acc + (ex.sets ? ex.sets.filter((s) => s.done).length : 0),
          0
        );
        setActiveMinutesToday(completedSetsCount * 4); // ~4 min per completed set
        const isTodaySessionDone = Boolean(
          todayRes.session.completed ||
          (formatted.length > 0 && formatted.every((e) => e.isCompleted))
        );
        setWorkoutSessionDone(isTodaySessionDone);
      } else {
        setTodayExercises([]);
        setActiveMinutesToday(0);
        setWorkoutSessionDone(false);
      }

      // 2. Fetch completed workout history for streak and weekly count
      const historyRes = await getWorkoutHistory();
      if (historyRes.sessions) {
        const sessions: ApiWorkoutSession[] = historyRes.sessions;
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start of week
        startOfWeek.setHours(0, 0, 0, 0);

        const isTodaySessionDone = Boolean(
          todayRes?.session?.completed ||
          (todayRes?.session?.exercises &&
            todayRes.session.exercises.length > 0 &&
            todayRes.session.exercises.every(
              (e: ApiWorkoutExercise) => e.sets && e.sets.length > 0 && e.sets.every((s) => s.done)
            ))
        );

        const completedThisWeek = sessions.filter((s) => {
          const timestamp = s.completedAt || (s.completed ? s.createdAt : null);
          if (!timestamp) return false;
          const compDate = new Date(timestamp);
          return compDate >= startOfWeek;
        });

        const thisWeekCount =
          completedThisWeek.length +
          (isTodaySessionDone && !sessions.some((s) => s.id === todayRes?.session?.id) ? 1 : 0);

        setWorkoutsThisWeek(thisWeekCount);
        setCurrentStreak(calculateWorkoutStreak(sessions, isTodaySessionDone));
      }
    } catch (err) {
      console.log('Error calculating workout progress:', err);
    }
  };

  const loadAll = async () => {
    await Promise.all([
      loadUserData(),
      loadDailyCheckIn(),
      loadFoodProgress(),
      loadWorkoutProgress(),
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [userId])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('FOOD_LOG_UPDATED', () => {
      loadFoodProgress();
    });
    return () => {
      sub.remove();
    };
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleQuickAddWater = async (amount: number = 250) => {
    if (waterMl >= targetWater) {
      showToast({
        message: 'Daily Hydration Complete',
        description: `You've reached your ${targetWater.toLocaleString()}ml daily target.`,
        type: 'success',
        icon: '✓',
      });
      return;
    }

    const newTotal = Math.min(targetWater, waterMl + amount);
    setWaterMl(newTotal);

    try {
      const todayKey = getTodayDateKey();
      const foodKey = authStorage.getScopedKey(userId, 'food_log_today');
      const waterKey = authStorage.getScopedKey(userId, 'water_log_today');
      const savedFood = await AsyncStorage.getItem(foodKey);
      let currentItems: FoodLogItem[] = [];
      if (savedFood) {
        try {
          const parsed = JSON.parse(savedFood);
          if (Array.isArray(parsed)) currentItems = parsed;
        } catch {}
      }

      await AsyncStorage.setItem(waterKey, newTotal.toString());
      await AsyncStorage.removeItem('water_log_today').catch(() => {});
      autoSyncFoodAndWater(userId, todayKey, currentItems, newTotal);
      DeviceEventEmitter.emit('FOOD_LOG_UPDATED');
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

  const refreshAIInsights = async () => {
    setLoadingAi(true);
    try {
      const res = await getAIInsights();
      if (res.success && res.insights?.length) {
        setInsights(res.insights);
        showSuccess('AI Insights Refreshed', 'Generated latest performance predictions.');
      }
    } catch (err: any) {
      console.log('AI Insights Error:', err.message);
    } finally {
      setLoadingAi(false);
    }
  };

  const completedExercisesCount = todayExercises.filter((e) => e.isCompleted).length;

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 115 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Header Greeting */}
        <View className="mb-4">
          <Text className="text-text-primary dark:text-text-primary-dark text-3xl font-black tracking-tight">
            {getGreeting()}, {userName}
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark mt-1 text-xs font-normal">
            Your live fitness and accountability overview
          </Text>
        </View>

        {/* Motivation-Based Daily Check-In */}
        <DailyCheckInCard
          onCheckInCompleted={() => {
            setIsCheckedIn(true);
          }}
        />

        {/* Key Metrics Grid */}
        <View className="flex-row gap-2.5 mb-2.5">
          <StatCard
            iconName="flame"
            title="Calories"
            value={`${caloriesLogged.toLocaleString()} kcal`}
            subtitle={`Goal: ${targetCalories.toLocaleString()} kcal`}
            onPress={() => router.push('/(screen)/foodlog' as any)}
          />
          <StatCard
            iconName="water"
            title="Hydration"
            value={`${waterMl.toLocaleString()} ml`}
            subtitle={`Goal: ${targetWater.toLocaleString()} ml`}
          />
        </View>

        <View className="flex-row gap-2.5 mb-3">
          <StatCard
            iconName="barbell"
            title="Workouts"
            value={`${workoutsThisWeek} / ${targetWorkoutsThisWeek}`}
            subtitle={workoutsThisWeek > 0 ? `${workoutsThisWeek} sessions logged` : 'Start a routine'}
            onPress={() => router.push('/(screen)/workouts' as any)}
          />
          <StatCard
            iconName="sparkles"
            title="Streak"
            value={`${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`}
            subtitle={currentStreak > 0 ? 'Active streak' : 'Check in daily'}
          />
        </View>

        {/* Today's Workout Session Card */}
        <TodayWorkoutCard exercises={todayExercises} />

        {/* Daily Nutrition Macro Breakdown */}
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

        {/* Interactive Daily Goals Checklist */}
        <DailyGoalsCard
          isCheckedIn={isCheckedIn}
          caloriesLogged={caloriesLogged}
          targetCalories={targetCalories}
          activeMinutes={activeMinutesToday}
          completedExercisesCount={completedExercisesCount}
          totalExercisesCount={todayExercises.length}
          workoutSessionDone={workoutSessionDone}
          waterMl={waterMl}
          targetWaterMl={targetWater}
          onQuickAddWater={handleQuickAddWater}
        />

        {/* AI Insights & Predictions */}
        <AiInsightsCard
          insights={insights}
          loading={loadingAi}
          onRefresh={refreshAIInsights}
        />
      </ScrollView>
    </SafeAreaView>
  );
}