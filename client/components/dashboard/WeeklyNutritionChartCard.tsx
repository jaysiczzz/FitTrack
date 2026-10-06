import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/constants/colors';
import SurfaceCard from '../ui/SurfaceCard';
import { getFoodLogHistoryApi, ApiDailyFoodLog } from '@/api/foodlog';

interface DayNutritionData {
  dateKey: string;
  dayShort: string;
  dayNumber: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isToday: boolean;
  hasData: boolean;
}

interface WeeklyNutritionChartCardProps {
  currentDayCalories: number;
  currentDayProtein: number;
  currentDayCarbs: number;
  currentDayFat: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
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
}: WeeklyNutritionChartCardProps) {
  const { colors } = useThemeColors();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<ApiDailyFoodLog[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Defaults to today (last item)

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await getFoodLogHistoryApi();
        if (isMounted && res.success && Array.isArray(res.history)) {
          setHistoryLogs(res.history);
        }
      } catch {
        // Offline or not yet logged
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [currentDayCalories]);

  // Construct 7 consecutive days ending today
  const weeklyDays = useMemo<DayNutritionData[]>(() => {
    const days: DayNutritionData[] = [];
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

      if (isToday) {
        days.push({
          dateKey,
          dayShort: 'Today',
          dayNumber: d.getDate(),
          calories: currentDayCalories,
          protein: currentDayProtein,
          carbs: currentDayCarbs,
          fat: currentDayFat,
          isToday: true,
          hasData: currentDayCalories > 0,
        });
      } else {
        const found = historyLogs.find((h) => h.date === dateKey);
        const cals = found ? found.totalCalories : 0;
        const p = found ? found.totalProtein : 0;
        const c = found ? found.totalCarbs : 0;
        const f = found ? found.totalFat : 0;

        days.push({
          dateKey,
          dayShort: dayNames[d.getDay()],
          dayNumber: d.getDate(),
          calories: cals,
          protein: p,
          carbs: c,
          fat: f,
          isToday: false,
          hasData: cals > 0,
        });
      }
    }
    return days;
  }, [historyLogs, currentDayCalories, currentDayProtein, currentDayCarbs, currentDayFat]);

  const selectedDay = weeklyDays[selectedDayIndex] || weeklyDays[weeklyDays.length - 1];

  // Calculate 7-day intake statistics
  const loggedDays = weeklyDays.filter((d) => d.hasData);
  const totalCalsWeekly = loggedDays.reduce((acc, d) => acc + d.calories, 0);
  const avgCals = loggedDays.length > 0 ? Math.round(totalCalsWeekly / loggedDays.length) : 0;
  const onTargetDays = weeklyDays.filter(
    (d) => d.hasData && d.calories >= targetCalories * 0.85 && d.calories <= targetCalories * 1.15
  ).length;

  const maxCalorieScale = Math.max(targetCalories * 1.25, ...weeklyDays.map((d) => d.calories), 2600);
  const chartHeight = 90; // Height in px for the bar container

  return (
    <SurfaceCard className="mb-3 p-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1 pr-2">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="stats-chart" size={15} color={colors.accent} />
            <Text className="text-sm font-extrabold text-text-primary dark:text-text-primary-dark">
              7-Day Calorie & Macro Trends
            </Text>
          </View>
          <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
            Weekly consistency vs {targetCalories.toLocaleString()} kcal target
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(screen)/foodlog' as any)}
          activeOpacity={0.8}
          className="px-2.5 py-1.5 rounded-xl bg-accent/10 dark:bg-accent-dark/15 border border-accent/30 dark:border-accent-dark/30 min-h-[32px] justify-center items-center"
        >
          <Text className="text-xs font-bold text-accent dark:text-accent-dark">
            Food History →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Target Benchmark Line Indicator */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-1.5">
          <View className="w-2.5 h-0.5 bg-accent/60 dark:bg-accent-dark/60 rounded" />
          <Text className="text-[10px] font-semibold text-text-muted dark:text-text-muted-dark">
            Daily Goal ({targetCalories.toLocaleString()} kcal)
          </Text>
        </View>
        <Text className="text-[10px] font-bold text-text-primary dark:text-text-primary-dark">
          Avg: {avgCals.toLocaleString()} kcal/day
        </Text>
      </View>

      {/* 7-Day Bar Chart */}
      <View className="bg-input/30 dark:bg-input-dark/30 rounded-2xl p-3 border border-input-border/50 dark:border-input-border-dark/50 mb-3">
        {/* Relative chart viewport with target reference dotted line */}
        <View style={{ height: chartHeight }} className="flex-row items-end justify-between relative px-1">
          {/* Target line across chart */}
          <View
            style={{
              bottom: `${Math.round((targetCalories / maxCalorieScale) * 100)}%`,
            }}
            className="absolute left-0 right-0 border-b border-dashed border-accent/40 z-0 pointer-events-none"
          />

          {weeklyDays.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            const barHeightPct = Math.min(100, Math.max(4, Math.round((day.calories / maxCalorieScale) * 100)));
            const isOverTarget = day.calories > targetCalories * 1.15;
            const isNearTarget = day.calories >= targetCalories * 0.85 && !isOverTarget;

            // Bar background color
            let barColor: string = colors.accent;
            if (!day.hasData) {
              barColor = colors.inputBorder || '#E5E7EB';
            } else if (isOverTarget) {
              barColor = '#F59E0B'; // Warm amber warning
            } else if (isNearTarget) {
              barColor = '#10B981'; // Emerald target reached
            }

            return (
              <TouchableOpacity
                key={day.dateKey}
                onPress={() => setSelectedDayIndex(idx)}
                activeOpacity={0.8}
                className="flex-1 items-center justify-end h-full z-10 px-0.5"
              >
                {/* Visual Bar Column */}
                <View
                  style={{
                    height: `${barHeightPct}%`,
                    backgroundColor: barColor,
                    opacity: day.hasData ? 1 : 0.4,
                  }}
                  className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                    isSelected
                      ? 'border-2 border-text-primary dark:border-text-primary-dark shadow-sm'
                      : ''
                  }`}
                />
              </TouchableOpacity>
            );
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
                className="flex-1 items-center"
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

      {/* Selected Day Nutrition Inspector Callout */}
      {selectedDay && (
        <View className="p-3 rounded-xl bg-surface-card dark:bg-surface-card-dark border border-input-border dark:border-input-border-dark">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1.5">
              <View
                className={`w-2 h-2 rounded-full ${
                  selectedDay.hasData
                    ? selectedDay.calories >= targetCalories * 0.85
                      ? 'bg-emerald-500'
                      : 'bg-accent'
                    : 'bg-input-border'
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
                  {' '}({Math.round((selectedDay.calories / targetCalories) * 100)}%)
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
              <Text className="text-[9px] font-bold text-amber-500 uppercase">Fats</Text>
              <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark mt-0.5">
                {selectedDay.fat}g
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Footer Consistency Stats */}
      <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-input-border/40 dark:border-input-border-dark/40">
        <View className="flex-row items-center gap-1">
          <Ionicons name="checkmark-circle" size={13} color="#10B981" />
          <Text className="text-[11px] font-medium text-text-muted dark:text-text-muted-dark">
            {onTargetDays} of 7 days within target range
          </Text>
        </View>

        <Text className="text-[11px] font-bold text-accent dark:text-accent-dark">
          {loggedDays.length}/7 Logged
        </Text>
      </View>
    </SurfaceCard>
  );
}
