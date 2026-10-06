import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { triggerHapticFeedback } from '@/utils/haptics';

import {
  getAdminSystemStatsApi,
  getAdminUsersApi,
  getAdminTicketsApi,
  AdminSystemStats,
  AdminUserItem,
  AdminSupportTicket,
} from '@/api/admin';

import {
  getAdminRevenueOverviewApi,
  AdminRevenueResponse,
} from '@/api/subscription';

import {
  getWorkoutLibrary,
  ApiLibraryExercise,
} from '@/api/workout';

import AdminOverviewTab from '@/components/admin/AdminOverviewTab';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminFinanceTab from '@/components/admin/AdminFinanceTab';
import AdminExercisesTab from '@/components/admin/AdminExercisesTab';
import AdminTicketsTab from '@/components/admin/AdminTicketsTab';

export type AdminTab = 'overview' | 'users' | 'finance' | 'exercises' | 'support';

const TABS: { key: AdminTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  { key: 'users', label: 'Users & Roles', icon: 'people-outline' },
  { key: 'finance', label: 'Revenue & Ledger', icon: 'cash-outline' },
  { key: 'exercises', label: 'Exercise Catalog', icon: 'barbell-outline' },
  { key: 'support', label: 'Support Desk', icon: 'chatbubbles-outline' },
];

