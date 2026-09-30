import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { triggerHapticFeedback } from '@/utils/haptics';
import SurfaceCard from '@/components/ui/SurfaceCard';
import { AdminSystemStats } from '@/api/admin';

interface AdminOverviewTabProps {
  stats: AdminSystemStats | null;
  loading: boolean;
  refreshing: boolean;
  onNavigateTab: (tab: 'users' | 'finance' | 'exercises' | 'support') => void;
}

export default function AdminOverviewTab({
  stats,
  loading,
  refreshing,
  onNavigateTab,
}: AdminOverviewTabProps) {
  const { colors } = useThemeColors();

  if (loading && !refreshing) {
    return (
      <View className="py-20 items-center justify-center">
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-3">
          Aggregating live platform metrics...
        </Text>
      </View>
    );
  }

  if (!stats) return null;

  return (
    <View className="gap-4">
      {/* Hero Platform Financial Card */}
      <SurfaceCard className="border-amber-500/40 dark:border-amber-500/40 p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-lg bg-amber-500/20 items-center justify-center">
              <Ionicons name="wallet-outline" size={16} color="#F59E0B" />
            </View>
            <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
              Platform Master Wallet
            </Text>
          </View>
          <View className="bg-amber-500/10 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-bold text-amber-500 uppercase">
              Real Treasury
            </Text>
          </View>
        </View>

        <View className="flex-row items-baseline gap-1 mb-1">
          <Text className="text-3xl font-extrabold text-amber-500">
            ₱{(stats.financials.platformBalance * 58).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
            PHP (approx)
          </Text>
        </View>
        <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-3">
          USD: ${stats.financials.platformBalance.toFixed(2)} {stats.financials.currency}
        </Text>

        <View className="flex-row gap-2 pt-3 border-t border-input-border dark:border-input-border-dark">
          <View className="flex-1 bg-surface-card dark:bg-surface-card-dark p-2.5 rounded-xl">
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Monthly (MRR)</Text>
            <Text className="text-sm font-extrabold text-text-primary dark:text-text-primary-dark">
              ${stats.financials.mrr.toFixed(2)}
            </Text>
          </View>
          <View className="flex-1 bg-surface-card dark:bg-surface-card-dark p-2.5 rounded-xl">
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Pro Athletes</Text>
            <Text className="text-sm font-extrabold text-accent dark:text-accent-dark">
              {stats.financials.activeProSubscribers} active
            </Text>
          </View>
          <View className="flex-1 bg-surface-card dark:bg-surface-card-dark p-2.5 rounded-xl">
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Gross Volume</Text>
            <Text className="text-sm font-extrabold text-emerald-500">
              ${stats.financials.grossRevenue.toFixed(2)}
            </Text>
          </View>
        </View>
      </SurfaceCard>

      {/* 2x2 Activity & User Grid */}
      <View className="flex-row gap-3">
        {/* Users */}
        <SurfaceCard className="flex-1 p-3.5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase">
              Athletes
            </Text>
            <Ionicons name="people" size={16} color={colors.accent} />
          </View>
          <Text className="text-2xl font-extrabold text-text-primary dark:text-text-primary-dark">
            {stats.users.athletes}
          </Text>
          <Text className="text-[10px] text-emerald-500 mt-1 font-semibold">
            +{stats.users.newThisWeek} new this week
          </Text>
        </SurfaceCard>

        {/* Today's Workouts */}
        <SurfaceCard className="flex-1 p-3.5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase">
              Workouts Today
            </Text>
            <Ionicons name="fitness" size={16} color="#3B82F6" />
          </View>
          <Text className="text-2xl font-extrabold text-text-primary dark:text-text-primary-dark">
            {stats.activity.workoutsCompletedToday}
          </Text>
          <Text className="text-[10px] text-text-muted dark:text-text-muted-dark mt-1 font-semibold">
            {stats.activity.totalWorkoutsCompleted} all-time
          </Text>
        </SurfaceCard>
      </View>

      {/* AI Engine Usage Gauge */}
      <SurfaceCard className="p-4 border-indigo-500/30 dark:border-indigo-500/30">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-lg bg-indigo-500/20 items-center justify-center">
              <Ionicons name="sparkles" size={16} color="#818CF8" />
            </View>
            <View>
              <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                AI Engine & Quotas
              </Text>
              <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                Gemini Vision & LLM Coach monitoring
              </Text>
            </View>
          </View>
          <View className="bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-bold text-emerald-500">Active</Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-surface-card dark:bg-surface-card-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark">
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Camera Food Scans</Text>
            <Text className="text-xl font-extrabold text-text-primary dark:text-text-primary-dark mt-0.5">
              {stats.aiEngine.foodScansToday}
            </Text>
            <Text className="text-[9px] text-text-muted dark:text-text-muted-dark mt-1">Logged today</Text>
          </View>
          <View className="flex-1 bg-surface-card dark:bg-surface-card-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark">
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">AI Chat Questions</Text>
            <Text className="text-xl font-extrabold text-text-primary dark:text-text-primary-dark mt-0.5">
              {stats.aiEngine.coachQuestionsToday}
            </Text>
            <Text className="text-[9px] text-text-muted dark:text-text-muted-dark mt-1">Answered today</Text>
          </View>
        </View>
      </SurfaceCard>

      {/* Support Queue Status */}
      <SurfaceCard className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
            Support Desk Queue
          </Text>
          <TouchableOpacity
            onPress={() => {
              triggerHapticFeedback();
              onNavigateTab('support');
            }}
          >
            <Text className="text-xs font-bold text-accent dark:text-accent-dark">
              View All ({stats.support.total}) →
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row gap-2 mt-1">
          <View className="flex-1 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl">
            <Text className="text-[10px] font-bold text-amber-500 uppercase">Open</Text>
            <Text className="text-lg font-extrabold text-amber-500 mt-0.5">
              {stats.support.open}
            </Text>
          </View>
          <View className="flex-1 bg-blue-500/10 border border-blue-500/30 p-2.5 rounded-xl">
            <Text className="text-[10px] font-bold text-blue-500 uppercase">In Progress</Text>
            <Text className="text-lg font-extrabold text-blue-500 mt-0.5">
              {stats.support.inProgress}
            </Text>
          </View>
          <View className="flex-1 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
            <Text className="text-[10px] font-bold text-emerald-500 uppercase">Resolved</Text>
            <Text className="text-lg font-extrabold text-emerald-500 mt-0.5">
              {stats.support.resolved}
            </Text>
          </View>
        </View>
      </SurfaceCard>
    </View>
  );
}
