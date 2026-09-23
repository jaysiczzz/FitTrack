import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompletedSession, formatDateHeading, getTodayDateString } from '../workouts/workoutTypes';
import { DailyFoodHistorySummary, FoodLogItem, getSmartFoodBadge, MEAL_LABELS } from '../foodlog/foodLogTypes';
import { getWorkoutHistory } from '@/api/workout';
import { getFoodLogHistoryApi, ApiDailyFoodLog } from '@/api/foodlog';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import { useThemeColors } from '@/constants/colors';
import SurfaceCard from '../ui/SurfaceCard';

export type CalendarFilterType = 'all' | 'workouts' | 'nutrition';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export interface UnifiedDayData {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  // Workout details
  hasWorkout: boolean;
  workoutSessions: CompletedSession[];
  workoutCalories: number;
  workoutMinutes: number;
  // Nutrition details
  hasNutrition: boolean;
  isNutritionInProgress?: boolean;
  nutritionSummary?: DailyFoodHistorySummary;
  foodCalories: number;
  foodProtein: number;
  foodCarbs: number;
  foodFat: number;
  waterMl: number;
  // Net energy balance
  netCalories: number;
}

interface UnifiedFitnessCalendarProps {
  workoutHistory?: CompletedSession[];
  nutritionHistory?: DailyFoodHistorySummary[];
  initialFilter?: CalendarFilterType;
  selectedDate?: string | null;
  onSelectDate?: (dateStr: string | null) => void;
  onRepeatSession?: (session: CompletedSession) => void;
  onDeleteSession?: (session: CompletedSession) => void;
  onReLogFoodItem?: (item: FoodLogItem) => void;
  onSwitchToTodayWorkout?: () => void;
  onSwitchToTodayNutrition?: () => void;
}

