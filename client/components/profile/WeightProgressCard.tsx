import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { authStorage } from '@/utils/authStorage';
import SurfaceCard from '../ui/SurfaceCard';
import ProgressBar from '../ui/ProgressBar';
import ConfirmModal from '../ui/ConfirmModal';
import LogWeightModal from './LogWeightModal';
import SetTargetWeightModal from './SetTargetWeightModal';
import {
  getWeightLogsApi,
  saveWeightLogApi,
  deleteWeightLogApi,
  setTargetWeightApi,
  WeightLogItem,
  WeightStats,
} from '@/api/weight';

interface WeightProgressCardProps {
  onWeightUpdated?: (newWeight: number) => void;
}

export default function WeightProgressCard({ onWeightUpdated }: WeightProgressCardProps) {
  const { colors, isDark } = useThemeColors();
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const userId = user?.id;

  const storageKey = authStorage.getScopedKey(userId, 'fittrack_weight_logs_cache');

  // State
  const [logs, setLogs] = useState<WeightLogItem[]>([]);
  const [stats, setStats] = useState<WeightStats>({
    currentWeight: user?.weight || 70,
    startingWeight: user?.weight || 70,
    targetWeight: user?.targetWeight || null,
    totalChange: 0,
    remainingToGoal: null,
    progressPercentage: 0,
    weeklyAverage: user?.weight || 70,
    monthlyAverage: user?.weight || 70,
    logCount: 0,
    trend: 'stable',
  });
  const [loading, setLoading] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [logToDelete, setLogToDelete] = useState<WeightLogItem | null>(null);

  // Load from local storage first, then fetch from API
  const loadWeightData = useCallback(async () => {
    // 1. Instant local cache load
    try {
      const cached = await AsyncStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.logs && Array.isArray(parsed.logs)) {
          setLogs(parsed.logs);
        }
        if (parsed.stats) {
          setStats(parsed.stats);
        }
      }
    } catch (e) {
      console.log('Error reading local weight cache:', e);
    }

    // 2. Fresh fetch from backend
    try {
      const res = await getWeightLogsApi();
      if (res.success) {
        setLogs(res.logs);
        setStats(res.stats);
        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify({ logs: res.logs, stats: res.stats })
        );
      }
    } catch (err) {
      // Offline fallback already loaded
    }
  }, [storageKey]);

  useEffect(() => {
    loadWeightData();
  }, [loadWeightData]);

  // Handle Save Weigh-in
  const handleSaveWeight = async (weight: number, date: string, notes?: string) => {
    try {
      const res = await saveWeightLogApi({ weight, date, notes });
      if (res.success) {
        setLogs(res.logs);
        setStats(res.stats);
        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify({ logs: res.logs, stats: res.stats })
        );

        if (user && res.stats.currentWeight !== user.weight) {
          await updateUser({ ...user, weight: res.stats.currentWeight });
        }
        if (onWeightUpdated) {
          onWeightUpdated(res.stats.currentWeight);
        }

        showSuccess('Weigh-In Saved', `${weight.toFixed(1)} kg logged for ${date}`);
      }
    } catch (err: any) {
      showError('Error', err?.message || 'Could not save weigh-in. Check your connection.');
      throw err;
    }
  };

  // Handle Target Weight Save
  const handleSaveTarget = async (targetWeight: number | null) => {
    try {
      const res = await setTargetWeightApi(targetWeight);
      if (res.success) {
        setStats(res.stats);
        if (user) {
          await updateUser({ ...user, targetWeight });
        }
        showSuccess(
          'Target Updated',
          targetWeight ? `Target goal set to ${targetWeight.toFixed(1)} kg` : 'Target goal cleared.'
        );
      }
    } catch (err: any) {
      showError('Error', err?.message || 'Could not update target weight.');
      throw err;
    }
  };

  // Handle Delete Weigh-in
  const handleConfirmDelete = async () => {
    if (!logToDelete) return;
    const targetId = logToDelete.id;
    setLogToDelete(null);

    try {
      const res = await deleteWeightLogApi(targetId);
      if (res.success) {
        setLogs(res.logs);
        setStats(res.stats);
        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify({ logs: res.logs, stats: res.stats })
        );

        if (user && res.stats.currentWeight !== user.weight) {
          await updateUser({ ...user, weight: res.stats.currentWeight });
        }
        if (onWeightUpdated) {
          onWeightUpdated(res.stats.currentWeight);
        }

        showSuccess('Deleted', 'Weigh-in entry removed.');
      }
    } catch (err: any) {
      showError('Error', err?.message || 'Failed to delete weigh-in.');
    }
  };

  // Compute graph data from chronological logs (last 7 to 10 entries)
  const chartData = useMemo(() => {
    if (logs.length === 0) return [];
    const sorted = [...logs].reverse().slice(-8); // chronological last 8 entries
    const weights = sorted.map((l) => l.weight);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const range = maxW - minW || 1;

    return sorted.map((item, idx) => {
      const prevWeight = idx > 0 ? sorted[idx - 1].weight : item.weight;
      const delta = Number((item.weight - prevWeight).toFixed(1));
      // normalized percentage for relative bar height (between 30% and 100%)
      const heightPercent = Math.round(30 + ((item.weight - minW) / range) * 70);
      const dateParts = item.date.split('-');
      const label = `${dateParts[1]}/${dateParts[2]}`;

      return {
        ...item,
        label,
        delta,
        heightPercent,
      };
    });
  }, [logs]);

  const userGoal = user?.goal || 'WEIGHT_LOSS';
  const isLoss = userGoal === 'WEIGHT_LOSS';

  return (
    <SurfaceCard className="mb-3">
      {/* Header: Title, Trend & Action */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-text-primary dark:text-text-primary-dark font-black text-sm">
              Weight & Body Progress
            </Text>
            {stats.logCount > 0 && stats.totalChange !== 0 ? (
              <View
                className={`px-2 py-0.5 rounded-full border flex-row items-center ${
                  (isLoss && stats.totalChange < 0) || (!isLoss && stats.totalChange > 0)
                    ? 'bg-emerald-500/15 border-emerald-500/30'
                    : 'bg-amber-500/15 border-amber-500/30'
                }`}
              >
                <Text className="text-[10px] mr-1">
                  {stats.totalChange < 0 ? '📉' : '📈'}
                </Text>
                <Text
                  className={`text-[10px] font-extrabold ${
                    (isLoss && stats.totalChange < 0) || (!isLoss && stats.totalChange > 0)
                      ? 'text-accent dark:text-accent-dark'
                      : 'text-amber-500 dark:text-amber-400'
                  }`}
                >
                  {stats.totalChange > 0 ? `+${stats.totalChange}` : stats.totalChange} kg
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
            {stats.logCount > 0
              ? `${stats.logCount} weigh-ins logged · ${stats.trend} trend`
              : 'Track weigh-ins over time to monitor progress'}
          </Text>
        </View>

        {/* Quick Log Weigh-In Button */}
        <TouchableOpacity
          onPress={() => setShowLogModal(true)}
          activeOpacity={0.8}
          className="bg-accent dark:bg-accent-dark px-3 py-1.5 rounded-xl flex-row items-center shadow-xs"
        >
          <Ionicons name="add" size={14} color="#FFFFFF" style={{ marginRight: 2 }} />
          <Text className="text-white text-xs font-bold">
            Log Weight
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3-Pillar Stat Box: START, CURRENT, TARGET */}
      <View className="bg-input/50 dark:bg-input-dark/50 rounded-2xl p-3 mb-3 border border-input-border dark:border-input-border-dark flex-row justify-around items-center">
        {/* Start */}
        <View className="items-center flex-1">
          <Text className="text-[9px] uppercase tracking-wider font-bold text-text-muted dark:text-text-muted-dark mb-0.5">
            STARTING
          </Text>
          <Text className="text-text-primary dark:text-text-primary-dark text-base font-black">
            {stats.startingWeight ? `${stats.startingWeight.toFixed(1)}` : '—'}
            <Text className="text-[10px] font-normal text-text-muted ml-0.5"> kg</Text>
          </Text>
        </View>

        <View className="w-[1px] h-7 bg-input-border dark:bg-input-border-dark" />

        {/* Current */}
        <View className="items-center flex-1">
          <Text className="text-[9px] uppercase tracking-wider font-bold text-accent dark:text-accent-dark mb-0.5">
            CURRENT
          </Text>
          <Text className="text-accent dark:text-accent-dark text-xl font-black">
            {stats.currentWeight ? `${stats.currentWeight.toFixed(1)}` : '—'}
            <Text className="text-xs font-normal ml-0.5"> kg</Text>
          </Text>
        </View>

        <View className="w-[1px] h-7 bg-input-border dark:bg-input-border-dark" />

        {/* Target */}
        <TouchableOpacity
          onPress={() => setShowTargetModal(true)}
          activeOpacity={0.7}
          className="items-center flex-1"
        >
          <View className="flex-row items-center gap-0.5 mb-0.5">
            <Text className="text-[9px] uppercase tracking-wider font-bold text-text-muted dark:text-text-muted-dark">
              TARGET
            </Text>
            <Ionicons name="pencil" size={10} color={colors.textMuted} />
          </View>
          {stats.targetWeight ? (
            <Text className="text-text-primary dark:text-text-primary-dark text-base font-black">
              {stats.targetWeight.toFixed(1)}
              <Text className="text-[10px] font-normal text-text-muted ml-0.5"> kg</Text>
            </Text>
          ) : (
            <Text className="text-accent dark:text-accent-dark text-xs font-bold underline">
              + Set Goal
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Target Progress Bar (if target is set) */}
      {stats.targetWeight !== null ? (
        <View className="mb-3.5 px-0.5">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
              Goal Progress
            </Text>
            <Text className="text-xs font-extrabold text-accent dark:text-accent-dark">
              {stats.progressPercentage}%
              {stats.remainingToGoal !== null ? (
                <Text className="text-text-muted dark:text-text-muted-dark font-normal">
                  {' '}· {stats.remainingToGoal} kg left
                </Text>
              ) : null}
            </Text>
          </View>
          <ProgressBar
            percentage={stats.progressPercentage}
            height={7}
            color="#10B981"
          />
        </View>
      ) : null}

      {/* Visual Weight Trend Graph (Last 8 entries) */}
      {chartData.length > 1 ? (
        <View className="mb-3 p-3 bg-input/30 dark:bg-input-dark/30 rounded-2xl border border-input-border/70 dark:border-input-border-dark/70">
          <View className="flex-row justify-between items-center mb-2 px-1">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-text-muted dark:text-text-muted-dark">
              Recent Weigh-In Trend
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-[10px] font-semibold text-text-muted dark:text-text-muted-dark">
                7D Avg: <Text className="font-bold text-text-primary dark:text-text-primary-dark">{stats.weeklyAverage.toFixed(1)}</Text>
              </Text>
              <Text className="text-[10px] font-semibold text-text-muted dark:text-text-muted-dark">
                30D Avg: <Text className="font-bold text-text-primary dark:text-text-primary-dark">{stats.monthlyAverage.toFixed(1)}</Text>
              </Text>
            </View>
          </View>

          {/* Bar / Sparkline Visualization */}
          <View className="flex-row items-end justify-between h-24 pt-3 pb-1 px-1">
            {chartData.map((item, idx) => {
              const isLatest = idx === chartData.length - 1;
              return (
                <View key={item.id} className="flex-1 items-center justify-end h-full px-1">
                  {/* Weight label over bar */}
                  <Text className={`text-[9px] mb-1 font-bold ${isLatest ? 'text-accent dark:text-accent-dark' : 'text-text-muted'}`}>
                    {item.weight.toFixed(1)}
                  </Text>

                  {/* Relative Height Bar */}
                  <View
                    className={`w-full rounded-t-md transition-all ${
                      isLatest
                        ? 'bg-accent dark:bg-accent-dark'
                        : 'bg-emerald-500/25 dark:bg-emerald-500/30'
                    }`}
                    style={{ height: `${item.heightPercent}%` }}
                  />

                  {/* Date label under bar */}
                  <Text className="text-[8px] font-semibold text-text-muted mt-1.5" numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* History Drawer Toggle & View */}
      <View className="pt-2 border-t border-input-border dark:border-input-border-dark flex-row justify-between items-center">
        <TouchableOpacity
          onPress={() => setShowHistory(!showHistory)}
          activeOpacity={0.7}
          className="flex-row items-center gap-1 py-1"
        >
          <Ionicons
            name={showHistory ? 'chevron-up' : 'calendar-outline'}
            size={14}
            color={colors.accent}
          />
          <Text className="text-xs font-bold text-accent dark:text-accent-dark">
            {showHistory ? 'Hide Weigh-In History' : `View Log History (${logs.length})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowTargetModal(true)}
          activeOpacity={0.7}
          className="flex-row items-center gap-1 py-1"
        >
          <Ionicons name="flag-outline" size={13} color={colors.textMuted} />
          <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
            {stats.targetWeight ? 'Edit Target Goal' : 'Set Target Goal'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expandable History List */}
      {showHistory && (
        <View className="mt-3 pt-2 border-t border-input-border/60 dark:border-input-border-dark/60">
          {logs.length === 0 ? (
            <View className="py-4 items-center justify-center">
              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                No weigh-in records found. Tap "Log Weight" above to get started!
              </Text>
            </View>
          ) : (
            <View className="gap-2 max-h-64">
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {logs.map((item, idx) => {
                  const nextItem = logs[idx + 1];
                  const delta = nextItem ? Number((item.weight - nextItem.weight).toFixed(1)) : null;

                  return (
                    <View
                      key={item.id}
                      className="flex-row items-center justify-between p-2.5 mb-1.5 rounded-xl bg-input/40 dark:bg-input-dark/40 border border-input-border dark:border-input-border-dark"
                    >
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                            {item.date}
                          </Text>
                          {delta !== null ? (
                            <View
                              className={`px-1.5 py-0.2 rounded-md ${
                                delta < 0
                                  ? 'bg-emerald-500/15'
                                  : delta > 0
                                  ? 'bg-amber-500/15'
                                  : 'bg-input'
                              }`}
                            >
                              <Text
                                className={`text-[10px] font-bold ${
                                  delta < 0
                                    ? 'text-accent dark:text-accent-dark'
                                    : delta > 0
                                    ? 'text-amber-500 dark:text-amber-400'
                                    : 'text-text-muted'
                                }`}
                              >
                                {delta > 0 ? `+${delta}` : delta} kg
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        {item.notes ? (
                          <Text
                            className="text-[11px] text-text-muted dark:text-text-muted-dark italic mt-0.5"
                            numberOfLines={1}
                          >
                            "{item.notes}"
                          </Text>
                        ) : null}
                      </View>

                      <View className="flex-row items-center gap-3">
                        <Text className="text-sm font-black text-text-primary dark:text-text-primary-dark">
                          {item.weight.toFixed(1)} kg
                        </Text>

                        <TouchableOpacity
                          onPress={() => setLogToDelete(item)}
                          activeOpacity={0.7}
                          className="w-7 h-7 rounded-lg bg-danger/10 items-center justify-center"
                        >
                          <Ionicons name="trash-outline" size={13} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* Log Weight Modal */}
      <LogWeightModal
        visible={showLogModal}
        onClose={() => setShowLogModal(false)}
        currentWeight={stats.currentWeight}
        onSaveWeight={handleSaveWeight}
      />

      {/* Set Target Weight Modal */}
      <SetTargetWeightModal
        visible={showTargetModal}
        onClose={() => setShowTargetModal(false)}
        currentTargetWeight={stats.targetWeight}
        currentWeight={stats.currentWeight}
        goal={userGoal}
        onSaveTarget={handleSaveTarget}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={Boolean(logToDelete)}
        title="Delete Weigh-In"
        message={`Are you sure you want to delete the weigh-in of ${logToDelete?.weight.toFixed(1)} kg on ${logToDelete?.date}?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDanger
        onConfirm={handleConfirmDelete}
        onCancel={() => setLogToDelete(null)}
      />
    </SurfaceCard>
  );
}
