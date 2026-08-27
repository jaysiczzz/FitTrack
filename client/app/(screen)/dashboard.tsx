import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';

import DailyCheckInCard, { MoodOption } from '@/components/dashboard/DailyCheckInCard';
import DailyGoalsCard from '@/components/dashboard/DailyGoalsCard';
import QuickActionsRow from '@/components/dashboard/QuickActionsRow';
import StatCard from '@/components/dashboard/StatCard';
import MacroProgressCard from '@/components/dashboard/MacroProgressCard';
import TodayWorkoutCard, { DashboardWorkoutExercise } from '@/components/dashboard/TodayWorkoutCard';
import AiInsightsCard from '@/components/dashboard/AiInsightsCard';
import AiScanModal from '@/components/foodlog/AiScanModal';

import { getAIInsights, AIInsight } from '@/api/ai';
import { getTodayWorkoutSession, getWorkoutHistory, ApiWorkoutSession, ApiWorkoutExercise } from '@/api/workout';
import { FoodLogItem } from '@/components/foodlog/foodLogTypes';
import { useToast } from '@/context/ToastContext';

export default function Dashboard() {
  const router = useRouter();
  const { showSuccess, showToast } = useToast();

  const [userName, setUserName] = useState('Athlete');
  const [userGoal, setUserGoal] = useState<'MUSCLE_GAIN' | 'WEIGHT_LOSS'>('MUSCLE_GAIN');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);

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
  const [targetWorkoutsThisWeek] = useState(5);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayExercises, setTodayExercises] = useState<DashboardWorkoutExercise[]>([]);
  const [workoutSessionDone, setWorkoutSessionDone] = useState(false);

  // Custom daily stretch/recovery goal toggle
  const [customGoalDone, setCustomGoalDone] = useState(false);

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
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
        const user = JSON.parse(uStr);
        if (user.firstName) setUserName(user.firstName);
        if (user.goal) setUserGoal(user.goal);
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
      const checkin = await AsyncStorage.getItem(`daily_checkin_${todayKey}`);
      setIsCheckedIn(!!checkin);
    } catch (e) {
      console.log('Error checking daily checkin:', e);
    }
  };

  const loadFoodProgress = async () => {
    try {
      const savedLog = await AsyncStorage.getItem('food_log_today');
      if (savedLog) {
        const items: FoodLogItem[] = JSON.parse(savedLog);
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
      } else {
        setCaloriesLogged(0);
        setProteinLogged(0);
        setCarbsLogged(0);
        setFatLogged(0);
      }

      // Load Water
      const waterSaved = await AsyncStorage.getItem('water_log_today');
      if (waterSaved) {
        setWaterMl(parseInt(waterSaved, 10) || 0);
      } else {
        setWaterMl(0);
      }
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
        setWorkoutSessionDone(formatted.length > 0 && formatted.every((e) => e.isCompleted));
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

        const completedThisWeek = sessions.filter((s) => {
          if (!s.completedAt) return false;
          const compDate = new Date(s.completedAt);
          return compDate >= startOfWeek;
        });

        setWorkoutsThisWeek(completedThisWeek.length);
        setCurrentStreak(sessions.length > 0 ? sessions.length : 0);
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
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleQuickAddWater = async (amount: number = 250) => {
    if (waterMl >= targetWater) {
      showToast({
        message: '🏆 Daily Hydration Complete!',
        description: `You've already reached your ${targetWater.toLocaleString()}ml daily target!`,
        type: 'success',
        icon: '🎉',
      });
      return;
    }

    const newTotal = Math.min(targetWater, waterMl + amount);
    setWaterMl(newTotal);

    try {
      await AsyncStorage.setItem('water_log_today', newTotal.toString());
    } catch (e) {
      console.log('Error saving quick water:', e);
    }

    if (newTotal >= targetWater) {
      showToast({
        message: '🏆 Daily Hydration Goal Met!',
        description: `Reached ${targetWater.toLocaleString()} / ${targetWater.toLocaleString()} ml!`,
        type: 'success',
        icon: '🎉',
      });
    } else {
      showToast({
        message: `💧 Logged +${amount}ml Water!`,
        description: `Total today: ${newTotal.toLocaleString()} / ${targetWater.toLocaleString()} ml (${Math.round((newTotal / targetWater) * 100)}%)`,
        type: 'info',
        icon: '💧',
      });
    }
  };

  const handleAddMealFromScan = async (item: FoodLogItem) => {
    try {
      const saved = await AsyncStorage.getItem('food_log_today');
      let arr: FoodLogItem[] = saved ? JSON.parse(saved) : [];
      arr.push(item);
      await AsyncStorage.setItem('food_log_today', JSON.stringify(arr));
      loadFoodProgress();
      showSuccess(`Added ${item.title}`, `${item.calories} kcal logged to ${item.mealType}`);
    } catch (e) {
      console.log('Error adding food from dashboard scan:', e);
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
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 85 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00E5A0"
            colors={['#00E5A0']}
          />
        }
      >
        {/* Header Greeting */}
        <View className="mb-3">
          <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-black">
            {getGreeting()}, {userName} 👋
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark mt-0.5 text-xs font-medium">
            Your live fitness & daily accountability hub
          </Text>
        </View>

        {/* 1-Tap Quick Actions Row */}
        <QuickActionsRow
          onScanFoodPress={() => setShowScanModal(true)}
          onQuickAddWater={() => handleQuickAddWater(250)}
          waterMl={waterMl}
          targetWater={targetWater}
        />

        {/* Motivation-Based Daily Check-In */}
        <DailyCheckInCard
          streakCount={currentStreak}
          onCheckInCompleted={(mood) => {
            setIsCheckedIn(true);
          }}
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
          customGoalDone={customGoalDone}
          onToggleCustomGoal={() => setCustomGoalDone((prev) => !prev)}
        />

        {/* Key Metrics Grid */}
        <View className="flex-row gap-3 mb-3">
          <StatCard
            title="Calories Logged"
            value={`${caloriesLogged.toLocaleString()} kcal`}
            subtitle={`Target: ${targetCalories.toLocaleString()} kcal`}
            icon="🔥"
          />
          <StatCard
            title="Hydration"
            value={`${waterMl.toLocaleString()} ml`}
            subtitle={`Target: ${targetWater.toLocaleString()} ml`}
            icon="💧"
          />
        </View>

        <View className="flex-row gap-3 mb-4">
          <StatCard
            title="Workouts This Week"
            value={`${workoutsThisWeek} / ${targetWorkoutsThisWeek}`}
            subtitle={workoutsThisWeek > 0 ? 'Consistent progress!' : 'Start your first routine'}
            icon="🏋️‍♂️"
          />
          <StatCard
            title="Active Streak"
            value={`${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`}
            subtitle={currentStreak > 0 ? '🔥 Streak active' : 'Complete goals to build'}
            icon="⚡"
          />
        </View>

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
          goalLabel={userGoal === 'MUSCLE_GAIN' ? 'Muscle Gain Goal' : 'Weight Loss Goal'}
        />

        {/* Today's Workout Session Card */}
        <TodayWorkoutCard
          exercises={todayExercises}
          completedSessionsCount={workoutsThisWeek}
          activeMinutes={activeMinutesToday}
        />

        {/* AI Insights & Predictions */}
        <AiInsightsCard
          insights={insights}
          loading={loadingAi}
          onRefresh={refreshAIInsights}
        />
      </ScrollView>

      {/* AI Food Scan Modal (Accessible right from Dashboard) */}
      <AiScanModal
        visible={showScanModal}
        onClose={() => setShowScanModal(false)}
        onAddMealItem={handleAddMealFromScan}
      />
    </SafeAreaView>
  );
}