export const UnifiedFitnessCalendar: React.FC<UnifiedFitnessCalendarProps> = ({
  workoutHistory: externalWorkoutHistory,
  nutritionHistory: externalNutritionHistory,
  initialFilter = 'all',
  selectedDate: externalSelectedDate,
  onSelectDate: externalOnSelectDate,
  onRepeatSession,
  onDeleteSession,
  onReLogFoodItem,
  onSwitchToTodayWorkout,
  onSwitchToTodayNutrition,
}) => {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const userId = user?.id;

  const today = new Date();
  const todayStr = getTodayDateString();

  // Internal state
  const [filter, setFilter] = useState<CalendarFilterType>(initialFilter);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11
  const [internalSelectedDate, setInternalSelectedDate] = useState<string | null>(null);
  const [expandedSessionIds, setExpandedSessionIds] = useState<Record<string, boolean>>({});

  // Self-managed data fallbacks if not passed in props
  const [localWorkouts, setLocalWorkouts] = useState<CompletedSession[]>([]);
  const [localNutrition, setLocalNutrition] = useState<DailyFoodHistorySummary[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const activeSelectedDate = externalSelectedDate !== undefined ? externalSelectedDate : internalSelectedDate;
  const handleSelectDate = (dateStr: string | null) => {
    if (externalOnSelectDate) {
      externalOnSelectDate(dateStr);
    } else {
      setInternalSelectedDate(dateStr);
    }
  };

  // Load nutrition & workouts if not provided externally
  useEffect(() => {
    let isMounted = true;
    const loadStandaloneData = async () => {
      if (!userId) return;

      // 1. Load workouts if needed
      if (!externalWorkoutHistory) {
        try {
          const workoutCacheKey = authStorage.getScopedKey(userId, 'fittrack_workout_history_cache');
          const cachedW = await AsyncStorage.getItem(workoutCacheKey);
          if (cachedW && isMounted) {
            try {
              setLocalWorkouts(JSON.parse(cachedW));
            } catch {}
          }
          const res = await getWorkoutHistory();
          if (res.sessions && isMounted) {
            // Format sessions
            const formatted: CompletedSession[] = res.sessions.map((s: any) => ({
              id: s.id,
              date: s.completedAt ? formatDateHeading(s.completedAt.split('T')[0]) : 'Completed',
              dateStr: s.completedAt ? s.completedAt.split('T')[0] : (s.createdAt ? s.createdAt.split('T')[0] : getTodayDateString()),
              completedAt: s.completedAt,
              title: s.title || 'Workout Session',
              duration: `${s.duration || 35} min`,
              durationMinutes: s.duration || 35,
              caloriesBurned: s.caloriesBurned || 240,
              exercisesCount: (s.exercises || []).length,
              totalSetsCount: (s.exercises || []).reduce((acc: number, e: any) => acc + (e.sets?.length || 0), 0),
              exercises: (s.exercises || []).map((e: any) => {
                const setsCount = (e.sets || []).length;
                const firstSet = (e.sets || [])[0];
                let setsSummary = `${setsCount} sets`;
                const isExBodyweight = Boolean(
                  firstSet?.bodyweight ||
                  e.type?.toLowerCase() === 'bodyweight' ||
                  e.type?.toLowerCase() === 'calisthenics' ||
                  e.name?.toLowerCase().includes('pull-up') ||
                  e.name?.toLowerCase().includes('push-up') ||
                  e.name?.toLowerCase().includes('dip')
                );
                if (firstSet) {
                  if (firstSet.weight && Number(firstSet.weight) > 0) {
                    setsSummary = `${setsCount} sets · ${firstSet.weight}kg × ${firstSet.reps || 10} reps`;
                  } else if (isExBodyweight) {
                    setsSummary = `${setsCount} sets · Body Weight × ${firstSet.reps || 10} reps`;
                  } else if (firstSet.reps) {
                    setsSummary = `${setsCount} sets · ${firstSet.reps} reps`;
                  }
                }
                return {
                  id: e.id,
                  exerciseId: e.exerciseId || e.id,
                  name: e.name,
                  category: e.category,
                  setsSummary,
                  sets: e.sets || [],
                };
              }),
            }));
            setLocalWorkouts(formatted);
          }
        } catch (e) {
          console.log('[Unified Calendar] Workout fallback used');
        }
      }

      // 2. Load nutrition if needed
      if (!externalNutritionHistory) {
        try {
          const historyDatesKey = authStorage.getScopedKey(userId, 'food_log_history_dates');
          const rawDates = await AsyncStorage.getItem(historyDatesKey);
          let dateSet = new Set<string>();

          let backendLogs: ApiDailyFoodLog[] = [];
          try {
            const res = await getFoodLogHistoryApi();
            if (res.success && Array.isArray(res.history)) {
              backendLogs = res.history;
              backendLogs.forEach((b) => {
                if (b.date) dateSet.add(b.date);
              });
            }
          } catch {}

          if (rawDates) {
            try {
              const parsed = JSON.parse(rawDates);
              if (Array.isArray(parsed)) {
                parsed.forEach((d) => {
                  if (typeof d === 'string') dateSet.add(d);
                });
              }
            } catch {}
          }

          const summaries: DailyFoodHistorySummary[] = [];
          for (const dateStr of Array.from(dateSet)) {
            const dayFoodKey = authStorage.getScopedKey(userId, `food_log_${dateStr}`);
            const dayWaterKey = authStorage.getScopedKey(userId, `water_log_${dateStr}`);
            const rawItems = await AsyncStorage.getItem(dayFoodKey);
            const rawWater = await AsyncStorage.getItem(dayWaterKey);

            let items: FoodLogItem[] = [];
            if (rawItems) {
              try {
                items = JSON.parse(rawItems);
              } catch {}
            }

            const backendEntry = backendLogs.find((b) => b.date === dateStr);
            if (items.length === 0 && backendEntry && backendEntry.meals) {
              items = backendEntry.meals.map((m) => {
                const b = getSmartFoodBadge(m);
                return {
                  id: m.id,
                  mealType: m.mealType as any,
                  title: m.title,
                  subtitle: m.subtitle || undefined,
                  calories: m.calories,
                  protein: m.protein,
                  carbs: m.carbs,
                  fat: m.fat,
                  goalBadge: b.badge,
                  goalBadgeColor: b.color,
                };
              });
            }

            let waterMl = parseInt(rawWater || '0', 10) || (backendEntry ? backendEntry.waterMl : 0);

            const totalCals = items.reduce((sum, item) => sum + (item.calories || 0), 0);
            const totalProt = items.reduce((sum, item) => sum + (item.protein || 0), 0);
            const totalCarb = items.reduce((sum, item) => sum + (item.carbs || 0), 0);
            const totalFatVal = items.reduce((sum, item) => sum + (item.fat || 0), 0);

            const dayCompletedKey = authStorage.getScopedKey(userId, `food_log_completed_${dateStr}`);
            const rawCompleted = await AsyncStorage.getItem(dayCompletedKey);
            const isCompleted = dateStr === getTodayDateString()
              ? (rawCompleted === 'true' || Boolean(backendEntry?.isCompleted))
              : (rawCompleted === 'true' || (rawCompleted !== 'false' && (backendEntry?.isCompleted ?? true)));

            summaries.push({
              date: dateStr,
              formattedDate: formatDateHeading(dateStr),
              items,
              totalCalories: totalCals,
              totalProtein: totalProt,
              totalCarbs: totalCarb,
              totalFat: totalFatVal,
              waterMl,
              isCompleted,
              completedAt: backendEntry?.completedAt || null,
            });
          }

          if (isMounted) setLocalNutrition(summaries);
        } catch (e) {
          console.log('[Unified Calendar] Nutrition fallback used');
        }
      }
    };

    loadStandaloneData();
    return () => {
      isMounted = false;
    };
  }, [userId, externalWorkoutHistory, externalNutritionHistory]);

  const activeWorkouts = externalWorkoutHistory || localWorkouts;
  const activeNutrition = externalNutritionHistory || localNutrition;

  const isCurrentViewingMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    handleSelectDate(todayStr);
  };

  const toggleSessionExpand = (id: string) => {
    setExpandedSessionIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Build Unified Day Grid
  const calendarDays: UnifiedDayData[] = useMemo(() => {
    const days: UnifiedDayData[] = [];

    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Map workouts by dateStr
    const workoutsMap: Record<string, CompletedSession[]> = {};
    for (const w of activeWorkouts) {
      if (w.dateStr) {
        if (!workoutsMap[w.dateStr]) workoutsMap[w.dateStr] = [];
        workoutsMap[w.dateStr].push(w);
      }
    }

    // Map nutrition by date
    const nutritionMap: Record<string, DailyFoodHistorySummary> = {};
    for (const n of activeNutrition) {
      if (n.date) {
        nutritionMap[n.date] = n;
      }
    }

    const buildDayData = (y: number, m: number, d: number, isCurrent: boolean): UnifiedDayData => {
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const sessions = workoutsMap[dateStr] || [];
      const nutrition = nutritionMap[dateStr];

      const workoutCalories = sessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0);
      const workoutMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      const foodCalories = nutrition?.totalCalories || 0;
      const foodProtein = nutrition?.totalProtein || 0;
      const foodCarbs = nutrition?.totalCarbs || 0;
      const foodFat = nutrition?.totalFat || 0;
      const waterMl = nutrition?.waterMl || 0;

      const hasWorkout = sessions.length > 0;
      const hasNutrition = Boolean(nutrition && nutrition.isCompleted && (nutrition.items.length > 0 || nutrition.waterMl > 0));
      const isNutritionInProgress = Boolean(nutrition && !nutrition.isCompleted && (nutrition.items.length > 0 || nutrition.waterMl > 0));

      return {
        dateStr,
        dayNumber: d,
        isCurrentMonth: isCurrent,
        isToday: dateStr === todayStr,
        isSelected: activeSelectedDate === dateStr,
        hasWorkout,
        workoutSessions: sessions,
        workoutCalories,
        workoutMinutes,
        hasNutrition,
        isNutritionInProgress,
        nutritionSummary: nutrition,
        foodCalories,
        foodProtein,
        foodCarbs,
        foodFat,
        waterMl,
        netCalories: foodCalories - workoutCalories,
      };
    };

    // 1. Leading days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push(buildDayData(prevY, prevM, dayNum, false));
    }

    // 2. Current Month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push(buildDayData(currentYear, currentMonth, d, true));
    }

    // 3. Trailing days
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let nextD = 1; nextD <= remaining; nextD++) {
        const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
        days.push(buildDayData(nextY, nextM, nextD, false));
      }
    }

    return days;
  }, [currentYear, currentMonth, activeWorkouts, activeNutrition, activeSelectedDate, todayStr]);

  // Monthly Overview Analytics
  const currentMonthDays = useMemo(() => calendarDays.filter((d) => d.isCurrentMonth), [calendarDays]);
  const monthDaysCount = currentMonthDays.length || 30;

  const workoutDaysInMonth = useMemo(() => currentMonthDays.filter((d) => d.hasWorkout).length, [currentMonthDays]);
  const totalMonthWorkouts = useMemo(() => currentMonthDays.reduce((acc, d) => acc + d.workoutSessions.length, 0), [currentMonthDays]);
  const totalMonthBurned = useMemo(() => currentMonthDays.reduce((acc, d) => acc + d.workoutCalories, 0), [currentMonthDays]);

  const nutritionDaysInMonth = useMemo(() => currentMonthDays.filter((d) => d.hasNutrition).length, [currentMonthDays]);
  const totalMonthConsumed = useMemo(() => currentMonthDays.reduce((acc, d) => acc + d.foodCalories, 0), [currentMonthDays]);
  const avgDailyCalories = nutritionDaysInMonth > 0 ? Math.round(totalMonthConsumed / nutritionDaysInMonth) : 0;

  const bothActiveDays = useMemo(() => currentMonthDays.filter((d) => d.hasWorkout && d.hasNutrition).length, [currentMonthDays]);
  const anyActiveDays = useMemo(() => currentMonthDays.filter((d) => d.hasWorkout || d.hasNutrition).length, [currentMonthDays]);
  const overallAdherencePercent = Math.round((anyActiveDays / monthDaysCount) * 100);

  // Selected Day Details
  const selectedDayData = useMemo(() => {
    if (!activeSelectedDate) return null;
    return calendarDays.find((d) => d.dateStr === activeSelectedDate) || null;
  }, [activeSelectedDate, calendarDays]);

  return (
    <View className="mb-4">
      <SurfaceCard className="mb-3 p-4">
        {/* 1. Category Filter Segmented Tabs */}
        <View className="flex-row bg-input dark:bg-input-dark p-1 rounded-2xl mb-3 border border-input-border dark:border-input-border-dark">
          <TouchableOpacity
            onPress={() => setFilter('all')}
            activeOpacity={0.8}
            className={`flex-1 py-1.5 rounded-xl items-center flex-row justify-center gap-1.5 ${
              filter === 'all'
                ? 'bg-accent dark:bg-accent-dark'
                : 'bg-transparent'
            }`}
          >
            <Ionicons
              name="sparkles"
              size={12}
              color={filter === 'all' ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              className={`text-xs font-black ${
                filter === 'all' ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'
              }`}
            >
              All Activity
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('workouts')}
            activeOpacity={0.8}
            className={`flex-1 py-1.5 rounded-xl items-center flex-row justify-center gap-1.5 ${
              filter === 'workouts'
                ? 'bg-accent dark:bg-accent-dark'
                : 'bg-transparent'
            }`}
          >
            <Ionicons
              name="barbell"
              size={13}
              color={filter === 'workouts' ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              className={`text-xs font-black ${
                filter === 'workouts' ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'
              }`}
            >
              Workouts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('nutrition')}
            activeOpacity={0.8}
            className={`flex-1 py-1.5 rounded-xl items-center flex-row justify-center gap-1.5 ${
              filter === 'nutrition'
                ? 'bg-amber-500'
                : 'bg-transparent'
            }`}
          >
            <Ionicons
              name="restaurant"
              size={13}
              color={filter === 'nutrition' ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              className={`text-xs font-black ${
                filter === 'nutrition' ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'
              }`}
            >
              Nutrition
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Month Navigation Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-black text-text-primary dark:text-text-primary-dark tracking-tight">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>
            {!isCurrentViewingMonth && (
              <TouchableOpacity
                onPress={handleJumpToToday}
                activeOpacity={0.7}
                className="bg-accent/15 dark:bg-accent-dark/25 px-2 py-0.5 rounded-full border border-accent/30"
              >
                <Text className="text-accent dark:text-accent-dark font-black text-[10px] uppercase">
                  Today
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row items-center gap-1.5">
            <TouchableOpacity
              onPress={handlePrevMonth}
              activeOpacity={0.7}
              accessibilityLabel="Previous Month"
              className="w-8 h-8 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
            >
              <Ionicons name="chevron-back" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNextMonth}
              activeOpacity={0.7}
              accessibilityLabel="Next Month"
              className="w-8 h-8 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
            >
              <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Dynamic Monthly Overview Strip */}
        <View className="bg-input/60 dark:bg-input-dark/60 p-2.5 rounded-2xl mb-3.5 border border-input-border/40 dark:border-input-border-dark/40">
          {filter === 'all' && (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 rounded-full bg-accent dark:bg-accent-dark" />
                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                  {anyActiveDays}/{monthDaysCount} Days Active ({overallAdherencePercent}%)
                </Text>
              </View>
              <Text className="text-[11px] font-bold text-accent dark:text-accent-dark">
                {totalMonthWorkouts} Workouts · {nutritionDaysInMonth} Days Logged
              </Text>
            </View>
          )}

          {filter === 'workouts' && (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 rounded-full bg-accent dark:bg-accent-dark" />
                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                  {workoutDaysInMonth}/{monthDaysCount} Workout Days ({Math.round((workoutDaysInMonth / monthDaysCount) * 100)}%)
                </Text>
              </View>
              <Text className="text-[11px] font-bold text-accent dark:text-accent-dark">
                {totalMonthWorkouts} Sessions · {totalMonthBurned.toLocaleString()} kcal Burned
              </Text>
            </View>
          )}

          {filter === 'nutrition' && (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                  {nutritionDaysInMonth}/{monthDaysCount} Days Logged ({Math.round((nutritionDaysInMonth / monthDaysCount) * 100)}%)
                </Text>
              </View>
              <Text className="text-[11px] font-bold text-amber-500">
                Avg: {avgDailyCalories.toLocaleString()} kcal/day
              </Text>
            </View>
          )}
        </View>

        {/* 4. Weekday Header */}
        <View className="flex-row mb-1 pb-1 border-b border-input-border/40 dark:border-input-border-dark/40">
          {WEEKDAYS.map((wd) => (
            <View key={wd} className="flex-1 items-center py-1">
              <Text className="text-[10px] font-black text-text-muted dark:text-text-muted-dark tracking-wider">
                {wd}
              </Text>
            </View>
          ))}
        </View>

        {/* 5. 7-Column Calendar Grid */}
        <View className="flex-row flex-wrap">
          {calendarDays.map((day) => {
            const isSelected = activeSelectedDate === day.dateStr;

            // Indicator logic based on filter
            const showWorkoutDot = (filter === 'all' || filter === 'workouts') && day.hasWorkout;
            const showNutritionDot = (filter === 'all' || filter === 'nutrition') && day.hasNutrition;
            const showNutritionPendingDot = (filter === 'all' || filter === 'nutrition') && !day.hasNutrition && day.isNutritionInProgress;
            const isFullyActive = day.hasWorkout && day.hasNutrition;

            return (
              <View key={day.dateStr} className="w-[14.28%] p-0.5">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    if (isSelected) {
                      handleSelectDate(null);
                    } else {
                      handleSelectDate(day.dateStr);
                    }
                  }}
                  className={`h-11 items-center justify-center rounded-2xl border ${
                    isSelected
                      ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark shadow-sm'
                      : day.isToday
                      ? 'border-2 border-accent dark:border-accent-dark bg-accent/10 dark:bg-accent-dark/15'
                      : isFullyActive && filter === 'all'
                      ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent/50 dark:border-accent-dark/50'
                      : showWorkoutDot
                      ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent/40 dark:border-accent-dark/40'
                      : showNutritionDot
                      ? 'bg-amber-500/15 border-amber-500/40'
                      : showNutritionPendingDot
                      ? 'bg-amber-500/5 border-dashed border-amber-500/30'
                      : 'bg-input/40 dark:bg-input-dark/40 border-input-border/40 dark:border-input-border-dark/40'
                  } ${!day.isCurrentMonth ? 'opacity-30' : 'opacity-100'}`}
                >
                  {/* Day Number */}
                  <Text
                    className={`text-xs ${
                      isSelected
                        ? 'font-black text-white'
                        : day.isToday
                        ? 'font-black text-accent dark:text-accent-dark'
                        : showWorkoutDot || showNutritionDot
                        ? 'font-black text-text-primary dark:text-text-primary-dark'
                        : showNutritionPendingDot
                        ? 'font-bold text-amber-600 dark:text-amber-400'
                        : 'font-semibold text-text-muted dark:text-text-muted-dark'
                    }`}
                  >
                    {day.dayNumber}
                  </Text>

                  {/* Dual or Single Activity Dots */}
                  <View className="flex-row items-center justify-center gap-0.5 mt-0.5 h-2">
                    {showWorkoutDot && (
                      <View
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-emerald-500'
                        }`}
                      />
                    )}
                    {showNutritionDot && (
                      <View
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-amber-200' : 'bg-amber-500'
                        }`}
                      />
                    )}
                    {showNutritionPendingDot && (
                      <View
                        className={`w-1.5 h-1.5 rounded-full border ${
                          isSelected ? 'border-amber-200' : 'border-amber-500'
                        }`}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* 6. Legend */}
        <View className="flex-row items-center justify-between pt-3 mt-2 border-t border-input-border/40 dark:border-input-border-dark/40">
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-emerald-500" />
              <Text className="text-[10px] text-text-muted dark:text-text-muted-dark font-semibold">
                Workout
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-amber-500" />
              <Text className="text-[10px] text-text-muted dark:text-text-muted-dark font-semibold">
                Meals
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2.5 h-2.5 rounded-sm border-2 border-accent dark:border-accent-dark" />
              <Text className="text-[10px] text-text-muted dark:text-text-muted-dark font-semibold">
                Today
              </Text>
            </View>
          </View>
          <Text className="text-[10px] text-text-muted dark:text-text-muted-dark font-medium">
            Tap date for details
          </Text>
        </View>
      </SurfaceCard>

      {/* 7. Unified Day Inspector */}
      {selectedDayData && (
        <SurfaceCard className="mb-3 p-4 border border-accent/40 bg-accent/5 dark:bg-accent-dark/10">
          {/* Day Header */}
          <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-input-border/50 dark:border-input-border-dark/50">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-accent/15 dark:bg-accent-dark/25 items-center justify-center">
                <Ionicons name="calendar" size={16} color={colors.accent} />
              </View>
              <View>
                <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark">
                  {formatDateHeading(selectedDayData.dateStr)}
                </Text>
                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark font-medium">
                  {selectedDayData.hasWorkout && selectedDayData.hasNutrition
                    ? 'Training + Nutrition Complete'
                    : selectedDayData.hasWorkout
                    ? `${selectedDayData.workoutSessions.length} Workout(s) Logged`
                    : selectedDayData.hasNutrition
                    ? 'Nutrition Day Completed'
                    : selectedDayData.isNutritionInProgress
                    ? 'Meals & Hydration (In Progress)'
                    : 'Rest & Fasting Day'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleSelectDate(null)}
              activeOpacity={0.7}
              className="px-2.5 py-1 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark flex-row items-center gap-1"
            >
              <Ionicons name="close" size={12} color={colors.textMuted} />
              <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark">
                Close
              </Text>
            </TouchableOpacity>
          </View>

          {/* Net Calorie Balance Card (When both food and workout exist, or either) */}
          {(selectedDayData.hasWorkout || selectedDayData.hasNutrition) && (
            <View className="bg-input dark:bg-input-dark p-3 rounded-2xl mb-3 border border-input-border dark:border-input-border-dark">
              <Text className="text-[10px] font-bold uppercase text-text-muted dark:text-text-muted-dark mb-1.5">
                Daily Energy Balance
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="items-center flex-1">
                  <Text className="text-[10px] text-amber-500 font-bold">Consumed</Text>
                  <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark mt-0.5">
                    +{selectedDayData.foodCalories} <Text className="text-[10px] text-text-muted">kcal</Text>
                  </Text>
                </View>

                <Text className="text-xs text-text-muted font-bold">-</Text>

                <View className="items-center flex-1">
                  <Text className="text-[10px] text-emerald-500 font-bold">Burned</Text>
                  <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark mt-0.5">
                    -{selectedDayData.workoutCalories} <Text className="text-[10px] text-text-muted">kcal</Text>
                  </Text>
                </View>

                <Text className="text-xs text-text-muted font-bold">=</Text>

                <View className="items-center flex-1">
                  <Text className="text-[10px] text-accent dark:text-accent-dark font-bold">Net Balance</Text>
                  <Text className="text-sm font-black text-accent dark:text-accent-dark mt-0.5">
                    {selectedDayData.netCalories >= 0 ? `+${selectedDayData.netCalories}` : selectedDayData.netCalories} <Text className="text-[10px] text-text-muted">kcal</Text>
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* SECTION A: WORKOUTS FOR THIS DAY */}
          {(filter === 'all' || filter === 'workouts') && (
            <View className="mb-3">
              <View className="flex-row items-center gap-1.5 mb-2">
                <Ionicons name="barbell" size={14} color="#10B981" />
                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
                  Workout Activity ({selectedDayData.workoutSessions.length})
                </Text>
              </View>

              {selectedDayData.hasWorkout ? (
                selectedDayData.workoutSessions.map((session) => {
                  const isExpanded = Boolean(expandedSessionIds[session.id]);
                  return (
                    <View
                      key={session.id}
                      className="mb-2 p-3 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark"
                    >
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark flex-1 mr-2">
                          {session.title}
                        </Text>
                        {onDeleteSession && (
                          <TouchableOpacity
                            onPress={() => onDeleteSession(session)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            className="w-6 h-6 rounded-lg items-center justify-center bg-red-500/10 dark:bg-red-500/20 active:opacity-70"
                          >
                            <Ionicons name="trash-outline" size={12} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>

                      <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mb-2 font-medium">
                        {session.duration} · {session.caloriesBurned} kcal · {session.exercisesCount} exercises
                      </Text>

                      <TouchableOpacity
                        onPress={() => toggleSessionExpand(session.id)}
                        activeOpacity={0.8}
                        className="flex-row items-center justify-between pt-1.5 border-t border-input-border/40 dark:border-input-border-dark/40"
                      >
                        <Text className="text-[11px] font-bold text-accent dark:text-accent-dark">
                          {isExpanded ? 'Hide Details' : `View ${session.exercises.length} Exercises`}
                        </Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={13}
                          color={colors.accent}
                        />
                      </TouchableOpacity>

                      {isExpanded && (
                        <View className="mt-2 pt-1">
                          {session.exercises.map((ex, i) => (
                            <View
                              key={i}
                              className="flex-row items-center justify-between py-1.5 border-b border-input-border/20 last:border-b-0"
                            >
                              <View className="flex-row items-center flex-1 mr-2">
                                <Ionicons name="checkmark-circle" size={13} color="#10B981" style={{ marginRight: 6 }} />
                                <Text
                                  numberOfLines={1}
                                  className="text-xs font-bold text-text-primary dark:text-text-primary-dark flex-1"
                                >
                                  {ex.name}
                                </Text>
                              </View>
                              <Text className="text-[10px] text-text-muted dark:text-text-muted-dark font-medium">
                                {ex.setsSummary}
                              </Text>
                            </View>
                          ))}

                          {onRepeatSession && (
                            <TouchableOpacity
                              onPress={() => onRepeatSession(session)}
                              activeOpacity={0.8}
                              className="mt-2 py-2 px-3 rounded-xl bg-accent/15 dark:bg-accent-dark/25 border border-accent/40 flex-row items-center justify-center gap-1.5"
                            >
                              <Ionicons name="repeat" size={13} color={colors.accent} />
                              <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                                Repeat Routine in Today's Workout
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View className="p-3 rounded-2xl bg-surface/60 dark:bg-surface-dark/60 border border-input-border/40 items-center">
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark font-medium">
                    No workout logged on this date
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* SECTION B: NUTRITION FOR THIS DAY */}
          {(filter === 'all' || filter === 'nutrition') && (
            <View className="mb-2">
              <View className="flex-row items-center gap-1.5 mb-2">
                <Ionicons name="restaurant" size={14} color="#F59E0B" />
                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
                  Nutrition & Hydration
                </Text>
              </View>

              {selectedDayData.hasNutrition && selectedDayData.nutritionSummary ? (
                <View className="p-3 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark">
                  {/* Macros Row */}
                  <View className="flex-row gap-1.5 mb-2.5">
                    <View className="flex-1 bg-input dark:bg-input-dark p-2 rounded-xl items-center border border-input-border dark:border-input-border-dark">
                      <Text className="text-[9px] text-text-muted font-bold uppercase">Protein</Text>
                      <Text className="text-xs font-black text-emerald-500 mt-0.5">
                        {selectedDayData.foodProtein}g
                      </Text>
                    </View>
                    <View className="flex-1 bg-input dark:bg-input-dark p-2 rounded-xl items-center border border-input-border dark:border-input-border-dark">
                      <Text className="text-[9px] text-text-muted font-bold uppercase">Carbs</Text>
                      <Text className="text-xs font-black text-amber-500 mt-0.5">
                        {selectedDayData.foodCarbs}g
                      </Text>
                    </View>
                    <View className="flex-1 bg-input dark:bg-input-dark p-2 rounded-xl items-center border border-input-border dark:border-input-border-dark">
                      <Text className="text-[9px] text-text-muted font-bold uppercase">Fat</Text>
                      <Text className="text-xs font-black text-purple-400 mt-0.5">
                        {selectedDayData.foodFat}g
                      </Text>
                    </View>
                    <View className="flex-1 bg-input dark:bg-input-dark p-2 rounded-xl items-center border border-input-border dark:border-input-border-dark">
                      <Text className="text-[9px] text-text-muted font-bold uppercase">Water</Text>
                      <Text className="text-xs font-black text-sky-400 mt-0.5">
                        {selectedDayData.waterMl >= 1000 ? `${(selectedDayData.waterMl / 1000).toFixed(1)}L` : `${selectedDayData.waterMl}ml`}
                      </Text>
                    </View>
                  </View>

                  {/* Meals List */}
                  {selectedDayData.nutritionSummary.items.length > 0 && (
                    <View className="border-t border-input-border/40 dark:border-input-border-dark/40 pt-2">
                      <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase mb-1.5">
                        Logged Meals ({selectedDayData.nutritionSummary.items.length})
                      </Text>
                      {selectedDayData.nutritionSummary.items.map((meal) => (
                        <View
                          key={meal.id}
                          className="flex-row items-center justify-between py-1.5 border-b border-input-border/20 last:border-b-0"
                        >
                          <View className="flex-row items-center flex-1 mr-2">
                            <View className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2" />
                            <Text
                              numberOfLines={1}
                              className="text-xs font-bold text-text-primary dark:text-text-primary-dark flex-1"
                            >
                              {meal.title}
                            </Text>
                          </View>
                          <Text className="text-[10px] text-text-muted dark:text-text-muted-dark font-medium">
                            {meal.calories} kcal · {meal.protein}g P
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View className="p-3 rounded-2xl bg-surface/60 dark:bg-surface-dark/60 border border-input-border/40 items-center">
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark font-medium">
                    No meals logged on this date
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Quick Actions if Today */}
          {selectedDayData.isToday && (
            <View className="flex-row gap-2 mt-2 pt-2 border-t border-input-border/50 dark:border-input-border-dark/50">
              {onSwitchToTodayWorkout && (
                <TouchableOpacity
                  onPress={onSwitchToTodayWorkout}
                  activeOpacity={0.8}
                  className="flex-1 bg-accent dark:bg-accent-dark py-2.5 rounded-xl flex-row items-center justify-center gap-1.5"
                >
                  <Ionicons name="barbell" size={14} color="#FFFFFF" />
                  <Text className="text-white font-bold text-xs">
                    Start Workout
                  </Text>
                </TouchableOpacity>
              )}
              {onSwitchToTodayNutrition && (
                <TouchableOpacity
                  onPress={onSwitchToTodayNutrition}
                  activeOpacity={0.8}
                  className="flex-1 bg-amber-500 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5"
                >
                  <Ionicons name="restaurant" size={14} color="#FFFFFF" />
                  <Text className="text-white font-bold text-xs">
                    Log Food
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </SurfaceCard>
      )}
    </View>
  );
};

export default UnifiedFitnessCalendar;
