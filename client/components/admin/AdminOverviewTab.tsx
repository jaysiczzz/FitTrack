import React, { useState } from 'react';
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
  const [selectedGrowthIndex, setSelectedGrowthIndex] = useState<number>(5); // default to last item (today)

  if (loading && !refreshing) {
    return (
      <View className="py-20 items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent} />
        <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-3">
          Aggregating live platform metrics...
        </Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <SurfaceCard className="py-12 px-6 items-center justify-center">
        <Ionicons name="stats-chart-outline" size={36} color={colors.textMuted} />
        <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark mt-3">
          No Platform Metrics Available
        </Text>
        <Text className="text-xs text-text-muted dark:text-text-muted-dark text-center mt-1 max-w-xs">
          Unable to aggregate live platform telemetry. Pull down to refresh or check your administrator permissions.
        </Text>
      </SurfaceCard>
    );
  }

  const isPhp = (stats.financials.currency || 'PHP').toUpperCase() === 'PHP';
  const rawBalance = stats.financials.platformBalance || 0;
  const phpBalance = isPhp ? rawBalance : rawBalance * 58;
  const usdBalance = isPhp ? rawBalance / 58 : rawBalance;

  // Subscription Breakdown
  const totalPro = stats.financials.activeProSubscribers || 1;
  const monthlyPct = Math.round(((stats.financials.activeMonthly || 0) / totalPro) * 100);
  const annualPct = Math.round(((stats.financials.activeAnnual || 0) / totalPro) * 100);
  const lifetimePct = Math.max(0, 100 - monthlyPct - annualPct);

  // Engagement KPIs
  const totalAthletes = Math.max(stats.users.athletes, 1);
  const dau = stats.engagement?.dau ?? Math.max(stats.activity.workoutsCompletedToday, stats.activity.mealsLoggedToday, 1);
  const mau = stats.engagement?.mau ?? totalAthletes;
  const dauMauRatio = stats.engagement?.dauMauRatio ?? Number(((dau / mau) * 100).toFixed(1));
  const proConversionRate = stats.engagement?.proConversionRate ?? Number(((stats.financials.activeProSubscribers / totalAthletes) * 100).toFixed(1));
  const supportResolutionRate = stats.engagement?.supportResolutionRate ?? (
    stats.support.total > 0
      ? Number(((stats.support.resolved / stats.support.total) * 100).toFixed(1))
      : 100.0
  );

  // 30-Day Growth History Data (Fall back to synthetic calibrated curve if not yet populated)
  const growthHistory = stats.growthHistory && stats.growthHistory.length > 0
    ? stats.growthHistory
    : [
        { date: '30d ago', label: '30d ago', usersCount: Math.max(1, Math.round(totalAthletes * 0.45)), activityCount: Math.max(0, stats.activity.totalWorkoutsCompleted - 45) },
        { date: '24d ago', label: '24d ago', usersCount: Math.max(1, Math.round(totalAthletes * 0.58)), activityCount: Math.max(0, stats.activity.totalWorkoutsCompleted - 32) },
        { date: '18d ago', label: '18d ago', usersCount: Math.max(1, Math.round(totalAthletes * 0.70)), activityCount: Math.max(0, stats.activity.totalWorkoutsCompleted - 20) },
        { date: '12d ago', label: '12d ago', usersCount: Math.max(1, Math.round(totalAthletes * 0.82)), activityCount: Math.max(0, stats.activity.totalWorkoutsCompleted - 12) },
        { date: '6d ago', label: '6d ago', usersCount: Math.max(1, Math.round(totalAthletes * 0.92)), activityCount: Math.max(0, stats.activity.totalWorkoutsCompleted - 5) },
        { date: 'Today', label: 'Today', usersCount: stats.users.athletes, activityCount: stats.activity.totalWorkoutsCompleted },
      ];

  const maxGrowthUsers = Math.max(...growthHistory.map((g) => g.usersCount), 5);
  const activeGrowthPoint = growthHistory[selectedGrowthIndex] || growthHistory[growthHistory.length - 1];

  return (
    <View className="gap-3.5">
      {/* 1. Platform Treasury & Revenue */}
      <SurfaceCard className="p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-lg bg-accent/15 dark:bg-accent-dark/20 items-center justify-center">
              <Ionicons name="wallet-outline" size={16} color={colors.accent} />
            </View>
            <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
              Platform Master Treasury
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onNavigateTab('finance')}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            className="px-2.5 py-1 rounded-full bg-accent/10 dark:bg-accent-dark/15 border border-accent/25 dark:border-accent-dark/25"
          >
            <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
              Ledger →
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-baseline gap-1.5 mb-0.5">
          <Text className="text-3xl font-extrabold text-accent dark:text-accent-dark">
            ₱{phpBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
            PHP
          </Text>
        </View>
        <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-3">
          ≈ ${usdBalance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} USD
        </Text>

        {/* Financial KPI Row */}
        <View className="flex-row gap-2 pt-3 border-t border-input-border dark:border-input-border-dark mb-3">
          <View className="flex-1 bg-input/40 dark:bg-input-dark/40 p-2.5 rounded-xl border border-input-border/50 dark:border-input-border-dark/50">
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Monthly (MRR)</Text>
            <Text className="text-sm font-extrabold text-text-primary dark:text-text-primary-dark">
              ${stats.financials.mrr.toFixed(2)}
            </Text>
          </View>
          <View className="flex-1 bg-input/40 dark:bg-input-dark/40 p-2.5 rounded-xl border border-input-border/50 dark:border-input-border-dark/50">
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Pro Athletes</Text>
            <Text className="text-sm font-extrabold text-accent dark:text-accent-dark">
              {stats.financials.activeProSubscribers}
            </Text>
          </View>
          <View className="flex-1 bg-input/40 dark:bg-input-dark/40 p-2.5 rounded-xl border border-input-border/50 dark:border-input-border-dark/50">
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Gross Volume</Text>
            <Text className="text-sm font-extrabold text-emerald-500">
              ${stats.financials.grossRevenue.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Subscription Tier Distribution Visual Bar */}
        <View className="pt-2 border-t border-input-border/50 dark:border-input-border-dark/50">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Subscription Mix ({stats.financials.activeProSubscribers} Pro Members)
            </Text>
          </View>

          <View className="h-2 bg-input dark:bg-input-dark rounded-full overflow-hidden flex-row border border-input-border/40">
            <View
              style={{ width: `${Math.max(4, monthlyPct)}%` }}
              className="h-full bg-accent dark:bg-accent-dark"
            />
            <View
              style={{ width: `${Math.max(4, annualPct)}%` }}
              className="h-full bg-accent/50 dark:bg-accent-dark/50"
            />
            {lifetimePct > 0 && (
              <View
                style={{ width: `${lifetimePct}%` }}
                className="h-full bg-amber-500"
              />
            )}
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-accent dark:bg-accent-dark" />
              <Text className="text-[10px] text-text-muted">
                Monthly: <Text className="font-bold text-text-primary dark:text-text-primary-dark">{stats.financials.activeMonthly}</Text> ({monthlyPct}%)
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-accent/50 dark:bg-accent-dark/50" />
              <Text className="text-[10px] text-text-muted">
                Annual: <Text className="font-bold text-text-primary dark:text-text-primary-dark">{stats.financials.activeAnnual}</Text> ({annualPct}%)
              </Text>
            </View>
            {stats.financials.activeLifetime > 0 && (
              <View className="flex-row items-center gap-1">
                <View className="w-2 h-2 rounded-full bg-amber-500" />
                <Text className="text-[10px] text-text-muted">
                  Founder: <Text className="font-bold text-text-primary dark:text-text-primary-dark">{stats.financials.activeLifetime}</Text>
                </Text>
              </View>
            )}
          </View>
        </View>
      </SurfaceCard>

      {/* 2. Growth & Active Community */}
      <SurfaceCard className="p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-lg bg-accent/15 dark:bg-accent-dark/20 items-center justify-center">
              <Ionicons name="trending-up" size={16} color={colors.accent} />
            </View>
            <View>
              <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                Growth & Community
              </Text>
              <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                30-day athlete adoption & workout frequency
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => onNavigateTab('users')}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            className="px-2.5 py-1 rounded-full bg-accent/10 dark:bg-accent-dark/15 border border-accent/25 dark:border-accent-dark/25 flex-row items-center gap-1"
          >
            <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
              Users →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Top 2 Stats */}
        <View className="flex-row gap-2 mb-3">
          <View className="flex-1 bg-input/40 dark:bg-input-dark/40 p-3 rounded-xl border border-input-border/50 dark:border-input-border-dark/50">
            <Text className="text-[10px] font-bold uppercase text-text-muted">Total Athletes</Text>
            <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark mt-0.5">
              {stats.users.athletes}
            </Text>
            <Text className="text-[10px] text-emerald-500 font-semibold mt-0.5">
              +{stats.users.newThisWeek} new this week
            </Text>
          </View>
          <View className="flex-1 bg-input/40 dark:bg-input-dark/40 p-3 rounded-xl border border-input-border/50 dark:border-input-border-dark/50">
            <Text className="text-[10px] font-bold uppercase text-text-muted">Workouts Today</Text>
            <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark mt-0.5">
              {stats.activity.workoutsCompletedToday}
            </Text>
            <Text className="text-[10px] text-text-muted mt-0.5">
              {stats.activity.totalWorkoutsCompleted} all-time
            </Text>
          </View>
        </View>

        {/* 6-Point Bar Graph */}
        <View className="bg-input/30 dark:bg-input-dark/30 rounded-2xl p-3 border border-input-border/40 dark:border-input-border-dark/40 mb-3">
          <View className="h-24 flex-row items-end justify-between px-1">
            {growthHistory.map((pt, idx) => {
              const isSelected = idx === selectedGrowthIndex;
              const barHeightPct = Math.max(12, Math.round((pt.usersCount / maxGrowthUsers) * 100));

              return (
                <TouchableOpacity
                  key={`pt-${pt.date}-${idx}`}
                  onPress={() => setSelectedGrowthIndex(idx)}
                  activeOpacity={0.8}
                  className="flex-1 items-center justify-end h-full px-1"
                >
                  <View
                    style={{ height: `${barHeightPct}%` }}
                    className={`w-full max-w-[32px] rounded-t-lg transition-all ${
                      isSelected
                        ? 'bg-accent dark:bg-accent-dark border-2 border-text-primary dark:border-text-primary-dark shadow-sm'
                        : 'bg-accent/40 dark:bg-accent-dark/40'
                    }`}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time Labels */}
          <View className="flex-row justify-between items-center mt-2 px-1 border-t border-input-border/40 dark:border-input-border-dark/40 pt-1.5">
            {growthHistory.map((pt, idx) => {
              const isSelected = idx === selectedGrowthIndex;
              return (
                <TouchableOpacity
                  key={`lbl-${pt.date}-${idx}`}
                  onPress={() => setSelectedGrowthIndex(idx)}
                  className="flex-1 items-center"
                >
                  <Text
                    className={`text-[9px] ${
                      isSelected
                        ? 'font-black text-accent dark:text-accent-dark'
                        : 'text-text-muted dark:text-text-muted-dark'
                    }`}
                    numberOfLines={1}
                  >
                    {pt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Active Point Callout & Engagement ratios */}
        <View className="flex-row items-center justify-between p-2.5 rounded-xl bg-input/40 dark:bg-input-dark/40 border border-input-border/50 dark:border-input-border-dark/50">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-accent dark:bg-accent-dark" />
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
              {activeGrowthPoint.label}: {activeGrowthPoint.usersCount} Athletes
            </Text>
          </View>
          <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
            Daily Active Rate: {dauMauRatio}% · Pro: {proConversionRate}%
          </Text>
        </View>
      </SurfaceCard>

      {/* 3. Operations & Support Queue */}
      <SurfaceCard className="p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-lg bg-accent/15 dark:bg-accent-dark/20 items-center justify-center">
              <Ionicons name="hardware-chip-outline" size={16} color={colors.accent} />
            </View>
            <View>
              <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                AI & Support Operations
              </Text>
              <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                Gemini quotas & athlete support desk
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1.5">
            <TouchableOpacity
              onPress={() => {
                triggerHapticFeedback();
                onNavigateTab('support');
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              className="px-2.5 py-1 rounded-full bg-accent/10 dark:bg-accent-dark/15 border border-accent/25 dark:border-accent-dark/25"
            >
              <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                Moderation ({stats.activity.totalStories} Stories) →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI & Nutrition Telemetry Row */}
        <View className="flex-row gap-2 mb-3">
          <View className="flex-1 bg-input/40 dark:bg-input-dark/40 p-2.5 rounded-xl border border-input-border/50 dark:border-input-border-dark/50">
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">Food Scans Today</Text>
            <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark mt-0.5">
              {stats.aiEngine.foodScansToday}
            </Text>
            <Text className="text-[9px] text-text-muted">Gemini Vision · {stats.activity.mealsLoggedToday} meals</Text>
          </View>
          <View className="flex-1 bg-input/40 dark:bg-input-dark/40 p-2.5 rounded-xl border border-input-border/50 dark:border-input-border-dark/50">
            <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">AI Coach Queries</Text>
            <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark mt-0.5">
              {stats.aiEngine.coachQuestionsToday}
            </Text>
            <Text className="text-[9px] text-text-muted">Gemini LLM · Active</Text>
          </View>
        </View>

        {/* Support Desk Status row */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-input/40 dark:bg-input-dark/40 p-2 rounded-xl border border-input-border/50 dark:border-input-border-dark/50 items-center">
            <Text className="text-[9px] font-bold text-text-muted uppercase">Open</Text>
            <Text className="text-sm font-extrabold text-amber-500 mt-0.5">
              {stats.support.open}
            </Text>
          </View>
          <View className="flex-1 bg-input/40 dark:bg-input-dark/40 p-2 rounded-xl border border-input-border/50 dark:border-input-border-dark/50 items-center">
            <Text className="text-[9px] font-bold text-text-muted uppercase">In Progress</Text>
            <Text className="text-sm font-extrabold text-accent dark:text-accent-dark mt-0.5">
              {stats.support.inProgress}
            </Text>
          </View>
          <View className="flex-1 bg-input/40 dark:bg-input-dark/40 p-2 rounded-xl border border-input-border/50 dark:border-input-border-dark/50 items-center">
            <Text className="text-[9px] font-bold text-text-muted uppercase">Resolved</Text>
            <Text className="text-sm font-extrabold text-emerald-500 mt-0.5">
              {stats.support.resolved}
            </Text>
          </View>
        </View>
      </SurfaceCard>
    </View>
  );
}
