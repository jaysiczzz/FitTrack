import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CompletedSession,
  WorkoutHistoryRange,
  WorkoutCalendarSlot,
  getTodayDateString,
  getDateStringFromTimestamp,
  formatDateHeading,
} from './workoutTypes';
import { getWorkoutHistory, deleteWorkoutSessionApi } from '@/api/workout';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import SurfaceCard from '../ui/SurfaceCard';
import ConfirmModal from '../ui/ConfirmModal';

interface WorkoutHistoryTabProps {
  onRepeatSession?: (session: CompletedSession) => void;
  onSwitchToToday?: () => void;
}

const WorkoutHistoryTab: React.FC<WorkoutHistoryTabProps> = ({
  onRepeatSession,
  onSwitchToToday,
}) => {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const userId = user?.id;
  const historyKey = authStorage.getScopedKey(userId, 'fittrack_workout_history_cache');

  const [history, setHistory] = useState<CompletedSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [selectedRange, setSelectedRange] = useState<WorkoutHistoryRange>('15days');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<CompletedSession | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      // 1. Read local offline history cache first for instant UI response
      const cached = await AsyncStorage.getItem(historyKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setHistory(parsed);
          }
        } catch {}
      }

      if (history.length === 0) setLoading(true);

      // 2. Fetch fresh history from API
      const res = await getWorkoutHistory();
      if (res.sessions && Array.isArray(res.sessions)) {
        const formatted: CompletedSession[] = res.sessions.map((s: any) => {
          const rawDuration = s.duration;
          const durationMinutes = typeof rawDuration === 'number' ? rawDuration : parseInt(rawDuration, 10) || 35;
          const dateStr = s.completedAt
            ? getDateStringFromTimestamp(s.completedAt)
            : s.createdAt
            ? getDateStringFromTimestamp(s.createdAt)
            : getTodayDateString();

          const displayDate = dateStr ? formatDateHeading(dateStr) : 'Completed';

          const exercises = (s.exercises || []).map((e: any) => {
            const sets = (e.sets || []).map((set: any, idx: number) => ({
              id: set.id,
              setNumber: set.setNumber || idx + 1,
              weight: set.weight !== undefined && set.weight !== null ? set.weight : undefined,
              reps: set.reps !== undefined && set.reps !== null ? set.reps : undefined,
              bodyweight: Boolean(set.bodyweight),
              done: Boolean(set.done),
            }));

            const setsCount = sets.length;
            let setsSummary = `${setsCount} sets`;
            if (sets.length > 0) {
              const first = sets[0];
              if (first.weight) {
                setsSummary = `${setsCount} sets · ${first.weight}kg × ${first.reps || 10} reps`;
              } else if (first.reps) {
                setsSummary = `${setsCount} sets · ${first.reps} reps`;
              }
            }

            return {
              id: e.id,
              exerciseId: e.exerciseId || e.id,
              name: e.name,
              category: e.category,
              setsSummary,
              sets,
            };
          });

          const totalSetsCount = exercises.reduce((acc: number, e: any) => acc + (e.sets?.length || 0), 0);

          return {
            id: s.id,
            date: displayDate,
            dateStr,
            completedAt: s.completedAt,
            title: s.title || 'Workout Session',
            duration: `${durationMinutes} min`,
            durationMinutes,
            caloriesBurned: s.caloriesBurned || 240,
            exercisesCount: exercises.length,
            totalSetsCount,
            exercises,
          };
        });

        // Sort descending by completion date
        formatted.sort((a, b) => {
          const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return timeB - timeA;
        });

        setHistory(formatted);
        await AsyncStorage.setItem(historyKey, JSON.stringify(formatted));

        // Auto-expand the first session
        if (formatted.length > 0) {
          setExpandedDates((prev) => ({
            ...prev,
            [formatted[0].id]: true,
          }));
        }
      }
    } catch (err) {
      console.log('[Workout History] Offline mode - using local history cache');
    } finally {
      setLoading(false);
    }
  }, [historyKey]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const toggleExpand = (id: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    const target = sessionToDelete;
    setSessionToDelete(null);

    try {
      // 1. Delete on server (or offline queue)
      try {
        await deleteWorkoutSessionApi(target.id);
      } catch (err) {
        console.log('[Workout History] Failed to delete session on server (or offline):', err);
      }

      // 2. Remove from local state
      const updated = history.filter((s) => s.id !== target.id);
      setHistory(updated);

      // 3. Update cached history in AsyncStorage
      await AsyncStorage.setItem(historyKey, JSON.stringify(updated));

      // 4. Clean up expanded state
      setExpandedDates((prev) => {
        const next = { ...prev };
        delete next[target.id];
        return next;
      });

      showSuccess('Workout session deleted');
    } catch (err) {
      console.error('[Workout History] Error deleting session:', err);
      showError('Failed to delete workout session');
    }
  };

  // Generate 15-day rolling consistency calendar strip
  const fifteenDaySlots: WorkoutCalendarSlot[] = useMemo(() => {
    const slots: WorkoutCalendarSlot[] = [];
    const today = new Date();

    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      const matchedSessions = history.filter((h) => h.dateStr === dateStr);
      const isToday = i === 0;
      const dayLabel = isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'narrow' });

      const totalCals = matchedSessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0);
      const totalDuration = matchedSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      slots.push({
        dateStr,
        dayLabel,
        dateNum: d.getDate(),
        isToday,
        hasWorkout: matchedSessions.length > 0,
        sessionCount: matchedSessions.length,
        caloriesBurned: totalCals,
        durationMinutes: totalDuration,
      });
    }

    return slots;
  }, [history]);

  // Filter history based on range or specific day selection
  const filteredSessions = useMemo(() => {
    let list = history;

    if (selectedDayFilter) {
      const specific = list.filter((s) => s.dateStr === selectedDayFilter);
      if (specific.length > 0) return specific;
    }

    if (selectedRange === '7days') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const y = cutoff.getFullYear();
      const m = String(cutoff.getMonth() + 1).padStart(2, '0');
      const day = String(cutoff.getDate()).padStart(2, '0');
      const cutoffStr = `${y}-${m}-${day}`;
      return list.filter((s) => (s.dateStr || '') >= cutoffStr);
    }

    if (selectedRange === '15days') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 15);
      const y = cutoff.getFullYear();
      const m = String(cutoff.getMonth() + 1).padStart(2, '0');
      const day = String(cutoff.getDate()).padStart(2, '0');
      const cutoffStr = `${y}-${m}-${day}`;
      return list.filter((s) => (s.dateStr || '') >= cutoffStr);
    }

    return list;
  }, [history, selectedRange, selectedDayFilter]);

  // Performance averages and totals
  const totalSessions = filteredSessions.length;
  const totalDurationMins = filteredSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const avgDuration = totalSessions > 0 ? Math.round(totalDurationMins / totalSessions) : 0;
  const totalCalories = filteredSessions.reduce((acc, s) => acc + (s.caloriesBurned || 0), 0);
  const avgCalories = totalSessions > 0 ? Math.round(totalCalories / totalSessions) : 0;
  const totalSets = filteredSessions.reduce((acc, s) => acc + (s.totalSetsCount || 0), 0);
  const totalExercises = filteredSessions.reduce((acc, s) => acc + (s.exercisesCount || 0), 0);

  const activeDaysIn15 = fifteenDaySlots.filter((s) => s.hasWorkout).length;
  const consistencyPercent = Math.round((activeDaysIn15 / 15) * 100);

  if (loading) {
    return (
      <View className="py-12 items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent} />
        <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-3">
          Loading workout history & performance trends...
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
          className={`flex-1 py-2 rounded-xl items-center border ${
            selectedRange === '15days' && !selectedDayFilter
              ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent/40 dark:border-accent-dark/40'
              : 'bg-transparent border-transparent'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              selectedRange === '15days' && !selectedDayFilter
                ? 'text-accent dark:text-accent-dark'
                : 'text-text-muted dark:text-text-muted-dark'
            }`}
          >
            15 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setSelectedRange('7days');
            setSelectedDayFilter(null);
          }}
          className={`flex-1 py-2 rounded-xl items-center border ${
            selectedRange === '7days' && !selectedDayFilter
              ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent/40 dark:border-accent-dark/40'
              : 'bg-transparent border-transparent'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              selectedRange === '7days' && !selectedDayFilter
                ? 'text-accent dark:text-accent-dark'
                : 'text-text-muted dark:text-text-muted-dark'
            }`}
          >
            7 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setSelectedRange('all');
            setSelectedDayFilter(null);
          }}
          className={`flex-1 py-2 rounded-xl items-center border ${
            selectedRange === 'all' && !selectedDayFilter
              ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent/40 dark:border-accent-dark/40'
              : 'bg-transparent border-transparent'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              selectedRange === 'all' && !selectedDayFilter
                ? 'text-accent dark:text-accent-dark'
                : 'text-text-muted dark:text-text-muted-dark'
            }`}
          >
            All Time
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
          </View>
          <View className="bg-accent/15 dark:bg-accent-dark/25 px-2.5 py-0.5 rounded-full">
            <Text className="text-accent dark:text-accent-dark font-black text-[10px]">
              {activeDaysIn15}/15 Days ({consistencyPercent}%)
            </Text>
          </View>
        </View>

        <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mb-3">
          Tap any date below to jump to that day's workout sessions:
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
                    }
                  }}
                  activeOpacity={0.7}
                  className={`w-[44px] py-2 rounded-2xl items-center border ${
                    isSelected
                      ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark shadow-xs'
                      : slot.hasWorkout
                      ? 'bg-accent/20 dark:bg-accent-dark/25 border-accent/60'
                      : 'bg-input dark:bg-input-dark border-input-border/60 dark:border-input-border-dark/60'
                  }`}
                >
                  <Text
                    className={`text-[9px] font-bold uppercase mb-0.5 ${
                      isSelected
                        ? 'text-white font-black'
                        : 'text-text-muted dark:text-text-muted-dark'
                    }`}
                  >
                    {slot.dayLabel}
                  </Text>
                  <Text
                    className={`text-xs font-black mb-1 ${
                      isSelected
                        ? 'text-white'
                        : 'text-text-primary dark:text-text-primary-dark'
                    }`}
                  >
                    {slot.dateNum}
                  </Text>

                  {/* Status Indicator Dot */}
                  <View
                    className={`w-2 h-2 rounded-full ${
                      isSelected
                        ? 'bg-white'
                        : slot.hasWorkout
                        ? 'bg-accent dark:bg-accent-dark'
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

      {/* 3. Workout Performance & Averages Banner */}
      <SurfaceCard className="mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-text-primary dark:text-text-primary-dark font-black text-sm">
            {selectedRange === '15days'
              ? 'Past 15 Days Performance'
              : selectedRange === '7days'
              ? 'Last 7 Days Performance'
              : 'All-Time Performance'}
          </Text>
          <View className="bg-accent/15 dark:bg-accent-dark/20 px-2.5 py-0.5 rounded-full">
            <Text className="text-accent dark:text-accent-dark font-extrabold text-[10px]">
              {totalSessions} {totalSessions === 1 ? 'Session' : 'Sessions'} Logged
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          {/* Average Duration */}
          <View className="flex-1 bg-input dark:bg-input-dark p-3 rounded-2xl border border-input-border dark:border-input-border-dark items-center">
            <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold uppercase">
              Avg Duration
            </Text>
            <Text className="text-text-primary dark:text-text-primary-dark font-black text-base mt-0.5">
              {avgDuration} <Text className="text-xs font-normal text-text-muted">min</Text>
            </Text>
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark mt-0.5">
              Total: {totalDurationMins >= 60 ? `${(totalDurationMins / 60).toFixed(1)}h` : `${totalDurationMins}m`}
            </Text>
          </View>

          {/* Average Calories */}
          <View className="flex-1 bg-input dark:bg-input-dark p-3 rounded-2xl border border-input-border dark:border-input-border-dark items-center">
            <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold uppercase">
              Avg Burned
            </Text>
            <Text className="text-accent dark:text-accent-dark font-black text-base mt-0.5">
              {avgCalories} <Text className="text-xs font-normal text-text-muted">kcal</Text>
            </Text>
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark mt-0.5">
              Total: {totalCalories.toLocaleString()} kcal
            </Text>
          </View>

          {/* Volume: Total Sets & Exercises */}
          <View className="flex-1 bg-input dark:bg-input-dark p-3 rounded-2xl border border-input-border dark:border-input-border-dark items-center">
            <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold uppercase">
              Volume
            </Text>
            <Text className="text-text-primary dark:text-text-primary-dark font-black text-base mt-0.5">
              {totalSets} <Text className="text-xs font-normal text-text-muted">sets</Text>
            </Text>
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark mt-0.5">
              {totalExercises} {totalExercises === 1 ? 'Exercise' : 'Exercises'}
            </Text>
          </View>
        </View>
      </SurfaceCard>

      {/* 4. Filtered Sessions List */}
      <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm mb-3">
        {selectedDayFilter
          ? `Workouts for ${formatDateHeading(selectedDayFilter)}`
          : `Completed Sessions (${filteredSessions.length})`}
      </Text>

      {filteredSessions.length === 0 ? (
        <SurfaceCard className="p-6 items-center justify-center my-2">
          <View className="w-12 h-12 rounded-2xl bg-input dark:bg-input-dark items-center justify-center mb-3">
            <Ionicons name="barbell" size={26} color={colors.textMuted} />
          </View>
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm text-center mb-1">
            No Workouts Found
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center mb-4 max-w-[240px]">
            {selectedDayFilter
              ? `No workout was completed on ${formatDateHeading(selectedDayFilter)}.`
              : 'Complete your daily workout session to start building your workout history and performance trends.'}
          </Text>
          {onSwitchToToday ? (
            <TouchableOpacity
              onPress={onSwitchToToday}
              activeOpacity={0.8}
              className="bg-accent dark:bg-accent-dark px-5 py-3 rounded-2xl"
            >
              <Text className="text-white font-bold text-xs uppercase tracking-wide">
                Start Today's Workout
              </Text>
            </TouchableOpacity>
          ) : null}
        </SurfaceCard>
      ) : (
        filteredSessions.map((session) => {
          const isExpanded = Boolean(expandedDates[session.id]);
          return (
            <SurfaceCard key={session.id} className="mb-3">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => toggleExpand(session.id)}
              >
                {/* Header: Date & Status */}
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                    {session.date}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View className="bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      <Text className="text-[10px] font-bold text-accent dark:text-accent-dark uppercase tracking-wider">
                        Completed
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSessionToDelete(session)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Delete workout session"
                      className="w-7 h-7 rounded-lg items-center justify-center bg-red-500/10 dark:bg-red-500/20 active:opacity-70"
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Session Title */}
                <Text className="text-base font-black text-text-primary dark:text-text-primary-dark mb-2">
                  {session.title}
                </Text>

                {/* Metrics Chips */}
                <View className="flex-row items-center gap-x-2 mb-3 bg-input dark:bg-input-dark p-3 rounded-2xl border border-input-border dark:border-input-border-dark flex-wrap">
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {session.duration}
                  </Text>
                  <Text className="text-text-muted dark:text-text-muted-dark text-xs">·</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {session.caloriesBurned} kcal
                  </Text>
                  <Text className="text-text-muted dark:text-text-muted-dark text-xs">·</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {session.exercisesCount} {session.exercisesCount === 1 ? 'Exercise' : 'Exercises'}
                  </Text>
                  {session.totalSetsCount ? (
                    <>
                      <Text className="text-text-muted dark:text-text-muted-dark text-xs">·</Text>
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                        {session.totalSetsCount} Sets
                      </Text>
                    </>
                  ) : null}
                </View>

                {/* Expandable Exercise Breakdown */}
                <View className="border-t border-input-border/60 dark:border-input-border-dark/60 pt-2.5 mt-1 flex-row justify-between items-center">
                  <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
                    {isExpanded ? 'Hide Details' : 'View Completed Exercises'}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.accent}
                  />
                </View>

                {isExpanded ? (
                  <View className="mt-3 pt-2 border-t border-input-border/40 dark:border-input-border-dark/40">
                    {session.exercises.map((ex, i) => (
                      <View
                        key={i}
                        className="flex-row items-center justify-between py-2 border-b border-input-border/20 last:border-b-0"
                      >
                        <View className="flex-row items-center flex-1 mr-2">
                          <View className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 items-center justify-center mr-2">
                            <Ionicons name="checkmark" size={11} color="#10B981" />
                          </View>
                          <Text
                            numberOfLines={1}
                            className="text-xs font-bold text-text-primary dark:text-text-primary-dark flex-1"
                          >
                            {ex.name}
                          </Text>
                        </View>
                        <Text className="text-[11px] text-text-muted dark:text-text-muted-dark font-medium">
                          {ex.setsSummary}
                        </Text>
                      </View>
                    ))}

                    {/* Quick Action: Repeat Routine in Today's Workout */}
                    {onRepeatSession && session.exercises.length > 0 ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onRepeatSession(session)}
                        className="mt-3 py-2.5 px-3 rounded-xl bg-accent/15 dark:bg-accent-dark/20 border border-accent/40 dark:border-accent-dark/40 flex-row items-center justify-center gap-1.5"
                      >
                        <Ionicons name="repeat" size={14} color={colors.accent} />
                        <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                          Repeat Routine in Today's Workout
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
              </TouchableOpacity>
            </SurfaceCard>
          );
        })
      )}

      {/* Delete Workout Session Confirmation Modal */}
      <ConfirmModal
        visible={Boolean(sessionToDelete)}
        title="Delete Workout"
        message={`Are you sure you want to delete "${sessionToDelete?.title}" on ${sessionToDelete?.date}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger
        iconName="trash-outline"
        onConfirm={handleConfirmDeleteSession}
        onCancel={() => setSessionToDelete(null)}
      />
    </View>
  );
};

export default WorkoutHistoryTab;
