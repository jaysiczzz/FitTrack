import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import SurfaceCard from '../ui/SurfaceCard';
import {
  WorkoutRoutineTemplate,
  WeeklySplit,
  MonthlySchedule,
  CompletedSession,
  getTodayDateString,
} from './workoutTypes';
import { MESOCYCLE_WEEKS, getDayOfWeekFromDate } from './plannerPresets';
import AssignRoutineModal from './AssignRoutineModal';

interface MonthlyPlannerViewProps {
  routines: WorkoutRoutineTemplate[];
  weeklySplit: WeeklySplit;
  monthlySchedule: MonthlySchedule;
  monthlyTargetDays: number;
  currentMesocycleWeek: number;
  onUpdateScheduleDay: (
    dateKey: string,
    routineId: string | null,
    isRestDay: boolean,
    customNotes?: string
  ) => Promise<void> | void;
  onAutoFillMonthFromSplit: (year: number, month: number) => Promise<void> | void;
  onUpdateTargetDays: (targetDays: number) => Promise<void> | void;
  onUpdateMesocycleWeek: (weekNumber: number) => Promise<void> | void;
  onStartRoutine: (routine: WorkoutRoutineTemplate) => void;
  onCreateRoutine: () => void;
  workoutHistory?: CompletedSession[];
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MonthlyPlannerView({
  routines,
  weeklySplit,
  monthlySchedule,
  monthlyTargetDays,
  currentMesocycleWeek,
  onUpdateScheduleDay,
  onAutoFillMonthFromSplit,
  onUpdateTargetDays,
  onUpdateMesocycleWeek,
  onStartRoutine,
  onCreateRoutine,
  workoutHistory = [],
}: MonthlyPlannerViewProps) {
  const { colors } = useThemeColors();
  const { showSuccess, showToast } = useToast();

  const today = new Date();
  const todayStr = getTodayDateString();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [showMesocycleDetails, setShowMesocycleDetails] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // Month navigation
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

  const handleJumpToCurrentMonth = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  const isCurrentViewingMonth =
    currentYear === today.getFullYear() && currentMonth === today.getMonth();

  // Map completed workouts by dateStr (YYYY-MM-DD)
  const completedWorkoutsByDate = useMemo(() => {
    const map: Record<string, CompletedSession[]> = {};
    for (const session of workoutHistory) {
      const d = session.dateStr || session.date?.split('T')[0];
      if (d) {
        if (!map[d]) map[d] = [];
        map[d].push(session);
      }
    }
    return map;
  }, [workoutHistory]);

  // Calendar Day Cells Calculation (Monday-based start)
  const calendarCells = useMemo(() => {
    // 1st day of month
    const firstDay = new Date(currentYear, currentMonth, 1);
    // getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
    // Convert to Monday = 0, ..., Sunday = 6
    const firstDayIndex = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      routine: WorkoutRoutineTemplate | null;
      isRestDay: boolean;
      hasCompletedWorkout: boolean;
      completedCount: number;
    }[] = [];

    // Leading padding days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        routine: null,
        isRestDay: false,
        hasCompletedWorkout: Boolean(completedWorkoutsByDate[dateStr]?.length),
        completedCount: completedWorkoutsByDate[dateStr]?.length || 0,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const scheduleEntry = monthlySchedule[dateStr];
      const assignedRoutineId = scheduleEntry?.routineId;
      const routine = assignedRoutineId
        ? routines.find((r) => r.id === assignedRoutineId) || null
        : null;
      const isRestDay = Boolean(scheduleEntry?.isRestDay);
      const completedSessions = completedWorkoutsByDate[dateStr] || [];

      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        routine,
        isRestDay,
        hasCompletedWorkout: completedSessions.length > 0,
        completedCount: completedSessions.length,
      });
    }

    // Trailing padding days to fill 7 columns
    const totalRemaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= totalRemaining; d++) {
      const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        routine: null,
        isRestDay: false,
        hasCompletedWorkout: Boolean(completedWorkoutsByDate[dateStr]?.length),
        completedCount: completedWorkoutsByDate[dateStr]?.length || 0,
      });
    }

    return cells;
  }, [
    currentYear,
    currentMonth,
    selectedDate,
    monthlySchedule,
    routines,
    completedWorkoutsByDate,
    todayStr,
  ]);

  // Statistics for currently viewed month
  const monthStats = useMemo(() => {
    let plannedWorkoutsCount = 0;
    let plannedRestCount = 0;
    let completedWorkoutsCount = 0;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const scheduleEntry = monthlySchedule[dateStr];
      if (scheduleEntry?.routineId) {
        plannedWorkoutsCount++;
      } else if (scheduleEntry?.isRestDay) {
        plannedRestCount++;
      }
      if (completedWorkoutsByDate[dateStr]?.length) {
        completedWorkoutsCount += completedWorkoutsByDate[dateStr].length;
      }
    }

    const targetDays = monthlyTargetDays || 20;
    const progressPercent = Math.min(
      100,
      Math.round(((completedWorkoutsCount || plannedWorkoutsCount) / targetDays) * 100)
    );

    return {
      plannedWorkoutsCount,
      plannedRestCount,
      completedWorkoutsCount,
      targetDays,
      progressPercent,
    };
  }, [currentYear, currentMonth, monthlySchedule, completedWorkoutsByDate, monthlyTargetDays]);

  // Active mesocycle phase
  const activeMesocycle = useMemo(() => {
    const safeWeek = Math.min(4, Math.max(1, currentMesocycleWeek || 1));
    return (
      MESOCYCLE_WEEKS.find((w) => w.weekNumber === safeWeek) || MESOCYCLE_WEEKS[0]
    );
  }, [currentMesocycleWeek]);

  // Inspector Selected Day Info
  const selectedDayInfo = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const schedule = monthlySchedule[selectedDate];
    const assignedRoutine = schedule?.routineId
      ? routines.find((r) => r.id === schedule.routineId) || null
      : null;
    const isRest = Boolean(schedule?.isRestDay);
    const completedSessions = completedWorkoutsByDate[selectedDate] || [];

    const formattedFull = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const isToday = selectedDate === todayStr;

    return {
      dateStr: selectedDate,
      dateObj,
      formattedFull,
      isToday,
      schedule,
      assignedRoutine,
      isRest,
      completedSessions,
    };
  }, [selectedDate, monthlySchedule, routines, completedWorkoutsByDate, todayStr]);

  // One-tap Auto-Fill Month from Weekly Split
  const handleAutoFillMonth = async () => {
    setIsAutoFilling(true);
    try {
      await onAutoFillMonthFromSplit(currentYear, currentMonth);
      showSuccess(
        'Month Auto-Filled! ⚡',
        `Applied your 7-day weekly split to all days of ${MONTH_NAMES[currentMonth]}`
      );
    } catch (err) {
      showToast({
        message: 'Could not auto-fill month',
        type: 'error',
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Assign routine to selected date
  const handleSelectRoutineForDate = async (routineId: string | null) => {
    if (routineId) {
      await onUpdateScheduleDay(selectedDate, routineId, false);
      const r = routines.find((item) => item.id === routineId);
      showSuccess(
        'Routine Scheduled',
        `Scheduled "${r?.title || 'Workout'}" for ${selectedDayInfo.formattedFull}`
      );
    } else {
      await onUpdateScheduleDay(selectedDate, null, true);
      showSuccess(
        'Rest Day Set',
        `Marked ${selectedDayInfo.formattedFull} as Rest & Recovery`
      );
    }
  };

  // Clear day schedule
  const handleClearDaySchedule = async () => {
    await onUpdateScheduleDay(selectedDate, null, false);
    showToast({
      message: 'Schedule Cleared',
      description: `Removed plan for ${selectedDayInfo.formattedFull}`,
      type: 'info',
      iconName: 'trash-outline',
    });
  };

  return (
    <View className="mb-6">
      {/* 1. Month Header & Navigator */}
      <SurfaceCard className="mb-4 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={handlePrevMonth}
              activeOpacity={0.7}
              className="w-9 h-9 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
            >
              <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            <View>
              <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </Text>
              <Text className="text-[11px] text-text-muted dark:text-text-muted-dark font-medium">
                Monthly Workout Calendar & Periodization
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            {!isCurrentViewingMonth && (
              <TouchableOpacity
                onPress={handleJumpToCurrentMonth}
                className="px-2.5 py-1.5 rounded-xl bg-accent/15 dark:bg-accent-dark/20 border border-accent/40"
              >
                <Text className="text-[11px] font-bold text-accent dark:text-accent-dark">
                  This Month
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleNextMonth}
              activeOpacity={0.7}
              className="w-9 h-9 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
            >
              <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Monthly Target & Progress Ring Bar */}
        <View className="mt-4 pt-4 border-t border-input-border/60 dark:border-input-border-dark/60">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="trophy" size={15} color={colors.accent} />
              <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark uppercase tracking-wider">
                Monthly Consistency Target
              </Text>
            </View>

            <View className="flex-row items-center gap-1.5">
              <TouchableOpacity
                onPress={() => onUpdateTargetDays(Math.max(8, monthStats.targetDays - 2))}
                className="w-6 h-6 rounded-lg bg-input dark:bg-input-dark items-center justify-center border border-input-border"
              >
                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">-</Text>
              </TouchableOpacity>
              <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                {monthStats.targetDays} Days
              </Text>
              <TouchableOpacity
                onPress={() => onUpdateTargetDays(Math.min(30, monthStats.targetDays + 2))}
                className="w-6 h-6 rounded-lg bg-input dark:bg-input-dark items-center justify-center border border-input-border"
              >
                <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="h-2.5 bg-input dark:bg-input-dark rounded-full overflow-hidden mb-3 border border-input-border/40">
            <View
              className="h-full bg-accent dark:bg-accent-dark rounded-full"
              style={{ width: `${monthStats.progressPercent}%` }}
            />
          </View>

          {/* Stat Pills */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1 bg-input/60 dark:bg-input-dark/60 p-2 rounded-xl mr-1.5 items-center">
              <Text className="text-[10px] text-text-muted font-bold uppercase">Completed</Text>
              <Text className="text-sm font-black text-emerald-500 mt-0.5">
                {monthStats.completedWorkoutsCount}
              </Text>
            </View>

            <View className="flex-1 bg-input/60 dark:bg-input-dark/60 p-2 rounded-xl mx-1 items-center">
              <Text className="text-[10px] text-text-muted font-bold uppercase">Scheduled</Text>
              <Text className="text-sm font-black text-accent dark:text-accent-dark mt-0.5">
                {monthStats.plannedWorkoutsCount}
              </Text>
            </View>

            <View className="flex-1 bg-input/60 dark:bg-input-dark/60 p-2 rounded-xl ml-1.5 items-center">
              <Text className="text-[10px] text-text-muted font-bold uppercase">Rest Days</Text>
              <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark mt-0.5">
                {monthStats.plannedRestCount}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. One-Tap Auto Fill Month Action */}
        <View className="mt-3.5 pt-3 border-t border-input-border/40 flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
              Auto-Fill from Weekly Split
            </Text>
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
              Populate entire month using your current 7-day routine split
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isAutoFilling}
            onPress={handleAutoFillMonth}
            className="px-3 py-2 rounded-xl bg-accent dark:bg-accent-dark flex-row items-center gap-1.5"
          >
            <Ionicons name="flash" size={13} color="#FFFFFF" />
            <Text className="text-xs font-black text-white">
              {isAutoFilling ? 'Filling...' : 'Auto-Fill'}
            </Text>
          </TouchableOpacity>
        </View>
      </SurfaceCard>

      {/* 4. Mesocycle Periodization Block */}
      <SurfaceCard className="mb-4 p-4 border border-accent/30 bg-accent/5 dark:bg-accent-dark/10">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowMesocycleDetails((v) => !v)}
          className="flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-2">
            <View className="w-7 h-7 rounded-lg bg-accent/20 dark:bg-accent-dark/30 items-center justify-center">
              <Ionicons name="layers" size={15} color={colors.accent} />
            </View>
            <View>
              <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark">
                4-Week Mesocycle Periodization
              </Text>
              <Text className="text-[10px] text-accent dark:text-accent-dark font-bold">
                Current: {activeMesocycle.title}
              </Text>
            </View>
          </View>

          <Ionicons
            name={showMesocycleDetails ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {/* 4 Week Switcher Pills */}
        <View className="flex-row gap-1.5 mt-3">
          {MESOCYCLE_WEEKS.map((w) => {
            const isActive = (currentMesocycleWeek || 1) === w.weekNumber;
            return (
              <TouchableOpacity
                key={w.weekNumber}
                activeOpacity={0.8}
                onPress={() => {
                  onUpdateMesocycleWeek(w.weekNumber);
                  showSuccess(
                    'Mesocycle Phase Updated',
                    `Switched to ${w.title} (${w.intensityLabel})`
                  );
                }}
                className={`flex-1 py-2 rounded-xl items-center justify-center border ${
                  isActive
                    ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
                    : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                }`}
              >
                <Text
                  className={`text-[10px] font-black uppercase ${
                    isActive ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'
                  }`}
                >
                  W{w.weekNumber}
                </Text>
                <Text
                  numberOfLines={1}
                  className={`text-[9px] font-bold ${
                    isActive ? 'text-white/90' : 'text-text-primary dark:text-text-primary-dark'
                  }`}
                >
                  {w.phase}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mesocycle Detailed Coaching Guidance */}
        {showMesocycleDetails && (
          <View className="mt-3 pt-3 border-t border-input-border/50 dark:border-input-border-dark/50">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark">
                {activeMesocycle.subtitle}
              </Text>
              <View className="bg-accent/20 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-black text-accent dark:text-accent-dark">
                  {activeMesocycle.intensityLabel}
                </Text>
              </View>
            </View>

            <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-2 leading-relaxed">
              {activeMesocycle.focus}
            </Text>

            <View className="bg-input/60 dark:bg-input-dark/60 p-2.5 rounded-xl border border-input-border/40 gap-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] font-bold text-text-muted">Target RPE:</Text>
                <Text className="text-[11px] font-black text-accent dark:text-accent-dark">
                  {activeMesocycle.targetRPE}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] font-bold text-text-muted">Volume Target:</Text>
                <Text className="text-[11px] font-black text-text-primary dark:text-text-primary-dark">
                  {activeMesocycle.volumeMultiplier}
                </Text>
              </View>
              <Text className="text-[10px] text-text-muted italic mt-1">
                💡 Tip: {activeMesocycle.tips}
              </Text>
            </View>
          </View>
        )}
      </SurfaceCard>

      {/* 5. Month Calendar Grid */}
      <SurfaceCard className="mb-4 p-3">
        {/* Weekday Labels */}
        <View className="flex-row justify-between mb-2">
          {WEEKDAY_HEADERS.map((dayName, idx) => (
            <View key={idx} className="flex-1 items-center py-1">
              <Text className="text-[11px] font-black text-text-muted dark:text-text-muted-dark uppercase">
                {dayName}
              </Text>
            </View>
          ))}
        </View>

        {/* 7-Column Grid */}
        <View className="flex-row flex-wrap">
          {calendarCells.map((cell, idx) => {
            const isSelected = cell.dateStr === selectedDate;

            return (
              <TouchableOpacity
                key={`${cell.dateStr}-${idx}`}
                activeOpacity={0.7}
                onPress={() => setSelectedDate(cell.dateStr)}
                style={{ width: '14.28%' }}
                className={`aspect-square p-1 items-center justify-between rounded-xl mb-1 border ${
                  isSelected
                    ? 'border-accent bg-accent/15 dark:bg-accent-dark/25'
                    : cell.isToday
                    ? 'border-accent/60 bg-accent/5'
                    : 'border-transparent'
                } ${!cell.isCurrentMonth ? 'opacity-30' : ''}`}
              >
                {/* Day number & today marker */}
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center ${
                    cell.isToday
                      ? 'bg-accent dark:bg-accent-dark'
                      : isSelected
                      ? 'bg-accent/20'
                      : ''
                  }`}
                >
                  <Text
                    className={`text-xs font-black ${
                      cell.isToday
                        ? 'text-white'
                        : isSelected
                        ? 'text-accent dark:text-accent-dark'
                        : 'text-text-primary dark:text-text-primary-dark'
                    }`}
                  >
                    {cell.dayNumber}
                  </Text>
                </View>

                {/* Status Dot / Indicator */}
                <View className="flex-row items-center justify-center h-3 w-full">
                  {cell.hasCompletedWorkout ? (
                    <View className="w-2 h-2 rounded-full bg-emerald-500" />
                  ) : cell.routine ? (
                    <View className="w-2 h-2 rounded-full bg-accent dark:bg-accent-dark" />
                  ) : cell.isRestDay ? (
                    <View className="w-1.5 h-1.5 rounded-full bg-teal-400 opacity-60" />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Calendar Legend */}
        <View className="flex-row items-center justify-center gap-4 pt-3 mt-1 border-t border-input-border/40">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-emerald-500" />
            <Text className="text-[10px] font-bold text-text-muted">Completed</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-accent dark:bg-accent-dark" />
            <Text className="text-[10px] font-bold text-text-muted">Scheduled</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-teal-400 opacity-60" />
            <Text className="text-[10px] font-bold text-text-muted">Rest Day</Text>
          </View>
        </View>
      </SurfaceCard>

      {/* 6. Selected Date Schedule Inspector */}
      <SurfaceCard className="mb-4 p-4 border border-input-border dark:border-input-border-dark">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark">
                {selectedDayInfo.formattedFull}
              </Text>
              {selectedDayInfo.isToday && (
                <View className="bg-accent/20 px-2 py-0.5 rounded-md">
                  <Text className="text-[9px] font-black text-accent dark:text-accent-dark uppercase">
                    Today
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
              Day Schedule & Completed Logs
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setIsAssignModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-accent/15 dark:bg-accent-dark/20 border border-accent/40 flex-row items-center gap-1"
          >
            <Ionicons name="pencil" size={12} color={colors.accent} />
            <Text className="text-xs font-bold text-accent dark:text-accent-dark">
              {selectedDayInfo.assignedRoutine || selectedDayInfo.isRest ? 'Change' : 'Schedule'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Completed Past Workout(s) on this date */}
        {selectedDayInfo.completedSessions.length > 0 && (
          <View className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl mb-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                Workout Session Completed!
              </Text>
            </View>
            {selectedDayInfo.completedSessions.map((session, sIdx) => (
              <View key={session.id || sIdx} className="mt-1">
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                  {session.title}
                </Text>
                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                  {session.duration} · {session.caloriesBurned} kcal · {session.exercisesCount || session.exercises?.length || 0} exercises
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Scheduled Routine or Rest Status */}
        {selectedDayInfo.assignedRoutine ? (
          <View className="bg-input dark:bg-input-dark p-3.5 rounded-2xl border border-input-border dark:border-input-border-dark mb-3">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark">
                {selectedDayInfo.assignedRoutine.title}
              </Text>
              <View className="bg-accent/20 px-2 py-0.5 rounded-md">
                <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                  {selectedDayInfo.assignedRoutine.category}
                </Text>
              </View>
            </View>

            <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-2.5">
              {selectedDayInfo.assignedRoutine.exercises.length} Exercises · ~{selectedDayInfo.assignedRoutine.estimatedDurationMinutes} mins
            </Text>

            {/* Exercise Pills */}
            <View className="flex-row flex-wrap gap-1.5 mb-3">
              {selectedDayInfo.assignedRoutine.exercises.slice(0, 4).map((ex, i) => (
                <View
                  key={i}
                  className="bg-background dark:bg-background-dark border border-input-border/50 px-2 py-0.5 rounded-md"
                >
                  <Text className="text-[10px] font-medium text-text-primary dark:text-text-primary-dark">
                    {ex.name}
                  </Text>
                </View>
              ))}
              {selectedDayInfo.assignedRoutine.exercises.length > 4 && (
                <View className="bg-background dark:bg-background-dark border border-input-border/50 px-2 py-0.5 rounded-md">
                  <Text className="text-[10px] text-text-muted font-bold">
                    +{selectedDayInfo.assignedRoutine.exercises.length - 4} more
                  </Text>
                </View>
              )}
            </View>

            {/* Actions for this routine */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onStartRoutine(selectedDayInfo.assignedRoutine!)}
                className="flex-1 py-2.5 rounded-xl bg-accent dark:bg-accent-dark flex-row items-center justify-center gap-1.5"
              >
                <Ionicons name="play" size={14} color="#FFFFFF" />
                <Text className="text-xs font-black text-white uppercase tracking-wider">
                  Start Routine Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleClearDaySchedule}
                className="px-3 py-2.5 rounded-xl bg-input dark:bg-input-dark border border-input-border"
              >
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ) : selectedDayInfo.isRest ? (
          <View className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-2xl bg-emerald-500/20 items-center justify-center">
                <Ionicons name="leaf-outline" size={20} color="#10B981" />
              </View>
              <View>
                <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark">
                  Rest & Recovery Day
                </Text>
                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
                  Scheduled recovery, active stretching, and rest
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleClearDaySchedule}
              className="p-1.5 rounded-lg bg-input dark:bg-input-dark"
            >
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="py-4 items-center justify-center bg-input/40 dark:bg-input-dark/40 rounded-2xl border border-dashed border-input-border dark:border-input-border-dark mb-3">
            <Ionicons name="calendar-outline" size={24} color={colors.textMuted} />
            <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark mt-1.5">
              No workout routine scheduled for this date
            </Text>
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity
                onPress={() => setIsAssignModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-accent dark:bg-accent-dark flex-row items-center gap-1"
              >
                <Ionicons name="add" size={14} color="#FFFFFF" />
                <Text className="text-xs font-black text-white">Assign Routine</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSelectRoutineForDate(null)}
                className="px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border flex-row items-center gap-1"
              >
                <Ionicons name="leaf-outline" size={14} color="#10B981" />
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                  Mark Rest
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SurfaceCard>

      {/* Routine Assignment Modal for Selected Date */}
      <AssignRoutineModal
        visible={isAssignModalOpen}
        day={{
          key: selectedDayInfo.dateStr,
          label: selectedDayInfo.dateStr,
          full: selectedDayInfo.formattedFull,
        }}
        currentRoutineId={selectedDayInfo.assignedRoutine?.id || (selectedDayInfo.isRest ? null : undefined as any)}
        routines={routines}
        onSelect={handleSelectRoutineForDate}
        onClose={() => setIsAssignModalOpen(false)}
        onCreateNew={onCreateRoutine}
      />
    </View>
  );
}
