import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ScrollView, View, Text, RefreshControl, DeviceEventEmitter, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';

import DailyCheckInCard from '@/components/dashboard/DailyCheckInCard';
import DailyGoalsCard from '@/components/dashboard/DailyGoalsCard';
import StatCard from '@/components/dashboard/StatCard';
import MacroProgressCard from '@/components/dashboard/MacroProgressCard';
import TodayWorkoutCard, { DashboardWorkoutExercise } from '@/components/dashboard/TodayWorkoutCard';
import AiInsightsCard from '@/components/dashboard/AiInsightsCard';
import CommunityStoriesCard from '@/components/dashboard/CommunityStoriesCard';
import TestimonialModal from '@/components/settings/TestimonialModal';

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

  // Testimonials & Athlete Stories Modal State
  const [showTestimonialsModal, setShowTestimonialsModal] = useState(false);
  const [testimonialInitialTab, setTestimonialInitialTab] = useState<'feed' | 'write'>('feed');

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
  const targetWorkoutsThisWeek = 5;
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayExercises, setTodayExercises] = useState<DashboardWorkoutExercise[]>([]);
  const [workoutSessionDone, setWorkoutSessionDone] = useState(false);
  const [todayCompletedWorkoutStats, setTodayCompletedWorkoutStats] = useState<{ duration: number; caloriesBurned: number } | null>(null);

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
        } catch {}
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
                dashboardItemsRef.current = items;
              } else if (localItems.length > cloudRes.data.meals.length) {
                autoSyncFoodAndWater(userId, todayKey, localItems, waterMlRef.current);
              }
            } else if (localItems.length > 0) {
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
      waterMlRef.current = finalWater;
      setIsNutritionDone(isCompleted);
    } catch (err) {
      console.log('Error calculating food progress:', err);
    }
  };

  const loadWorkoutProgress = async () => {
    try {
      const todayKey = getTodayDateKey();

      // 1. Fetch completed workout history first
      const historyRes = await getWorkoutHistory();
      const sessions: ApiWorkoutSession[] = historyRes.sessions || [];

      // Check if a workout was genuinely completed today
      const todayCompletedSession = sessions.find((s) => {
        const timestamp = s.completedAt || (s.completed ? s.createdAt : null);
        if (!timestamp) return false;
        const d = new Date(timestamp);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return dateKey === todayKey;
      });

      // 2. Fetch today's active session exercises
      const todayRes = await getTodayWorkoutSession();
      const isExplicitlyCompleted = Boolean(todayCompletedSession || todayRes?.session?.completed);

      if (todayCompletedSession) {
        setTodayCompletedWorkoutStats({
          duration: todayCompletedSession.duration || 35,
          caloriesBurned: todayCompletedSession.caloriesBurned || 240,
        });
        setActiveMinutesToday(todayCompletedSession.duration || 35);
      } else if (todayRes?.session?.exercises) {
        setTodayCompletedWorkoutStats(null);
        const completedSetsCount = todayRes.session.exercises.reduce(
          (acc: number, ex: ApiWorkoutExercise) =>
            acc + (ex.sets ? ex.sets.filter((s) => s.done).length : 0),
          0
        );
        setActiveMinutesToday(completedSetsCount * 4); // ~4 min per completed set
      } else {
        setTodayCompletedWorkoutStats(null);
        setActiveMinutesToday(0);
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
      } else {
        setTodayExercises([]);
      }

      setWorkoutSessionDone(isExplicitlyCompleted);

      // 3. Weekly count & Streak ONLY increment on completed sessions!
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
      setCurrentStreak(calculateWorkoutStreak(sessions, isExplicitlyCompleted));
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
    const sub = DeviceEventEmitter.addListener('FOOD_LOG_UPDATED', (evt?: { sender?: string; waterMl?: number }) => {
      if (evt?.sender === 'dashboard_screen') return;
      loadFoodProgress();
    });
    const subW = DeviceEventEmitter.addListener('WORKOUT_SESSION_COMPLETED', () => {
      loadWorkoutProgress();
    });
    const subC = DeviceEventEmitter.addListener('DAILY_CHECKIN_UPDATED', (evt?: { isCheckedIn?: boolean }) => {
      if (typeof evt?.isCheckedIn === 'boolean') {
        setIsCheckedIn(evt.isCheckedIn);
      } else {
        loadDailyCheckIn();
      }
    });
    return () => {
      sub.remove();
      subW.remove();
      subC.remove();
    };
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleQuickAddWater = async (amount: number = 250) => {
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

    try {
      const todayKey = getTodayDateKey();
      const foodKey = authStorage.getScopedKey(userId, 'food_log_today');
      const waterKey = authStorage.getScopedKey(userId, 'water_log_today');
      const dateWaterKey = authStorage.getScopedKey(userId, `water_log_${todayKey}`);

      await Promise.all([
        AsyncStorage.setItem(waterKey, newTotal.toString()),
        AsyncStorage.setItem(dateWaterKey, newTotal.toString()),
      ]);
      await AsyncStorage.removeItem('water_log_today').catch(() => {});

      DeviceEventEmitter.emit('FOOD_LOG_UPDATED', { sender: 'dashboard_screen', waterMl: newTotal });

      const savedFood = await AsyncStorage.getItem(foodKey);
      let currentItems: FoodLogItem[] = [];
      if (savedFood) {
        try {
          const parsed = JSON.parse(savedFood);
          if (Array.isArray(parsed)) currentItems = parsed;
        } catch {}
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
        ref={scrollRef}
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
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1 mr-2">
            <Text className="text-text-primary dark:text-text-primary-dark text-3xl font-black tracking-tight">
              {getGreeting()}, {userName}
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark mt-1 text-xs font-normal">
              Your live fitness and accountability overview
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(screen)/calendar' as any)}
            activeOpacity={0.8}
            className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-2xl border bg-accent/10 dark:bg-accent-dark/15 border-accent/30 dark:border-accent-dark/30"
            accessibilityLabel="Activity Calendar"
          >
            <Ionicons
              name="calendar"
              size={15}
              color={colors.accent}
            />
            <Text className="text-xs font-black text-accent dark:text-accent-dark">
              Calendar
            </Text>
          </TouchableOpacity>
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
        <TodayWorkoutCard
          exercises={todayExercises}
          isSessionCompleted={workoutSessionDone}
          completedStats={todayCompletedWorkoutStats}
        />

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
          isNutritionDone={isNutritionDone}
          waterMl={waterMl}
          targetWaterMl={targetWater}
          onQuickAddWater={handleQuickAddWater}
          onCheckInPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        />

        {/* AI Insights & Predictions */}
        <AiInsightsCard
          insights={insights}
          loading={loadingAi}
          onRefresh={refreshAIInsights}
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