import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { colors } = useThemeColors();
  const { showError } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
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

  useEffect(() => {
    loadTabContent();
  }, [loadTabContent]);

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
            <View className="flex-row items-center gap-1.5">
              <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                Admin Control Center
              </Text>
              <View className="bg-accent/15 dark:bg-accent-dark/20 border border-accent/30 dark:border-accent-dark/30 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-accent dark:text-accent-dark uppercase tracking-wider">
                  Admin
                </Text>
              </View>
            </View>
            <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
              Live Database Synchronization
            </Text>
          </View>
        </View>

        {/* Live Status indicator */}
        <View className="flex-row items-center gap-1.5 bg-accent/10 dark:bg-accent-dark/15 border border-accent/30 dark:border-accent-dark/30 px-2.5 py-1 rounded-full">
          <View className="w-2 h-2 rounded-full bg-accent dark:bg-accent-dark" />
          <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">Live DB</Text>
        </View>
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
