import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFoodLogHistoryApi, ApiDailyFoodLog } from '../../api/foodlog';
import { useToast } from '../../context/ToastContext';
import FoodHistoryDayCard from './FoodHistoryDayCard';
import { COLORS } from '../../constants/colors';
import SurfaceCard from '../ui/SurfaceCard';
import {
  DailyFoodHistorySummary,
  FoodLogItem,
  MacroTargets,
  MEAL_LABELS,
  getTodayDateString,
  formatDateHeading,
} from './foodLogTypes';

type HistoryRange = '7days' | '15days' | 'all';

interface FoodHistoryTabProps {
  targets: MacroTargets;
  onReLogItem: (item: FoodLogItem) => void;
  onSwitchToToday: () => void;
}

interface CalendarDaySlot {
  dateStr: string;
  dayLabel: string;
  dateNum: number;
  isToday: boolean;
  hasLog: boolean;
  calories: number;
  hitProtein: boolean;
}

export default function FoodHistoryTab({
  targets,
  onReLogItem,
  onSwitchToToday,
}: FoodHistoryTabProps) {
  const { showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [historyList, setHistoryList] = useState<DailyFoodHistorySummary[]>([]);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [selectedRange, setSelectedRange] = useState<HistoryRange>('15days');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const todayStr = getTodayDateString();

      // 1. Fetch fresh history from PostgreSQL database
      let backendLogs: ApiDailyFoodLog[] = [];
      try {
        const res = await getFoodLogHistoryApi();
        if (res.success && Array.isArray(res.history)) {
          backendLogs = res.history;
        }
      } catch (e) {
        console.log('[History API] Fetching from local cache fallback:', e);
      }

      const rawDates = await AsyncStorage.getItem('food_log_history_dates');
      let dateSet = new Set<string>();

      // Merge backend dates
      backendLogs.forEach((b) => {
        if (b.date) dateSet.add(b.date);
      });

      if (rawDates) {
        try {
          const parsed = JSON.parse(rawDates);
          if (Array.isArray(parsed)) {
            parsed.forEach((d) => {
              if (typeof d === 'string' && d.trim()) dateSet.add(d);
            });
          }
        } catch {
          // ignore
        }
      }

      // Check if today has active meals
      const rawTodayItems = await AsyncStorage.getItem('food_log_today');
      const rawTodayWater = await AsyncStorage.getItem('water_log_today');
      let todayActiveItems: FoodLogItem[] = [];
      let todayActiveWater = 0;

      if (rawTodayItems) {
        try {
          const parsed = JSON.parse(rawTodayItems);
          if (Array.isArray(parsed) && parsed.length > 0) {
            todayActiveItems = parsed;
          }
        } catch {}
      }
      if (rawTodayWater) {
        todayActiveWater = parseInt(rawTodayWater, 10) || 0;
      }

      // If today has active meals, include in view
      if (todayActiveItems.length > 0 || todayActiveWater > 0) {
        dateSet.add(todayStr);
      }

      const allDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));
      const summaries: DailyFoodHistorySummary[] = [];

      for (const dateStr of allDates) {
        const rawItems = await AsyncStorage.getItem(`food_log_${dateStr}`);
        const rawWater = await AsyncStorage.getItem(`water_log_${dateStr}`);

        let items: FoodLogItem[] = [];
        if (rawItems) {
          try {
            const parsed = JSON.parse(rawItems);
            if (Array.isArray(parsed)) {
              items = parsed;
            }
          } catch {
            items = [];
          }
        }

        let waterMl = parseInt(rawWater || '0', 10) || 0;

        // Populate from backend entry if available
        const backendEntry = backendLogs.find((b) => b.date === dateStr);
        if (backendEntry) {
          if (items.length === 0 && backendEntry.meals && backendEntry.meals.length > 0) {
            items = backendEntry.meals.map((m) => ({
              id: m.id,
              mealType: m.mealType as any,
              title: m.title,
              subtitle: m.subtitle || undefined,
              calories: m.calories,
              protein: m.protein,
              carbs: m.carbs,
              fat: m.fat,
              goalBadge: m.goalBadge || undefined,
              healthNotes: m.healthNotes || undefined,
              imageUri: m.imageUri || undefined,
            }));
          }
          if (waterMl === 0 && backendEntry.waterMl > 0) {
            waterMl = backendEntry.waterMl;
          }
        }

        // Fallback for today if active items exist before saving
        if (dateStr === todayStr && items.length === 0 && todayActiveItems.length > 0) {
          items = todayActiveItems;
          waterMl = todayActiveWater;
        }

        if (items.length > 0 || waterMl > 0) {
          const totalCalories = items.reduce((sum, i) => sum + (i.calories || 0), 0);
          const totalProtein = items.reduce((sum, i) => sum + (i.protein || 0), 0);
          const totalCarbs = items.reduce((sum, i) => sum + (i.carbs || 0), 0);
          const totalFat = items.reduce((sum, i) => sum + (i.fat || 0), 0);

          summaries.push({
            date: dateStr,
            formattedDate: formatDateHeading(dateStr),
            items,
            totalCalories,
            totalProtein,
            totalCarbs,
            totalFat,
            waterMl,
          });
        }
      }

      setHistoryList(summaries);

      // Auto-expand the first 2 dates
      const initExpanded: Record<string, boolean> = {};
      summaries.slice(0, 2).forEach((s) => {
        initExpanded[s.date] = true;
      });
      setExpandedDates(initExpanded);
    } catch (err) {
      console.log('Error loading food history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const toggleExpand = (dateStr: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const handleReLog = (item: FoodLogItem) => {
    onReLogItem({
      ...item,
      id: Date.now().toString(),
      loggedAt: new Date().toISOString(),
    });
    showSuccess(`Re-logged "${item.title}"`, `Added to today's ${MEAL_LABELS[item.mealType] || 'log'}`);
  };

  // Generate the 15-day rolling calendar strip
  const fifteenDaySlots: CalendarDaySlot[] = useMemo(() => {
    const slots: CalendarDaySlot[] = [];
    const today = new Date();

    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      const matchedLog = historyList.find((h) => h.date === dateStr);
      const isToday = i === 0;
      const dayLabel = isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'narrow' });

      slots.push({
        dateStr,
        dayLabel,
        dateNum: d.getDate(),
        isToday,
        hasLog: !!matchedLog,
        calories: matchedLog ? matchedLog.totalCalories : 0,
        hitProtein: matchedLog ? matchedLog.totalProtein >= targets.protein * 0.8 : false,
      });
    }

    return slots;
  }, [historyList, targets.protein]);

  // Filter history based on range selection
  const filteredHistory = useMemo(() => {
    let list = historyList;

    if (selectedDayFilter) {
      const specific = list.filter((h) => h.date === selectedDayFilter);
      if (specific.length > 0) return specific;
    }

    if (selectedRange === '7days') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      return list.filter((h) => h.date >= cutoffStr);
    }

    if (selectedRange === '15days') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 15);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      return list.filter((h) => h.date >= cutoffStr);
    }

    return list;
  }, [historyList, selectedRange, selectedDayFilter]);

  // Compute 15-day or filtered averages
  const totalDays = filteredHistory.length;
  const avgCalories = totalDays > 0 ? Math.round(filteredHistory.reduce((acc, h) => acc + h.totalCalories, 0) / totalDays) : 0;
  const avgProtein = totalDays > 0 ? Math.round(filteredHistory.reduce((acc, h) => acc + h.totalProtein, 0) / totalDays) : 0;
  const loggedDaysIn15 = fifteenDaySlots.filter((s) => s.hasLog).length;
  const consistencyPercent = Math.round((loggedDaysIn15 / 15) * 100);

  if (loading) {
    return (
      <View className="py-12 items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.accent.light} />
        <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-3">
          Loading 15-day nutrition history...
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-6">
      {/* 1. Range Selection Filter Tabs */}
      <View className="flex-row bg-input dark:bg-input-dark p-1 rounded-2xl mb-3.5 border border-input-border dark:border-input-border-dark">
        <TouchableOpacity
          onPress={() => {
            setSelectedRange('15days');
            setSelectedDayFilter(null);
          }}
          className={`flex-1 py-2 rounded-xl items-center ${
            selectedRange === '15days' && !selectedDayFilter
              ? 'bg-surface dark:bg-surface-dark shadow-xs'
              : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              selectedRange === '15days' && !selectedDayFilter
                ? 'text-accent dark:text-accent-dark'
                : 'text-text-muted dark:text-text-muted-dark'
            }`}
          >
            🗓️ Past 15 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setSelectedRange('7days');
            setSelectedDayFilter(null);
          }}
          className={`flex-1 py-2 rounded-xl items-center ${
            selectedRange === '7days' && !selectedDayFilter
              ? 'bg-surface dark:bg-surface-dark shadow-xs'
              : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              selectedRange === '7days' && !selectedDayFilter
                ? 'text-accent dark:text-accent-dark'
                : 'text-text-muted dark:text-text-muted-dark'
            }`}
          >
            📅 Last 7 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setSelectedRange('all');
            setSelectedDayFilter(null);
          }}
          className={`flex-1 py-2 rounded-xl items-center ${
            selectedRange === 'all' && !selectedDayFilter
              ? 'bg-surface dark:bg-surface-dark shadow-xs'
              : ''
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              selectedRange === 'all' && !selectedDayFilter
                ? 'text-accent dark:text-accent-dark'
                : 'text-text-muted dark:text-text-muted-dark'
            }`}
          >
            📚 All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. 15-Day Interactive Consistency Strip (Mini Heatmap) */}
      <SurfaceCard className="mb-4">
        <View className="flex-row justify-between items-center mb-2.5">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-text-primary dark:text-text-primary-dark font-black text-sm">
              15-Day Consistency Strip
            </Text>
            <Text className="text-xs">🔥</Text>
          </View>
          <View className="bg-accent/15 dark:bg-accent-dark/25 px-2.5 py-0.5 rounded-full">
            <Text className="text-accent dark:text-accent-dark font-black text-[10px]">
              {loggedDaysIn15}/15 Days ({consistencyPercent}%)
            </Text>
          </View>
        </View>

        <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mb-3">
          Tap any date below to jump to that day's meal logs:
        </Text>

        {/* Horizontal Calendar Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
          <View className="flex-row gap-1.5">
            {fifteenDaySlots.map((slot) => {
              const isSelected = selectedDayFilter === slot.dateStr;

              return (
                <TouchableOpacity
                  key={slot.dateStr}
                  onPress={() => {
                    if (selectedDayFilter === slot.dateStr) {
                      setSelectedDayFilter(null);
                    } else {
                      setSelectedDayFilter(slot.dateStr);
                      // Expand target day automatically
                      setExpandedDates((prev) => ({ ...prev, [slot.dateStr]: true }));
                    }
                  }}
                  activeOpacity={0.7}
                  className={`w-[44px] py-2 rounded-2xl items-center border ${
                    isSelected
                      ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark shadow-xs'
                      : slot.hasLog
                      ? slot.hitProtein
                        ? 'bg-accent/20 dark:bg-accent-dark/25 border-accent/60'
                        : 'bg-accent/10 dark:bg-accent-dark/15 border-accent/30'
                      : 'bg-input dark:bg-input-dark border-input-border/60 dark:border-input-border-dark/60'
                  }`}
                >
                  <Text
                    className={`text-[9px] font-bold uppercase mb-0.5 ${
                      isSelected
                        ? 'text-background dark:text-background-dark font-black'
                        : 'text-text-muted dark:text-text-muted-dark'
                    }`}
                  >
                    {slot.dayLabel}
                  </Text>
                  <Text
                    className={`text-xs font-black mb-1 ${
                      isSelected
                        ? 'text-background dark:text-background-dark'
                        : 'text-text-primary dark:text-text-primary-dark'
                    }`}
                  >
                    {slot.dateNum}
                  </Text>

                  {/* Status Indicator Dot */}
                  <View
                    className={`w-2 h-2 rounded-full ${
                      isSelected
                        ? 'bg-background dark:bg-background-dark'
                        : slot.hasLog
                        ? slot.hitProtein
                          ? 'bg-accent dark:bg-accent-dark'
                          : 'bg-accent/60 dark:bg-accent-dark/60'
                        : 'bg-input-border dark:bg-input-border-dark'
                    }`}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {selectedDayFilter ? (
          <TouchableOpacity
            onPress={() => setSelectedDayFilter(null)}
            className="mt-2.5 pt-2 border-t border-input-border/50 dark:border-input-border-dark/50 flex-row justify-between items-center"
          >
            <Text className="text-accent dark:text-accent-dark text-xs font-bold">
              Filtering for: {formatDateHeading(selectedDayFilter)}
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-xs font-bold">
              ✕ Clear Filter
            </Text>
          </TouchableOpacity>
        ) : null}
      </SurfaceCard>

      {/* 3. Nutrition Averages & Goal Breakdown Banner */}
      <SurfaceCard className="mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-text-primary dark:text-text-primary-dark font-black text-sm">
            {selectedRange === '15days'
              ? 'Past 15 Days Nutrition Averages'
              : selectedRange === '7days'
              ? 'Last 7 Days Nutrition Averages'
              : 'All-Time Nutrition Averages'} 📊
          </Text>
          <View className="bg-accent/15 dark:bg-accent-dark/20 px-2.5 py-0.5 rounded-full">
            <Text className="text-accent dark:text-accent-dark font-extrabold text-[10px]">
              {totalDays} {totalDays === 1 ? 'Day' : 'Days'} Logged
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          {/* Average Calories */}
          <View className="flex-1 bg-input dark:bg-input-dark p-3 rounded-2xl border border-input-border dark:border-input-border-dark items-center">
            <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold uppercase">
              Avg Calories
            </Text>
            <Text className="text-text-primary dark:text-text-primary-dark font-black text-base mt-0.5">
              {avgCalories} <Text className="text-xs font-normal text-text-muted">kcal</Text>
            </Text>
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark mt-0.5">
              Goal: {targets.calories} kcal
            </Text>
          </View>

          {/* Average Protein */}
          <View className="flex-1 bg-input dark:bg-input-dark p-3 rounded-2xl border border-input-border dark:border-input-border-dark items-center">
            <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold uppercase">
              Avg Protein
            </Text>
            <Text className="text-accent dark:text-accent-dark font-black text-base mt-0.5">
              {avgProtein}g
            </Text>
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark mt-0.5">
              Goal: {targets.protein}g
            </Text>
          </View>
        </View>
      </SurfaceCard>

      {/* 4. Filtered Day Cards List */}
      <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm mb-3">
        {selectedDayFilter
          ? `Meals for ${formatDateHeading(selectedDayFilter)}`
          : `Logged Daily Records (${filteredHistory.length})`} 📖
      </Text>

      {filteredHistory.length === 0 ? (
        <SurfaceCard className="p-6 items-center justify-center my-2">
          <Text className="text-4xl mb-2">🗓️</Text>
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm text-center mb-1">
            No Records Found in Selected Range
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center mb-4 max-w-[240px]">
            Log your daily meals and click "Save & Complete" to populate your 15-day history timeline.
          </Text>
          <TouchableOpacity
            onPress={onSwitchToToday}
            activeOpacity={0.8}
            className="bg-accent dark:bg-accent-dark px-5 py-2.5 rounded-xl shadow-xs"
          >
            <Text className="text-background dark:text-background-dark font-black text-xs uppercase tracking-wide">
              + Log Today's Meal
            </Text>
          </TouchableOpacity>
        </SurfaceCard>
      ) : (
        filteredHistory.map((day) => (
          <FoodHistoryDayCard
            key={day.date}
            day={day}
            targetCalories={targets.calories}
            targetProtein={targets.protein}
            isExpanded={Boolean(expandedDates[day.date])}
            onToggleExpand={() => toggleExpand(day.date)}
            onReLogItem={handleReLog}
          />
        ))
      )}
    </View>
  );
}
