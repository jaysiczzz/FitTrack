import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/constants/colors';
import SurfaceCard from '../ui/SurfaceCard';
import { getFoodLogHistoryApi, ApiDailyFoodLog } from '@/api/foodlog';
import { getWorkoutHistory, ApiWorkoutSession } from '@/api/workout';
import { formatDateKey } from '@/utils/streakUtils';

export interface DayWeeklyData {
  dateKey: string;
  dayShort: string;
  dayNumber: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  workoutMinutes: number;
  workoutCalories: number;
  workoutSessionDone: boolean;
  workoutSessionsCount: number;
  isToday: boolean;
  hasNutritionData: boolean;
  hasWorkoutData: boolean;
}

export interface WeeklyNutritionChartCardProps {
  currentDayCalories: number;
  currentDayProtein: number;
  currentDayCarbs: number;
  currentDayFat: number;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  activeMinutesToday?: number;
  workoutSessionDone?: boolean;
  todayCompletedWorkoutStats?: { duration: number; caloriesBurned: number } | null;
  targetWorkoutMinutes?: number;
}

export default function WeeklyNutritionChartCard({
  currentDayCalories,
  currentDayProtein,
  currentDayCarbs,
  currentDayFat,
  targetCalories = 2400,
  targetProtein = 160,
  targetCarbs = 260,
  targetFat = 75,
  activeMinutesToday = 0,
  workoutSessionDone = false,
  todayCompletedWorkoutStats = null,
  targetWorkoutMinutes = 45,
}: WeeklyNutritionChartCardProps) {
  const { colors } = useThemeColors();
  const router = useRouter();

  const [chartMode, setChartMode] = useState<'nutrition' | 'workouts'>('nutrition');
  const [historyLogs, setHistoryLogs] = useState<ApiDailyFoodLog[]>([]);
  const [historyWorkouts, setHistoryWorkouts] = useState<ApiWorkoutSession[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Defaults to today (last item)

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const [foodRes, workoutRes] = await Promise.all([
          getFoodLogHistoryApi().catch(() => null),
          getWorkoutHistory().catch(() => null),
        ]);
        if (isMounted && foodRes?.success && Array.isArray(foodRes.history)) {
          setHistoryLogs(foodRes.history);
        }
        if (isMounted && workoutRes?.sessions && Array.isArray(workoutRes.sessions)) {
          setHistoryWorkouts(workoutRes.sessions);
        }
      } catch {
        // Offline or not yet logged
      }
    };
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [currentDayCalories, activeMinutesToday, workoutSessionDone]);

  // Helper to extract YYYY-MM-DD from session
  const getSessionDateKey = (s: ApiWorkoutSession): string => {
    const timestamp = s.completedAt || (s.completed ? s.createdAt : null);
    if (!timestamp) return '';
    if (typeof timestamp === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(timestamp)) {
      return timestamp;
    }
    const d = new Date(timestamp);
    return formatDateKey(d);
  };

  // Construct 7 consecutive days ending today
  const weeklyDays = useMemo<DayWeeklyData[]>(() => {
    const days: DayWeeklyData[] = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateNum = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${dateNum}`;
      const isToday = i === 0;

      // Nutrition matching
      let cals = 0;
      let p = 0;
      let c = 0;
      let f = 0;
      let hasNutr = false;

      if (isToday) {
        cals = currentDayCalories;
        p = currentDayProtein;
        c = currentDayCarbs;
        f = currentDayFat;
        hasNutr = currentDayCalories > 0;
      } else {
        const foundFood = historyLogs.find((h) => h.date === dateKey);
        cals = foundFood ? foundFood.totalCalories : 0;
        p = foundFood ? foundFood.totalProtein : 0;
        c = foundFood ? foundFood.totalCarbs : 0;
        f = foundFood ? foundFood.totalFat : 0;
        hasNutr = cals > 0;
      }

      // Workout matching
      let wMins = 0;
      let wCals = 0;
      let wDone = false;
      let wSessionsCount = 0;
      let hasWork = false;

      const daySessions = historyWorkouts.filter((s) => getSessionDateKey(s) === dateKey);

      if (isToday) {
        if (workoutSessionDone) {
          wMins = todayCompletedWorkoutStats?.duration || 35;
          wCals = todayCompletedWorkoutStats?.caloriesBurned || 240;
          wDone = true;
          wSessionsCount = Math.max(1, daySessions.length);
          hasWork = true;
        } else if (daySessions.length > 0 && daySessions.some((s) => s.completed || Boolean(s.completedAt))) {
          wMins = daySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
          wCals = daySessions.reduce((acc, s) => acc + (s.caloriesBurned || 0), 0);
          wDone = true;
          wSessionsCount = daySessions.length;
          hasWork = true;
        } else {
          wMins = activeMinutesToday;
          wCals = activeMinutesToday > 0 ? Math.round(activeMinutesToday * 6) : 0;
          wDone = false;
          wSessionsCount = activeMinutesToday > 0 ? 1 : 0;
          hasWork = activeMinutesToday > 0;
        }
      } else {
        const completedSessions = daySessions.filter((s) => s.completed || Boolean(s.completedAt));
        wMins = daySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
        wCals = daySessions.reduce((acc, s) => acc + (s.caloriesBurned || 0), 0);
        wDone = completedSessions.length > 0;
        wSessionsCount = daySessions.length;
        hasWork = wMins > 0 || wDone;
      }

      days.push({
        dateKey,
        dayShort: isToday ? 'Today' : dayNames[d.getDay()],
        dayNumber: d.getDate(),
        calories: cals,
        protein: p,
        carbs: c,
        fat: f,
        workoutMinutes: wMins,
        workoutCalories: wCals,
        workoutSessionDone: wDone,
        workoutSessionsCount: wSessionsCount,
        isToday,
        hasNutritionData: hasNutr,
        hasWorkoutData: hasWork,
      });
    }
    return days;
  }, [
    historyLogs,
    historyWorkouts,
    currentDayCalories,
    currentDayProtein,
    currentDayCarbs,
    currentDayFat,
    activeMinutesToday,
    workoutSessionDone,
    todayCompletedWorkoutStats,
  ]);

  const selectedDay = weeklyDays[selectedDayIndex] || weeklyDays[weeklyDays.length - 1];

  // Nutrition statistics
  const loggedFoodDays = weeklyDays.filter((d) => d.hasNutritionData);
  const totalCalsWeekly = loggedFoodDays.reduce((acc, d) => acc + d.calories, 0);
  const avgCals = loggedFoodDays.length > 0 ? Math.round(totalCalsWeekly / loggedFoodDays.length) : 0;
  const maxCalorieScale = Math.max(targetCalories * 1.25, ...weeklyDays.map((d) => d.calories), 2600);

  // Workout statistics
  const totalWorkoutMinutesWeekly = weeklyDays.reduce((acc, d) => acc + d.workoutMinutes, 0);
  const completedWorkoutsWeekly = weeklyDays.filter((d) => d.workoutSessionDone).length;
  const maxWorkoutScale = Math.max(targetWorkoutMinutes * 1.25, ...weeklyDays.map((d) => d.workoutMinutes), 60);

  const chartHeight = 90; // Height in px for the bar container

  return (
    <SurfaceCard className="mb-3 p-4">
      {/* Segmented Mode Switcher */}
      <View className="flex-row bg-input/40 dark:bg-input-dark/40 p-1 rounded-xl mb-3 border border-input-border/30 dark:border-input-border-dark/30">
        <TouchableOpacity
          onPress={() => setChartMode('nutrition')}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityLabel="Nutrition chart view"
          className={`flex-1 py-1.5 rounded-lg flex-row items-center justify-center ${
            chartMode === 'nutrition'
              ? 'bg-surface dark:bg-surface-dark shadow-xs'
              : ''
          }`}
        >
          <Text
            className={`text-xs ${
              chartMode === 'nutrition'
                ? 'text-text-primary dark:text-text-primary-dark font-extrabold'
                : 'text-text-muted dark:text-text-muted-dark font-medium'
            }`}
          >
            Nutrition (kcal)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setChartMode('workouts')}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityLabel="Workout chart view"
          className={`flex-1 py-1.5 rounded-lg flex-row items-center justify-center ${
            chartMode === 'workouts'
              ? 'bg-surface dark:bg-surface-dark shadow-xs'
              : ''
          }`}
        >
          <Text
            className={`text-xs ${
              chartMode === 'workouts'
                ? 'text-text-primary dark:text-text-primary-dark font-extrabold'
                : 'text-text-muted dark:text-text-muted-dark font-medium'
            }`}
          >
            Workouts (min)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Header with Title and Navigation Link */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-extrabold text-text-primary dark:text-text-primary-dark">
          {chartMode === 'nutrition' ? '7-Day Nutrition' : '7-Day Workouts'}
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push(chartMode === 'nutrition' ? ('/(screen)/foodlog' as any) : ('/(screen)/workouts' as any))
          }
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={chartMode === 'nutrition' ? 'View food history' : 'View workout log'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="px-3 py-2 rounded-xl bg-accent/10 dark:bg-accent-dark/15 border border-accent/30 dark:border-accent-dark/30 flex-row items-center justify-center"
        >
          <Text className="text-[11px] font-bold text-accent dark:text-accent-dark">
            {chartMode === 'nutrition' ? 'Food History →' : 'Workout Log →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Target Benchmark Line Indicator Row */}
      {chartMode === 'nutrition' ? (
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[10px] font-semibold text-text-muted dark:text-text-muted-dark">
            Daily Target: {targetCalories.toLocaleString()} kcal
          </Text>
          <Text className="text-[10px] font-bold text-text-primary dark:text-text-primary-dark">
            Avg: {avgCals.toLocaleString()} kcal/day
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[10px] font-semibold text-text-muted dark:text-text-muted-dark">
            Daily Target: {targetWorkoutMinutes} min
          </Text>
          <Text className="text-[10px] font-bold text-text-primary dark:text-text-primary-dark">
            Total: {totalWorkoutMinutesWeekly} min · {completedWorkoutsWeekly} done
          </Text>
        </View>
      )}

      {/* 7-Day Bar Chart */}
      <View className="bg-input/30 dark:bg-input-dark/30 rounded-2xl p-3 border border-input-border/50 dark:border-input-border-dark/50 mb-3">
        {/* Relative chart viewport with target reference dotted line */}
        <View style={{ height: chartHeight }} className="flex-row items-end justify-between relative px-1">
          {/* Target line across chart */}
          {chartMode === 'nutrition' ? (
            <View
              style={{
                bottom: `${Math.round((targetCalories / maxCalorieScale) * 100)}%`,
              }}
              className="absolute left-0 right-0 border-b border-dashed border-accent/40 z-0 pointer-events-none"
            />
          ) : (
            <View
              style={{
                bottom: `${Math.round((targetWorkoutMinutes / maxWorkoutScale) * 100)}%`,
              }}
              className="absolute left-0 right-0 border-b border-dashed border-emerald-500/50 z-0 pointer-events-none"
            />
          )}

          {weeklyDays.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;

            if (chartMode === 'nutrition') {
              const barHeightPct = Math.min(
                100,
                Math.max(4, Math.round((day.calories / maxCalorieScale) * 100))
              );
              const isOverTarget = day.calories > targetCalories * 1.15;
              const isNearTarget = day.calories >= targetCalories * 0.85 && !isOverTarget;

              let barColor: string = colors.accent;
              if (!day.hasNutritionData) {
                barColor = colors.inputBorder || '#E5E7EB';
              } else if (isOverTarget) {
                barColor = '#F59E0B'; // Warm amber warning
              } else if (isNearTarget) {
                barColor = '#10B981'; // Emerald target reached
              }

              return (
                <TouchableOpacity
                  key={`nutr-${day.dateKey}`}
                  onPress={() => setSelectedDayIndex(idx)}
                  activeOpacity={0.8}
                  className="flex-1 items-center justify-end h-full z-10 px-0.5"
                >
                  <View
                    style={{
                      height: `${barHeightPct}%`,
                      backgroundColor: barColor,
                      opacity: day.hasNutritionData ? 1 : 0.4,
                    }}
                    className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                      isSelected
                        ? 'border-2 border-text-primary dark:border-text-primary-dark shadow-sm'
                        : ''
                    }`}
                  />
                </TouchableOpacity>
              );
            } else {
              // Workout bar mode
              const barHeightPct = Math.min(
                100,
                Math.max(4, Math.round((day.workoutMinutes / maxWorkoutScale) * 100))
              );

              let barColor: string = colors.inputBorder || '#E5E7EB';
              if (day.workoutSessionDone) {
                barColor = '#10B981'; // Emerald completed
              } else if (day.workoutMinutes > 0) {
                barColor = colors.accent; // In-progress / active
              }

              return (
                <TouchableOpacity
                  key={`work-${day.dateKey}`}
                  onPress={() => setSelectedDayIndex(idx)}
                  activeOpacity={0.8}
                  className="flex-1 items-center justify-end h-full z-10 px-0.5"
                >
                  <View
                    style={{
                      height: `${barHeightPct}%`,
                      backgroundColor: barColor,
                      opacity: day.hasWorkoutData ? 1 : 0.35,
                    }}
                    className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                      isSelected
                        ? 'border-2 border-text-primary dark:border-text-primary-dark shadow-sm'
                        : ''
                    }`}
                  />
                </TouchableOpacity>
              );
            }
          })}
        </View>

        {/* Day X-Axis Labels */}
        <View className="flex-row justify-between items-center mt-2 px-1 border-t border-input-border/40 dark:border-input-border-dark/40 pt-1.5">
          {weeklyDays.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            return (
              <TouchableOpacity
                key={`label-${day.dateKey}`}
                onPress={() => setSelectedDayIndex(idx)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${day.dayShort} ${day.dayNumber}`}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                className="flex-1 items-center py-1 min-h-[38px] justify-center"
              >
                <Text
                  className={`text-[10px] font-bold ${
                    isSelected
                      ? 'text-accent dark:text-accent-dark font-black'
                      : day.isToday
                      ? 'text-text-primary dark:text-text-primary-dark font-black'
                      : 'text-text-muted dark:text-text-muted-dark'
                  }`}
                  numberOfLines={1}
                >
                  {day.dayShort}
                </Text>
                <Text
                  className={`text-[8.5px] ${
                    isSelected
                      ? 'text-accent dark:text-accent-dark font-bold'
                      : 'text-text-muted dark:text-text-muted-dark'
                  }`}
                >
                  {day.dayNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected Day Inspector Callout */}
      {selectedDay && (
        <View className="p-3 rounded-xl bg-input/60 dark:bg-input-dark/60 border border-input-border dark:border-input-border-dark">
          {chartMode === 'nutrition' ? (
            <>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <View
                    className={`w-2 h-2 rounded-full ${
                      selectedDay.hasNutritionData
                        ? selectedDay.calories >= targetCalories * 0.85
                          ? 'bg-accent dark:bg-accent-dark'
                          : 'bg-accent/70 dark:bg-accent-dark/70'
                        : 'bg-input-border dark:bg-input-border-dark'
                    }`}
                  />
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {selectedDay.isToday ? 'Today' : selectedDay.dateKey}
                  </Text>
                </View>

                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                  {selectedDay.calories.toLocaleString()} kcal
                  {selectedDay.calories > 0 && (
                    <Text className="text-[10px] font-normal text-text-muted dark:text-text-muted-dark">
                      {' '}
                      ({Math.round((selectedDay.calories / targetCalories) * 100)}%)
                    </Text>
                  )}
                </Text>
              </View>

              {/* Macro Breakdown Chips */}
              <View className="flex-row gap-2">
                <View className="flex-1 bg-input/60 dark:bg-input-dark/60 py-1.5 px-2 rounded-lg items-center">
                  <Text className="text-[9px] font-bold text-accent dark:text-accent-dark uppercase">Protein</Text>
                  <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark mt-0.5">
                    {selectedDay.protein}g
                  </Text>
                </View>

                <View className="flex-1 bg-input/60 dark:bg-input-dark/60 py-1.5 px-2 rounded-lg items-center">
                  <Text className="text-[9px] font-bold text-info dark:text-info-dark uppercase">Carbs</Text>
                  <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark mt-0.5">
                    {selectedDay.carbs}g
                  </Text>
                </View>

                <View className="flex-1 bg-input/60 dark:bg-input-dark/60 py-1.5 px-2 rounded-lg items-center">
                  <Text className="text-[9px] font-bold text-purple-500 dark:text-purple-400 uppercase">Fats</Text>
                  <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark mt-0.5">
                    {selectedDay.fat}g
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Workout Inspector Callout */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <View
                    className={`w-2 h-2 rounded-full ${
                      selectedDay.workoutSessionDone
                        ? 'bg-emerald-500'
                        : selectedDay.workoutMinutes > 0
                        ? 'bg-accent dark:bg-accent-dark'
                        : 'bg-input-border dark:bg-input-border-dark'
                    }`}
                  />
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {selectedDay.isToday ? 'Today' : selectedDay.dateKey}
                  </Text>
                </View>

                {selectedDay.workoutSessionDone ? (
                  <View className="flex-row items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <Ionicons name="checkmark-circle" size={11} color="#10B981" />
                    <Text className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                      Completed
                    </Text>
                  </View>
                ) : selectedDay.workoutMinutes > 0 ? (
                  <View className="flex-row items-center gap-1 bg-accent/10 dark:bg-accent-dark/10 px-2 py-0.5 rounded-full border border-accent/30 dark:border-accent-dark/30">
                    <Ionicons name="time" size={11} color={colors.accent} />
                    <Text className="text-[10px] font-extrabold text-accent dark:text-accent-dark">
                      In Progress
                    </Text>
                  </View>
                ) : (
                  <Text className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark">
                    Rest Day
                  </Text>
                )}
              </View>

              {/* Workout Details Chips */}
              <View className="flex-row gap-2">
                <View className="flex-1 bg-input/60 dark:bg-input-dark/60 py-1.5 px-2 rounded-lg items-center">
                  <Text className="text-[9px] font-bold text-emerald-500 uppercase">Duration</Text>
                  <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark mt-0.5">
                    {selectedDay.workoutMinutes} min
                  </Text>
                </View>

                <View className="flex-1 bg-input/60 dark:bg-input-dark/60 py-1.5 px-2 rounded-lg items-center">
                  <Text className="text-[9px] font-bold text-amber-500 uppercase">Burned</Text>
                  <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark mt-0.5">
                    {selectedDay.workoutCalories} kcal
                  </Text>
                </View>

                <View className="flex-1 bg-input/60 dark:bg-input-dark/60 py-1.5 px-2 rounded-lg items-center">
                  <Text className="text-[9px] font-bold text-accent dark:text-accent-dark uppercase">Status</Text>
                  <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark mt-0.5">
                    {selectedDay.workoutSessionDone
                      ? 'Done ✓'
                      : selectedDay.workoutMinutes > 0
                      ? 'Active'
                      : 'Rest'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      )}
    </SurfaceCard>
  );
}