export default function AdminScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: AdminTab }>();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { colors } = useThemeColors();
  const { showError } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>(
    params.tab && ['overview', 'users', 'finance', 'exercises', 'support'].includes(params.tab)
      ? params.tab
      : 'overview'
  );
  const [refreshing, setRefreshing] = useState(false);

  // 1. Stats State
  const [stats, setStats] = useState<AdminSystemStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // 2. Users State
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');

  // 3. Finance State
  const [revenueData, setRevenueData] = useState<AdminRevenueResponse | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  // 4. Exercises State
  const [exercises, setExercises] = useState<ApiLibraryExercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState('All');

  // 5. Support Tickets State
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  const isCurrentUserAdmin = user?.role?.toUpperCase() === 'ADMIN';

  // Guard: strictly redirect non-admins
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isCurrentUserAdmin)) {
      showError('Access Denied', 'Administrator privileges are required to view this screen.');
      router.replace('/(screen)/dashboard');
    }
  }, [authLoading, isAuthenticated, isCurrentUserAdmin, router, showError]);

  // Load Data for Active Tab
  const loadTabContent = useCallback(async () => {
    if (!isCurrentUserAdmin) return;

    try {
      if (activeTab === 'overview') {
        setLoadingStats(true);
        const res = await getAdminSystemStatsApi();
        if (res.success) setStats(res.stats);
      } else if (activeTab === 'users') {
        setLoadingUsers(true);
        const res = await getAdminUsersApi({
          search: userSearch,
          role: userRoleFilter,
        });
        if (res.success) setUsers(res.users);
      } else if (activeTab === 'finance') {
        setLoadingRevenue(true);
        const res = await getAdminRevenueOverviewApi();
        if (res.success) setRevenueData(res);
      } else if (activeTab === 'exercises') {
        setLoadingExercises(true);
        const res = await getWorkoutLibrary(
          selectedMuscle !== 'All' ? { muscle: selectedMuscle } : undefined
        );
        if (res?.exercises) setExercises(res.exercises);
      } else if (activeTab === 'support') {
        setLoadingTickets(true);
        const filter = ticketFilter === 'ALL' ? undefined : ticketFilter;
        const res = await getAdminTicketsApi(filter);
        if (res.success) setTickets(res.tickets);
      }
    } catch (err: any) {
      console.warn('[Admin] Failed to load tab content:', err?.message);
    } finally {
      setLoadingStats(false);
      setLoadingUsers(false);
      setLoadingRevenue(false);
      setLoadingExercises(false);
      setLoadingTickets(false);
    }
  }, [activeTab, isCurrentUserAdmin, userSearch, userRoleFilter, selectedMuscle, ticketFilter]);

  // Sync active tab if param changes after mount
  useEffect(() => {
    if (params.tab && ['overview', 'users', 'finance', 'exercises', 'support'].includes(params.tab)) {
      setActiveTab(params.tab as AdminTab);
    }
  }, [params.tab]);

  useEffect(() => {
    loadTabContent();
  }, [loadTabContent]);

  // Support Desk real-time auto-refresh polling (every 15s when activeTab === 'support')
  useEffect(() => {
    if (activeTab !== 'support' || !isCurrentUserAdmin) return;
    const interval = setInterval(() => {
      const filter = ticketFilter === 'ALL' ? undefined : ticketFilter;
      getAdminTicketsApi(filter)
        .then((res) => {
          if (res.success) setTickets(res.tickets);
        })
        .catch((err) => {
          console.warn('[Admin] Auto-refresh tickets error:', err?.message);
        });
    }, 15000);
    return () => clearInterval(interval);
  }, [activeTab, isCurrentUserAdmin, ticketFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTabContent();
    setRefreshing(false);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background dark:bg-background-dark">
      {/* ── Top Navigation Header ── */}
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => {
              triggerHapticFeedback();
              router.back();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-11 h-11 rounded-full bg-surface-card dark:bg-surface-card-dark items-center justify-center border border-input-border dark:border-input-border-dark"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
              Admin Control Center
            </Text>
            <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
              Platform administration & metrics
            </Text>
          </View>
        </View>

        {/* Refresh button */}
        <TouchableOpacity
          onPress={() => {
            triggerHapticFeedback();
            onRefresh();
          }}
          disabled={refreshing}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-9 h-9 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
          accessibilityLabel="Refresh data"
        >
          <Ionicons
            name="refresh-outline"
            size={16}
            color={refreshing ? colors.accent : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* ── Segmented Navigation Tabs ── */}
      <View className="border-b border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}
        >
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => {
                  triggerHapticFeedback();
                  setActiveTab(tab.key);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                className={`flex-row items-center gap-1.5 px-4 min-h-[44px] py-2.5 rounded-full border ${
                  isSelected
                    ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent/40 dark:border-accent-dark/40'
                    : 'bg-surface-card dark:bg-surface-card-dark border-input-border dark:border-input-border-dark'
                }`}
              >
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={isSelected ? colors.accent : colors.textMuted}
                />
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-accent dark:text-accent-dark font-bold' : 'text-text-primary dark:text-text-primary-dark'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Main Tab Content ── */}
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <View className="w-full max-w-5xl self-center mx-auto">
        {activeTab === 'overview' && (
          <AdminOverviewTab
            stats={stats}
            loading={loadingStats}
            refreshing={refreshing}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
            }}
          />
        )}

        {activeTab === 'users' && (
          <AdminUsersTab
            users={users}
            loading={loadingUsers}
            refreshing={refreshing}
            search={userSearch}
            onSearchChange={setUserSearch}
            onSearchSubmit={loadTabContent}
            roleFilter={userRoleFilter}
            onRoleFilterChange={(f) => {
              setUserRoleFilter(f);
            }}
            onReloadUsers={loadTabContent}
          />
        )}

        {activeTab === 'finance' && (
          <AdminFinanceTab
            revenueData={revenueData}
            loading={loadingRevenue}
            refreshing={refreshing}
            onReloadFinance={loadTabContent}
          />
        )}

        {activeTab === 'exercises' && (
          <AdminExercisesTab
            exercises={exercises}
            loading={loadingExercises}
            refreshing={refreshing}
            selectedMuscle={selectedMuscle}
            onSelectMuscle={setSelectedMuscle}
            onReloadExercises={loadTabContent}
          />
        )}

        {activeTab === 'support' && (
          <AdminTicketsTab
            tickets={tickets}
            loading={loadingTickets}
            refreshing={refreshing}
            ticketFilter={ticketFilter}
            onFilterChange={setTicketFilter}
            onReloadTickets={loadTabContent}
          />
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
