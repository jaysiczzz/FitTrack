import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import SurfaceCard from '../ui/SurfaceCard';
import ConfirmModal from '../ui/ConfirmModal';
import {
  WorkoutRoutineTemplate,
  DayOfWeek,
  WeeklySplit,
  PlannerViewMode,
  MonthlySchedule,
  CompletedSession,
} from './workoutTypes';
import {
  DEFAULT_ROUTINE_TEMPLATES,
  DEFAULT_WEEKLY_SPLIT,
  DAYS_OF_WEEK,
  getTodayDayOfWeek,
  getDayOfWeekFromDate,
} from './plannerPresets';
import AssignRoutineModal from './AssignRoutineModal';
import CreateRoutineModal from './CreateRoutineModal';
import SplitPresetModal from './SplitPresetModal';
import MonthlyPlannerView from './MonthlyPlannerView';
import {
  getWorkoutPlanApi,
  updateWorkoutPlanApi,
  scheduleMonthlyRoutineApi,
  getWorkoutHistory,
} from '@/api/workout';

interface WorkoutPlannerTabProps {
  onStartRoutine: (routine: WorkoutRoutineTemplate) => void;
  onSwitchToToday: () => void;
  initialMode?: PlannerViewMode;
}

export default function WorkoutPlannerTab({
  onStartRoutine,
  onSwitchToToday,
  initialMode = 'daily',
}: WorkoutPlannerTabProps) {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const userId = user?.id;
  const { showSuccess, showToast } = useToast();

  const templatesKey = authStorage.getScopedKey(userId, 'workout_planner_templates');
  const splitKey = authStorage.getScopedKey(userId, 'workout_planner_split');
  const monthlyScheduleKey = authStorage.getScopedKey(userId, 'workout_planner_monthly_schedule');
  const monthlyTargetDaysKey = authStorage.getScopedKey(userId, 'workout_planner_monthly_target_days');
  const mesocycleWeekKey = authStorage.getScopedKey(userId, 'workout_planner_mesocycle_week');
  const viewModeKey = authStorage.getScopedKey(userId, 'workout_planner_view_mode');
  const historyKey = authStorage.getScopedKey(userId, 'fittrack_workout_history_cache');

  // Active planner tab mode: 'daily' | 'weekly' | 'monthly'
  const [viewMode, setViewMode] = useState<PlannerViewMode>(initialMode);

  // Core planner data
  const [routines, setRoutines] = useState<WorkoutRoutineTemplate[]>(DEFAULT_ROUTINE_TEMPLATES);
  const [weeklySplit, setWeeklySplit] = useState<WeeklySplit>(DEFAULT_WEEKLY_SPLIT);
  const [monthlySchedule, setMonthlySchedule] = useState<MonthlySchedule>({});
  const [monthlyTargetDays, setMonthlyTargetDays] = useState<number>(20);
  const [currentMesocycleWeek, setCurrentMesocycleWeek] = useState<number>(1);
  const [workoutHistory, setWorkoutHistory] = useState<CompletedSession[]>([]);

  // Modal states
  const [assignModalDay, setAssignModalDay] = useState<{
    key?: string;
    label: string;
    full: string;
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<WorkoutRoutineTemplate | null>(null);

  // Load saved routines and split from storage first, then sync with backend
  const loadPlannerData = useCallback(async () => {
    try {
      // 1. Instant local cache load
      const [
        savedTemplates,
        savedSplit,
        savedMonthlySchedule,
        savedTargetDays,
        savedMesoWeek,
        savedViewMode,
        cachedHistory,
      ] = await Promise.all([
        AsyncStorage.getItem(templatesKey),
        AsyncStorage.getItem(splitKey),
        AsyncStorage.getItem(monthlyScheduleKey),
        AsyncStorage.getItem(monthlyTargetDaysKey),
        AsyncStorage.getItem(mesocycleWeekKey),
        AsyncStorage.getItem(viewModeKey),
        AsyncStorage.getItem(historyKey),
      ]);

      if (savedTemplates) {
        try {
          const parsed = JSON.parse(savedTemplates);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRoutines(parsed);
          }
        } catch {}
      }

      if (savedSplit) {
        try {
          const parsed = JSON.parse(savedSplit);
          if (parsed && typeof parsed === 'object') {
            setWeeklySplit(parsed);
          }
        } catch {}
      }

      if (savedMonthlySchedule) {
        try {
          const parsed = JSON.parse(savedMonthlySchedule);
          if (parsed && typeof parsed === 'object') {
            setMonthlySchedule(parsed);
          }
        } catch {}
      }

      if (savedTargetDays) {
        const val = parseInt(savedTargetDays, 10);
        if (!isNaN(val) && val > 0) setMonthlyTargetDays(val);
      }

      if (savedMesoWeek) {
        const val = parseInt(savedMesoWeek, 10);
        if (!isNaN(val) && val >= 1 && val <= 4) setCurrentMesocycleWeek(val);
      }

      if (savedViewMode && (savedViewMode === 'daily' || savedViewMode === 'weekly' || savedViewMode === 'monthly')) {
        setViewMode(savedViewMode as PlannerViewMode);
      }

      if (cachedHistory) {
        try {
          const parsed = JSON.parse(cachedHistory);
          if (Array.isArray(parsed)) setWorkoutHistory(parsed);
        } catch {}
      }

      // 2. Background sync from cloud backend API
      try {
        const [cloudPlanRes, historyRes] = await Promise.all([
          getWorkoutPlanApi(),
          getWorkoutHistory(),
        ]);

        if (cloudPlanRes?.success && cloudPlanRes.plan) {
          const plan = cloudPlanRes.plan;
          if (plan.routineTemplates && Array.isArray(plan.routineTemplates) && plan.routineTemplates.length > 0) {
            setRoutines(plan.routineTemplates);
            AsyncStorage.setItem(templatesKey, JSON.stringify(plan.routineTemplates)).catch(() => {});
          }
          if (plan.weeklySplit && typeof plan.weeklySplit === 'object') {
            setWeeklySplit(plan.weeklySplit as WeeklySplit);
            AsyncStorage.setItem(splitKey, JSON.stringify(plan.weeklySplit)).catch(() => {});
          }
          if (plan.monthlySchedule && typeof plan.monthlySchedule === 'object') {
            setMonthlySchedule(plan.monthlySchedule as MonthlySchedule);
            AsyncStorage.setItem(monthlyScheduleKey, JSON.stringify(plan.monthlySchedule)).catch(() => {});
          }
          if (plan.monthlyTargetDays) {
            setMonthlyTargetDays(plan.monthlyTargetDays);
            AsyncStorage.setItem(monthlyTargetDaysKey, String(plan.monthlyTargetDays)).catch(() => {});
          }
          if (plan.currentMesocycleWeek) {
            setCurrentMesocycleWeek(plan.currentMesocycleWeek);
            AsyncStorage.setItem(mesocycleWeekKey, String(plan.currentMesocycleWeek)).catch(() => {});
          }
        }

        if (historyRes?.sessions && Array.isArray(historyRes.sessions)) {
          setWorkoutHistory(historyRes.sessions);
          AsyncStorage.setItem(historyKey, JSON.stringify(historyRes.sessions)).catch(() => {});
        }
      } catch (err) {
        console.log('[WorkoutPlanner] Using offline cache mode');
      }
    } catch (err) {
      console.log('Error loading planner data:', err);
    }
  }, [
    templatesKey,
    splitKey,
    monthlyScheduleKey,
    monthlyTargetDaysKey,
    mesocycleWeekKey,
    viewModeKey,
    historyKey,
  ]);

  useEffect(() => {
    loadPlannerData();
  }, [loadPlannerData]);

  // Mode switcher handler with persistence
  const handleSwitchMode = (mode: PlannerViewMode) => {
    setViewMode(mode);
    AsyncStorage.setItem(viewModeKey, mode).catch(() => {});
  };

  // Save changes to storage and cloud
  const saveRoutines = async (newRoutines: WorkoutRoutineTemplate[]) => {
    setRoutines(newRoutines);
    try {
      await AsyncStorage.setItem(templatesKey, JSON.stringify(newRoutines));
      updateWorkoutPlanApi({ routineTemplates: newRoutines }).catch(() => {});
    } catch (err) {
      console.log('Error saving routines:', err);
    }
  };

  const saveSplit = async (newSplit: WeeklySplit) => {
    setWeeklySplit(newSplit);
    try {
      await AsyncStorage.setItem(splitKey, JSON.stringify(newSplit));
      updateWorkoutPlanApi({ weeklySplit: newSplit }).catch(() => {});
    } catch (err) {
      console.log('Error saving weekly split:', err);
    }
  };

  const saveMonthlySchedule = async (newMonthly: MonthlySchedule) => {
    setMonthlySchedule(newMonthly);
    try {
      await AsyncStorage.setItem(monthlyScheduleKey, JSON.stringify(newMonthly));
      updateWorkoutPlanApi({ monthlySchedule: newMonthly }).catch(() => {});
    } catch (err) {
      console.log('Error saving monthly schedule:', err);
    }
  };

  const handleUpdateScheduleDay = async (
    dateKey: string,
    routineId: string | null,
    isRestDay: boolean,
    customNotes?: string
  ) => {
    const updated: MonthlySchedule = {
      ...monthlySchedule,
      [dateKey]: {
        routineId,
        isRestDay,
        customNotes: customNotes || null,
        updatedAt: new Date().toISOString(),
      },
    };
    saveMonthlySchedule(updated);

    // Call granular single-day schedule API in background
    scheduleMonthlyRoutineApi({
      dateKey,
      routineId,
      isRestDay,
      customNotes,
    }).catch(() => {});
  };

  // Auto-Fill Entire Month using 7-day Weekly Split
  const handleAutoFillMonthFromSplit = async (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const updated = { ...monthlySchedule };

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dow = getDayOfWeekFromDate(dateObj);
      const routineId = weeklySplit[dow];
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      updated[dateKey] = {
        routineId: routineId || null,
        isRestDay: routineId === null,
        customNotes: null,
        updatedAt: new Date().toISOString(),
      };
    }

    await saveMonthlySchedule(updated);
  };

  const handleUpdateTargetDays = async (targetDays: number) => {
    setMonthlyTargetDays(targetDays);
    AsyncStorage.setItem(monthlyTargetDaysKey, String(targetDays)).catch(() => {});
    updateWorkoutPlanApi({ monthlyTargetDays: targetDays }).catch(() => {});
  };

  const handleUpdateMesocycleWeek = async (weekNumber: number) => {
    setCurrentMesocycleWeek(weekNumber);
    AsyncStorage.setItem(mesocycleWeekKey, String(weekNumber)).catch(() => {});
    updateWorkoutPlanApi({ currentMesocycleWeek: weekNumber }).catch(() => {});
  };

  // Today's scheduled routine
  const todayDay = getTodayDayOfWeek();
  const todayRoutineId = weeklySplit[todayDay];
  const todayRoutine = useMemo(
    () => routines.find((r) => r.id === todayRoutineId) || null,
    [routines, todayRoutineId]
  );

  const handleAssignRoutineToDay = (routineId: string | null) => {
    if (!assignModalDay) return;
    const key = assignModalDay.key as DayOfWeek;
    if (key && (key in weeklySplit)) {
      const updated = {
        ...weeklySplit,
        [key]: routineId,
      };
      saveSplit(updated);
      showSuccess(
        'Schedule Updated',
        routineId
          ? `Assigned to ${assignModalDay.full}`
          : `Marked ${assignModalDay.full} as Rest Day`
      );
    }
  };

  const handleApplyPreset = (newSplit: WeeklySplit) => {
    saveSplit(newSplit);
    showSuccess('Split Applied', 'Updated your weekly workout schedule');
  };

  const handleCreateRoutine = (newRoutine: WorkoutRoutineTemplate) => {
    const updated = [newRoutine, ...routines];
    saveRoutines(updated);
    showSuccess('Routine Created', `Saved "${newRoutine.title}"`);
  };

  const handleDeleteRoutine = (routineId: string) => {
    const toDelete = routines.find((r) => r.id === routineId);
    if (toDelete) {
      setRoutineToDelete(toDelete);
    }
  };

  const handleConfirmDeleteRoutine = () => {
    if (!routineToDelete) return;
    const routineId = routineToDelete.id;
    const updated = routines.filter((r) => r.id !== routineId);
    saveRoutines(updated);
    // Also unassign from split if used
    const updatedSplit = { ...weeklySplit };
    Object.keys(updatedSplit).forEach((k) => {
      if (updatedSplit[k as DayOfWeek] === routineId) {
        updatedSplit[k as DayOfWeek] = null;
      }
    });
    saveSplit(updatedSplit);
    setRoutineToDelete(null);
    showToast({
      message: 'Routine Deleted',
      type: 'info',
      iconName: 'trash',
    });
  };

  return (
    <View className="mb-6">
      {/* 3-Segment View Switcher: Daily | Weekly | Monthly */}
      <View className="flex-row bg-input dark:bg-input-dark p-1 rounded-2xl mb-4 border border-input-border dark:border-input-border-dark">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleSwitchMode('daily')}
          className={`flex-1 py-2.5 rounded-xl items-center justify-center flex-row gap-1.5 ${
            viewMode === 'daily'
              ? 'bg-background dark:bg-background-dark shadow-sm border border-input-border/40'
              : ''
          }`}
        >
          <Ionicons
            name="today"
            size={14}
            color={viewMode === 'daily' ? colors.accent : colors.textMuted}
          />
          <Text
            className={`text-xs font-black ${
              viewMode === 'daily'
                ? 'text-accent dark:text-accent-dark'
                : 'text-text-muted dark:text-text-muted-dark'
            }`}
          >
            Daily Plan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleSwitchMode('weekly')}
          className={`flex-1 py-2.5 rounded-xl items-center justify-center flex-row gap-1.5 ${
            viewMode === 'weekly'
              ? 'bg-background dark:bg-background-dark shadow-sm border border-input-border/40'
              : ''
          }`}
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={viewMode === 'weekly' ? colors.accent : colors.textMuted}
          />
          <Text
            className={`text-xs font-black ${
              viewMode === 'weekly'
                ? 'text-accent dark:text-accent-dark'
                : 'text-text-muted dark:text-text-muted-dark'
            }`}
          >
            Weekly Split
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleSwitchMode('monthly')}
          className={`flex-1 py-2.5 rounded-xl items-center justify-center flex-row gap-1.5 ${
            viewMode === 'monthly'
              ? 'bg-background dark:bg-background-dark shadow-sm border border-input-border/40'
              : ''
          }`}
        >
          <Ionicons
            name="calendar"
            size={14}
            color={viewMode === 'monthly' ? colors.accent : colors.textMuted}
          />
          <Text
            className={`text-xs font-black ${
              viewMode === 'monthly'
                ? 'text-accent dark:text-accent-dark'
                : 'text-text-muted dark:text-text-muted-dark'
            }`}
          >
            Monthly
          </Text>
        </TouchableOpacity>
      </View>

      {/* VIEW 1: DAILY PLAN */}
      {viewMode === 'daily' && (
        <View>
          {/* Today's Scheduled Plan Card */}
          <SurfaceCard className="mb-4 p-4 border border-accent/40 bg-accent/5 dark:bg-accent-dark/10">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full bg-accent dark:bg-accent-dark animate-pulse" />
                <Text className="text-[11px] font-black text-accent dark:text-accent-dark uppercase tracking-wider">
                  Today's Scheduled Routine
                </Text>
              </View>
              <View className="bg-accent/20 dark:bg-accent-dark/30 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-accent dark:text-accent-dark uppercase">
                  {DAYS_OF_WEEK.find((d) => d.key === todayDay)?.full || 'Today'}
                </Text>
              </View>
            </View>

            {todayRoutine ? (
              <View>
                <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark mb-1">
                  {todayRoutine.title}
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-3 leading-relaxed">
                  {todayRoutine.exercises.length} Exercises · ~{todayRoutine.estimatedDurationMinutes} min · {todayRoutine.category}
                </Text>

                {/* Exercise preview pills */}
                <View className="flex-row flex-wrap gap-1.5 mb-3">
                  {todayRoutine.exercises.slice(0, 3).map((ex, i) => (
                    <View key={i} className="bg-input dark:bg-input-dark px-2.5 py-1 rounded-lg">
                      <Text className="text-[10px] font-bold text-text-primary dark:text-text-primary-dark">
                        {ex.name}
                      </Text>
                    </View>
                  ))}
                  {todayRoutine.exercises.length > 3 && (
                    <View className="bg-input dark:bg-input-dark px-2 py-1 rounded-lg">
                      <Text className="text-[10px] text-text-muted font-bold">
                        +{todayRoutine.exercises.length - 3} more
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onStartRoutine(todayRoutine)}
                  className="bg-accent dark:bg-accent-dark py-3 rounded-xl items-center flex-row justify-center gap-2 shadow-sm"
                >
                  <Ionicons name="play" size={16} color="#FFFFFF" />
                  <Text className="text-white text-xs font-black uppercase tracking-wider">
                    Start Today's Workout
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row items-center justify-between py-1">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center">
                    <Ionicons name="leaf-outline" size={20} color="#10B981" />
                  </View>
                  <View>
                    <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark">
                      Rest & Recovery Day
                    </Text>
                    <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
                      No workout scheduled today. Stretch & hydrate!
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    const dayObj = DAYS_OF_WEEK.find((d) => d.key === todayDay);
                    if (dayObj) setAssignModalDay(dayObj);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
                >
                  <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                    Change
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </SurfaceCard>

          {/* Quick Switch Shortcuts Card */}
          <SurfaceCard className="mb-4 p-4">
            <Text className="text-xs font-black text-text-primary dark:text-text-primary-dark uppercase tracking-wider mb-2">
              Planner Shortcuts
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleSwitchMode('weekly')}
                className="flex-1 p-3 rounded-xl bg-input dark:bg-input-dark border border-input-border flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    Edit 7-Day Split
                  </Text>
                  <Text className="text-[10px] text-text-muted mt-0.5">Customize days</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSwitchMode('monthly')}
                className="flex-1 p-3 rounded-xl bg-input dark:bg-input-dark border border-input-border flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    Month Overview
                  </Text>
                  <Text className="text-[10px] text-text-muted mt-0.5">Full calendar view</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </SurfaceCard>

          {/* Available Workout Routines Quick Starter */}
          <View className="flex-row justify-between items-center mb-3 mt-1">
            <View>
              <Text className="text-base font-black text-text-primary dark:text-text-primary-dark">
                Quick-Start Routines
              </Text>
              <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
                Start any routine right now
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              className="bg-accent dark:bg-accent-dark px-3 py-1.5 rounded-xl flex-row items-center gap-1"
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold">New</Text>
            </TouchableOpacity>
          </View>

          {routines.map((routine) => (
            <SurfaceCard key={routine.id} className="mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark">
                      {routine.title}
                    </Text>
                    {routine.isCustom && (
                      <View className="bg-accent/20 px-1.5 py-0.5 rounded-md">
                        <Text className="text-[9px] font-bold text-accent dark:text-accent-dark">
                          Custom
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                    {routine.exercises.length} Exercises · ~{routine.estimatedDurationMinutes} min · {routine.category}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onStartRoutine(routine)}
                  className="px-3 py-1.5 rounded-xl bg-accent dark:bg-accent-dark flex-row items-center gap-1"
                >
                  <Ionicons name="play" size={12} color="#FFFFFF" />
                  <Text className="text-white text-xs font-black uppercase">Start</Text>
                </TouchableOpacity>
              </View>
            </SurfaceCard>
          ))}
        </View>
      )}

      {/* VIEW 2: WEEKLY SPLIT */}
      {viewMode === 'weekly' && (
        <View>
          {/* 7-Day Weekly Split Schedule */}
          <SurfaceCard className="mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <View>
                <Text className="text-base font-black text-text-primary dark:text-text-primary-dark">
                  Weekly Training Split
                </Text>
                <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
                  Tap any day to assign a routine or rest day
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPresetModal(true)}
                className="bg-accent/15 dark:bg-accent-dark/25 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1"
              >
                <Ionicons name="options-outline" size={13} color={colors.accent} />
                <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                  Split Presets
                </Text>
              </TouchableOpacity>
            </View>

            {DAYS_OF_WEEK.map((d) => {
              const isToday = d.key === todayDay;
              const assignedId = weeklySplit[d.key];
              const matched = routines.find((r) => r.id === assignedId);

              return (
                <TouchableOpacity
                  key={d.key}
                  activeOpacity={0.8}
                  onPress={() => setAssignModalDay(d)}
                  className={`py-3 px-3.5 rounded-2xl mb-2 border flex-row items-center justify-between ${
                    isToday
                      ? 'bg-accent/10 dark:bg-accent-dark/15 border-accent/50'
                      : 'bg-input dark:bg-input-dark border-input-border/60 dark:border-input-border-dark/60'
                  }`}
                >
                  {/* Day Label & Badge */}
                  <View className="flex-row items-center gap-3 flex-1 mr-2">
                    <View
                      className={`w-10 h-10 rounded-xl items-center justify-center ${
                        isToday
                          ? 'bg-accent dark:bg-accent-dark'
                          : 'bg-background dark:bg-background-dark'
                      }`}
                    >
                      <Text
                        className={`text-xs font-black uppercase ${
                          isToday
                            ? 'text-white'
                            : 'text-text-muted dark:text-text-muted-dark'
                        }`}
                      >
                        {d.label}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                          {d.full}
                        </Text>
                        {isToday && (
                          <View className="bg-accent/20 px-1.5 py-0.2 rounded">
                            <Text className="text-[9px] font-black text-accent dark:text-accent-dark uppercase">
                              Today
                            </Text>
                          </View>
                        )}
                      </View>

                      {matched ? (
                        <Text
                          numberOfLines={1}
                          className="text-xs font-semibold text-accent dark:text-accent-dark mt-0.5"
                        >
                          {matched.title} ({matched.exercises.length} ex)
                        </Text>
                      ) : (
                        <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                          Rest & Recovery
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Status / Chevron */}
                  <View className="flex-row items-center gap-1">
                    {matched ? (
                      <View className="w-2 h-2 rounded-full bg-accent dark:bg-accent-dark mr-1" />
                    ) : (
                      <View className="w-2 h-2 rounded-full bg-input-border dark:bg-input-border-dark mr-1" />
                    )}
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </SurfaceCard>

          {/* Routine Templates Collection */}
          <View className="flex-row justify-between items-center mb-3 mt-2">
            <View>
              <Text className="text-base font-black text-text-primary dark:text-text-primary-dark">
                Routine Templates ({routines.length})
              </Text>
              <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
                Reusable workout templates you can start anytime
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              className="bg-accent dark:bg-accent-dark px-3 py-1.5 rounded-xl flex-row items-center gap-1"
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold">New Routine</Text>
            </TouchableOpacity>
          </View>

          {routines.map((routine) => (
            <SurfaceCard key={routine.id} className="mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-base font-black text-text-primary dark:text-text-primary-dark">
                      {routine.title}
                    </Text>
                    {routine.isCustom && (
                      <View className="bg-accent/20 px-1.5 py-0.5 rounded-md">
                        <Text className="text-[9px] font-bold text-accent dark:text-accent-dark">
                          Custom
                        </Text>
                      </View>
                    )}
                  </View>
                  {routine.description && (
                    <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-2 leading-relaxed">
                      {routine.description}
                    </Text>
                  )}
                </View>

                {routine.isCustom ? (
                  <TouchableOpacity
                    onPress={() => handleDeleteRoutine(routine.id)}
                    className="p-1"
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Metric Chips */}
              <View className="flex-row items-center gap-2 mb-3 bg-input dark:bg-input-dark p-2.5 rounded-xl border border-input-border dark:border-input-border-dark">
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                  {routine.exercises.length} Exercises
                </Text>
                <Text className="text-text-muted text-xs">·</Text>
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                  ~{routine.estimatedDurationMinutes} min
                </Text>
                <Text className="text-text-muted text-xs">·</Text>
                <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                  {routine.category}
                </Text>
              </View>

              {/* Exercises Chips List */}
              <View className="flex-row flex-wrap gap-1.5 mb-3.5">
                {routine.exercises.map((ex, i) => (
                  <View
                    key={i}
                    className="bg-input/60 dark:bg-input-dark/60 border border-input-border/40 dark:border-input-border-dark/40 px-2.5 py-1 rounded-lg"
                  >
                    <Text className="text-[11px] font-medium text-text-primary dark:text-text-primary-dark">
                      {ex.name}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Action Button: Start Routine Now */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onStartRoutine(routine)}
                className="py-2.5 rounded-xl bg-accent/15 dark:bg-accent-dark/20 border border-accent/40 dark:border-accent-dark/40 flex-row items-center justify-center gap-1.5"
              >
                <Ionicons name="barbell-outline" size={15} color={colors.accent} />
                <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                  Start This Routine in Today's Workout
                </Text>
              </TouchableOpacity>
            </SurfaceCard>
          ))}
        </View>
      )}

      {/* VIEW 3: MONTHLY PLANNER & PERIODIZATION */}
      {viewMode === 'monthly' && (
        <MonthlyPlannerView
          routines={routines}
          weeklySplit={weeklySplit}
          monthlySchedule={monthlySchedule}
          monthlyTargetDays={monthlyTargetDays}
          currentMesocycleWeek={currentMesocycleWeek}
          onUpdateScheduleDay={handleUpdateScheduleDay}
          onAutoFillMonthFromSplit={handleAutoFillMonthFromSplit}
          onUpdateTargetDays={handleUpdateTargetDays}
          onUpdateMesocycleWeek={handleUpdateMesocycleWeek}
          onStartRoutine={onStartRoutine}
          onCreateRoutine={() => setShowCreateModal(true)}
          workoutHistory={workoutHistory}
        />
      )}

      {/* Modals */}
      <AssignRoutineModal
        visible={Boolean(assignModalDay)}
        day={assignModalDay}
        currentRoutineId={assignModalDay?.key ? weeklySplit[assignModalDay.key as DayOfWeek] : null}
        routines={routines}
        onSelect={handleAssignRoutineToDay}
        onClose={() => setAssignModalDay(null)}
        onCreateNew={() => setShowCreateModal(true)}
      />

      <CreateRoutineModal
        visible={showCreateModal}
        onSave={handleCreateRoutine}
        onClose={() => setShowCreateModal(false)}
      />

      <SplitPresetModal
        visible={showPresetModal}
        onSelectPreset={handleApplyPreset}
        onClose={() => setShowPresetModal(false)}
      />

      {/* Delete Routine Confirmation Modal */}
      <ConfirmModal
        visible={Boolean(routineToDelete)}
        title="Delete Routine Template"
        message={`Are you sure you want to delete "${routineToDelete?.title}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger
        iconName="trash-outline"
        onConfirm={handleConfirmDeleteRoutine}
        onCancel={() => setRoutineToDelete(null)}
      />
    </View>
  );
}
