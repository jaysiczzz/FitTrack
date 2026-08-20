import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { getAIInsights, AIInsight } from '../../api/ai';
import { getTodayWorkoutSession, getWorkoutHistory, ApiWorkoutSession, ApiWorkoutExercise } from '../../api/workout';
import { FoodLogItem } from './foodlog';

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
};

const StatCard = ({ title, value, subtitle }: StatCardProps) => (
  <View className="flex-1 bg-surface dark:bg-surface-dark p-[18px] rounded-[20px] mr-3 border border-input-border dark:border-input-border-dark">
    <Text className="text-text-muted dark:text-text-muted-dark text-xs mb-2.5">{title}</Text>
    <Text className="text-accent dark:text-accent-dark text-xl font-bold">{value}</Text>
    {subtitle ? (
      <Text className="text-text-muted dark:text-text-muted-dark mt-2 text-xs">{subtitle}</Text>
    ) : null}
  </View>
);

type ProgressBarProps = {
  label: string;
  value: string;
  percentage: number;
  color: string;
};

const ProgressBar = ({ label, value, percentage, color }: ProgressBarProps) => {
  const fillWidth = `${Math.min(100, Math.max(0, percentage))}%` as import('react-native').DimensionValue;

  return (
    <View className="mb-3.5">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-text-muted dark:text-text-muted-dark text-xs">{label}</Text>
        <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs">{value}</Text>
      </View>
      <View className="h-2.5 bg-input dark:bg-input-dark rounded-lg overflow-hidden border border-input-border/40">
        <View className="h-2.5 rounded-lg" style={{ width: fillWidth, backgroundColor: color }} />
      </View>
    </View>
  );
};

type BoostCardProps = {
  title: string;
  lines: string[];
};

const BoostCard = ({ title, lines }: BoostCardProps) => (
  <View className="bg-surface dark:bg-surface-dark rounded-[18px] p-4 mb-3 border border-input-border dark:border-input-border-dark">
    <Text className="text-accent dark:text-accent-dark font-semibold mb-2.5 text-[13px]">{title}</Text>
    {lines.map((line, index) => (
      <Text key={index} className="text-text-muted dark:text-text-muted-dark text-[13px] mb-2 leading-5">
        {line}
      </Text>
    ))}
  </View>
);

export default function Dashboard() {
  const [userName, setUserName] = useState('User');
  const [loadingAi, setLoadingAi] = useState(false);

  // Dynamic Food & Nutrition Progress States
  const [caloriesLogged, setCaloriesLogged] = useState(0);
  const [targetCalories] = useState(2000);
  const [proteinLogged, setProteinLogged] = useState(0);
  const [targetProtein] = useState(140);
  const [carbsLogged, setCarbsLogged] = useState(0);
  const [targetCarbs] = useState(230);
  const [fatLogged, setFatLogged] = useState(0);
  const [targetFat] = useState(65);

  // Dynamic Workout Progress States
  const [activeMinutesToday, setActiveMinutesToday] = useState(0);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
  const [targetWorkoutsThisWeek] = useState(5);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayExercises, setTodayExercises] = useState<{ id: string; name: string; isCompleted: boolean }[]>([]);

  // AI Insights State
  const [insights, setInsights] = useState<AIInsight[]>([
    {
      title: 'Workout & Nutrition Correlation',
      lines: [
        'Log your daily meals and workout sessions to generate personalized AI performance insights.',
      ],
    },
    {
      title: 'Meal Timing',
      lines: [
        'Consuming protein within 45 minutes after your workout accelerates muscle recovery.',
      ],
    },
  ]);

  const loadUserData = async () => {
    try {
      const uStr = await AsyncStorage.getItem('user');
      if (uStr) {
        const user = JSON.parse(uStr);
        if (user.firstName) setUserName(user.firstName);
      }
    } catch (err) {
      console.log('Error loading cached user:', err);
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
          // Extract calories from subtitle e.g. "(380 kcal)"
          if (item.subtitle) {
            const calMatch = item.subtitle.match(/(\d+)\s*kcal/i);
            if (calMatch) totalCals += parseInt(calMatch[1], 10);
          }

          // Extract macros e.g. ["18g Protein", "32g Carbs", "8g Fat"]
          if (item.macros && Array.isArray(item.macros)) {
            item.macros.forEach((m) => {
              const pMatch = m.match(/(\d+)g\s*Protein/i);
              if (pMatch) totalProt += parseInt(pMatch[1], 10);

              const cMatch = m.match(/(\d+)g\s*Carbs/i);
              if (cMatch) totalCarbs += parseInt(cMatch[1], 10);

              const fMatch = m.match(/(\d+)g\s*Fat/i);
              if (fMatch) totalFat += parseInt(fMatch[1], 10);
            });
          }
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
    } catch (err) {
      console.log('Error calculating food progress:', err);
    }
  };

  const loadWorkoutProgress = async () => {
    try {
      // 1. Fetch today's active session exercises
      const todayRes = await getTodayWorkoutSession();
      if (todayRes.session && todayRes.session.exercises) {
        const formatted = todayRes.session.exercises.map((ex: ApiWorkoutExercise) => {
          const allSetsDone = ex.sets && ex.sets.length > 0 && ex.sets.every((s) => s.done);
          return {
            id: ex.id,
            name: ex.name,
            isCompleted: allSetsDone,
          };
        });
        setTodayExercises(formatted);

        // Estimate active minutes from completed sets today
        const completedSetsCount = todayRes.session.exercises.reduce(
          (acc: number, ex: ApiWorkoutExercise) =>
            acc + (ex.sets ? ex.sets.filter((s) => s.done).length : 0),
          0
        );
        setActiveMinutesToday(completedSetsCount * 5); // ~5 min per completed set
      } else {
        setTodayExercises([]);
        setActiveMinutesToday(0);
      }

      // 2. Fetch completed workout history for streak and weekly count
      const historyRes = await getWorkoutHistory();
      if (historyRes.sessions) {
        const sessions: ApiWorkoutSession[] = historyRes.sessions;
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start of week

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

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      loadFoodProgress();
      loadWorkoutProgress();
    }, [])
  );

  const refreshAIInsights = async () => {
    setLoadingAi(true);
    try {
      const res = await getAIInsights();
      if (res.success && res.insights?.length) {
        setInsights(res.insights);
      }
    } catch (err) {
      console.log('Using default insights:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Nutrition progress ratios
  const caloriePercent = Math.min(100, Math.round((caloriesLogged / targetCalories) * 100));
  const proteinPercent = Math.min(100, Math.round((proteinLogged / targetProtein) * 100));
  const carbsPercent = Math.min(100, Math.round((carbsLogged / targetCarbs) * 100));
  const fatPercent = Math.min(100, Math.round((fatLogged / targetFat) * 100));

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-20">
        {/* Header Greeting */}
        <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-bold mt-2">
          Good morning, {userName} 👋
        </Text>
        <Text className="text-text-muted dark:text-text-muted-dark mt-1 mb-4 text-sm">
          Here's your live progress on foods & workouts today
        </Text>

        {/* Top Metric Cards */}
        <View className="flex-row justify-between mt-1">
          <StatCard
            title="Calories Today"
            value={`${caloriesLogged.toLocaleString()} / ${targetCalories.toLocaleString()}`}
            subtitle={caloriesLogged > 0 ? `↑ ${caloriePercent}% of daily goal` : 'No meals logged yet'}
          />
          <StatCard
            title="Active Minutes"
            value={`${activeMinutesToday} min`}
            subtitle={activeMinutesToday > 0 ? 'Logged from today\'s workout' : 'No active minutes yet'}
          />
        </View>

        <View className="flex-row justify-between mt-3">
          <StatCard
            title="Workouts This Week"
            value={`${workoutsThisWeek} / ${targetWorkoutsThisWeek}`}
            subtitle={workoutsThisWeek > 0 ? 'Keep pushing!' : 'Start your first session'}
          />
          <StatCard
            title="Current Streak"
            value={`${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`}
            subtitle={currentStreak > 0 ? 'Workout streak active!' : 'Complete workouts to build streak'}
          />
        </View>

        {/* Dynamic Daily Nutrition Progress Bar Section */}
        <View className="bg-surface dark:bg-surface-dark rounded-[20px] p-[18px] mt-[18px] border border-input-border dark:border-input-border-dark">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold mb-3.5 text-base">
            Daily Nutrition Progress
          </Text>
          <View className="flex-row items-center">
            <View className="w-[104px] h-[104px] rounded-full bg-input dark:bg-input-dark items-center justify-center mr-[18px] border-2 border-accent/40 dark:border-accent-dark/40 shadow-xs">
              <Text className="text-accent dark:text-accent-dark text-center font-black text-xl leading-6">
                {caloriePercent}%
              </Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-center font-bold text-[10px] uppercase tracking-wider">
                Complete
              </Text>
            </View>
            <View className="flex-1">
              <ProgressBar
                label="Protein"
                value={`${proteinLogged}g / ${targetProtein}g`}
                percentage={proteinPercent}
                color="#00E5A0"
              />
              <ProgressBar
                label="Carbs"
                value={`${carbsLogged}g / ${targetCarbs}g`}
                percentage={carbsPercent}
                color="#4BB4FF"
              />
              <ProgressBar
                label="Fats"
                value={`${fatLogged}g / ${targetFat}g`}
                percentage={fatPercent}
                color="#A16BFF"
              />
            </View>
          </View>
        </View>

        {/* AI Insights Section */}
        <View className="flex-row justify-between items-center mt-[22px] mb-3">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-base">
            AI Insights & Predictions ✨
          </Text>
          <TouchableOpacity
            onPress={refreshAIInsights}
            disabled={loadingAi}
            className="bg-input dark:bg-input-dark px-3 py-1 rounded-lg border border-input-border dark:border-input-border-dark"
          >
            {loadingAi ? (
              <ActivityIndicator size="small" color="#00E5A0" />
            ) : (
              <Text className="text-accent dark:text-accent-dark text-xs font-semibold">
                Refresh AI
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View>
          {insights.map((item, index) => (
            <BoostCard key={index} title={item.title} lines={item.lines} />
          ))}
        </View>

        {/* Dynamic Today's Workout Goals Checklist Section */}
        <Text className="text-text-primary dark:text-text-primary-dark mt-[22px] mb-3 font-bold text-base">
          Today's Workout Goals 🏋️‍♂️
        </Text>
        <View className="bg-surface dark:bg-surface-dark rounded-[20px] p-[18px] border border-input-border dark:border-input-border-dark">
          <View className="mb-[14px]">
            <Text className="text-accent dark:text-accent-dark text-[11px] font-extrabold mb-1 tracking-wider uppercase">
              DAILY MOTIVATION
            </Text>
            <Text className="text-text-primary dark:text-text-primary-dark text-sm font-semibold leading-5">
              “The only bad workout is the one that didn't happen.”
            </Text>
          </View>

          <View className="mt-2 border-t border-input-border/40 dark:border-input-border-dark/40 pt-3">
            <Text className="text-text-primary dark:text-text-primary-dark font-bold mb-3 text-[14px]">
              Active Workout Checklist ({todayExercises.filter((e) => e.isCompleted).length} / {todayExercises.length})
            </Text>

            {todayExercises.length === 0 ? (
              <View className="py-3 items-center">
                <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center">
                  No exercises added to today's session yet.
                </Text>
                <Text className="text-accent dark:text-accent-dark text-xs font-bold mt-1">
                  Go to Workouts tab to add exercises!
                </Text>
              </View>
            ) : (
              todayExercises.map((ex) => (
                <View key={ex.id} className="flex-row items-center mb-2.5">
                  <Text className={`mr-2.5 text-sm ${ex.isCompleted ? 'text-accent dark:text-accent-dark font-bold' : 'text-text-muted dark:text-text-muted-dark'}`}>
                    {ex.isCompleted ? '✔︎' : '○'}
                  </Text>
                  <Text className={`text-[13px] leading-5 flex-1 ${ex.isCompleted ? 'line-through text-text-muted dark:text-text-muted-dark' : 'text-text-primary dark:text-text-primary-dark font-medium'}`}>
                    {ex.name}
                  </Text>
                  <Text className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${ex.isCompleted ? 'bg-accent/15 text-accent dark:text-accent-dark' : 'bg-input text-text-muted'}`}>
                    {ex.isCompleted ? 'Completed' : 'In Progress'}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}