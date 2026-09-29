import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { triggerHapticFeedback } from '@/utils/haptics';
import SurfaceCard from '@/components/ui/SurfaceCard';
import ModalCloseButton from '@/components/ui/ModalCloseButton';

import {
  getAdminSystemStatsApi,
  getAdminUsersApi,
  updateUserRoleApi,
  deleteUserApi,
  getAdminTicketsApi,
  updateAdminTicketApi,
  deleteAdminTicketApi,
  AdminSystemStats,
  AdminUserItem,
  AdminSupportTicket,
} from '@/api/admin';

import {
  getAdminRevenueOverviewApi,
  processAdminPayoutApi,
  adminOverrideSubscriptionApi,
  AdminRevenueResponse,
  SubscriptionTierType,
} from '@/api/subscription';

import {
  getWorkoutLibrary,
  createLibraryExercise,
  deleteLibraryExercise,
  ApiLibraryExercise,
} from '@/api/workout';

type AdminTab = 'overview' | 'users' | 'finance' | 'exercises' | 'support';

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

export default function AdminScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { colors, isDark } = useThemeColors();
  const { showSuccess, showError, showWarning } = useToast();

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
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [updatingUserRole, setUpdatingUserRole] = useState(false);
  const [overrideTier, setOverrideTier] = useState<SubscriptionTierType>('PRO_MONTHLY');
  const [savingOverride, setSavingOverride] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // 3. Finance & Revenue State
  const [revenueData, setRevenueData] = useState<AdminRevenueResponse | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutDestination, setPayoutDestination] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);

  // 4. Exercises State
  const [exercises, setExercises] = useState<ApiLibraryExercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [savingExercise, setSavingExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('Chest');
  const [newExCategory, setNewExCategory] = useState('Strength');
  const [newExDifficulty, setNewExDifficulty] = useState('Intermediate');
  const [newExImageUrl, setNewExImageUrl] = useState('');
  const [newExInstructions, setNewExInstructions] = useState('');

  // 5. Support Tickets State
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [adminTicketNotes, setAdminTicketNotes] = useState('');
  const [updatingTicket, setUpdatingTicket] = useState(false);

  // Guard: strictly redirect non-admins
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      showError('Access Denied', 'Administrator privileges are required to view this screen.');
      router.replace('/(screen)/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Load Data for Active Tab
  const loadTabContent = useCallback(async () => {
    if (user?.role !== 'ADMIN') return;

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
        const res = await getWorkoutLibrary(selectedMuscle !== 'All' ? { muscle: selectedMuscle } : undefined);
        if (res?.exercises) setExercises(res.exercises);
      } else if (activeTab === 'support') {
        setLoadingTickets(true);
        const filter = ticketFilter === 'ALL' ? undefined : ticketFilter;
        const res = await getAdminTicketsApi(filter);
        if (res.success) setTickets(res.tickets);
      }
    } catch (err: any) {
      showError('Data Error', err?.message || 'Failed to fetch live admin data.');
    } finally {
      setLoadingStats(false);
      setLoadingUsers(false);
      setLoadingRevenue(false);
      setLoadingExercises(false);
      setLoadingTickets(false);
      setRefreshing(false);
    }
  }, [activeTab, user?.role, userSearch, userRoleFilter, selectedMuscle, ticketFilter]);

  useEffect(() => {
    loadTabContent();
  }, [loadTabContent]);

  const onRefresh = () => {
    triggerHapticFeedback();
    setRefreshing(true);
    loadTabContent();
  };

  // --- Handlers: User Actions ---
  const handleToggleUserRole = async (targetUser: AdminUserItem) => {
    const newRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      setUpdatingUserRole(true);
      triggerHapticFeedback();
      const res = await updateUserRoleApi(targetUser.id, newRole);
      if (res.success) {
        showSuccess('Role Updated', `${targetUser.firstName} is now an ${newRole}.`);
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
        );
        if (selectedUser?.id === targetUser.id) {
          setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
        }
      }
    } catch (err: any) {
      showError('Update Failed', err?.message || 'Could not update user role.');
    } finally {
      setUpdatingUserRole(false);
    }
  };

  const handleApplySubscriptionOverride = async () => {
    if (!selectedUser) return;
    try {
      setSavingOverride(true);
      triggerHapticFeedback();
      const res = await adminOverrideSubscriptionApi(selectedUser.id, overrideTier);
      if (res.success) {
        showSuccess('Subscription Overridden', `${selectedUser.firstName}'s tier is now ${overrideTier}.`);
        setShowOverrideModal(false);
        loadTabContent();
      }
    } catch (err: any) {
      showError('Override Failed', err?.message || 'Could not override subscription.');
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDeleteUserAccount = (targetUser: AdminUserItem) => {
    if (targetUser.id === user?.id) {
      showWarning('Cannot Delete', 'You cannot delete your own logged-in admin account.');
      return;
    }

    Alert.alert(
      'Delete User Account',
      `Are you sure you want to permanently delete ${targetUser.firstName} ${targetUser.lastName} (${targetUser.email})? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              triggerHapticFeedback();
              const res = await deleteUserApi(targetUser.id);
              if (res.success) {
                showSuccess('User Deleted', 'Account removed from the database.');
                setSelectedUser(null);
                setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
              }
            } catch (err: any) {
              showError('Delete Failed', err?.message || 'Could not delete user.');
            }
          },
        },
      ]
    );
  };

  // --- Handlers: Payout ---
  const handleProcessPayout = async () => {
    const num = parseFloat(payoutAmount);
    if (!num || num <= 0) {
      showWarning('Invalid Amount', 'Enter a valid payout amount.');
      return;
    }
    if (!payoutDestination.trim()) {
      showWarning('Destination Required', 'Please enter account/bank destination info.');
      return;
    }

    try {
      setProcessingPayout(true);
      triggerHapticFeedback();
      const res = await processAdminPayoutApi({
        amount: num,
        currency: revenueData?.platformWallet.currency || 'USD',
        destination: payoutDestination.trim(),
        notes: payoutNotes.trim() || undefined,
      });

      if (res.success) {
        showSuccess('Payout Completed', `Recorded payout of $${num.toFixed(2)}.`);
        setShowPayoutModal(false);
        setPayoutAmount('');
        setPayoutDestination('');
        setPayoutNotes('');
        loadTabContent();
      }
    } catch (err: any) {
      showError('Payout Error', err?.message || 'Failed to process admin payout.');
    } finally {
      setProcessingPayout(false);
    }
  };

  // --- Handlers: Exercises ---
  const handleCreateExercise = async () => {
    if (!newExName.trim()) {
      showWarning('Name Required', 'Please provide an exercise name.');
      return;
    }
    if (!newExInstructions.trim()) {
      showWarning('Instructions Required', 'Please provide execution instructions.');
      return;
    }

    try {
      setSavingExercise(true);
      triggerHapticFeedback();
      const res = await createLibraryExercise({
        name: newExName.trim(),
        primaryMuscle: newExMuscle,
        muscleGroup: newExMuscle,
        category: newExCategory,
        type: 'Compound',
        difficulty: newExDifficulty,
        imageUrl: newExImageUrl.trim() || undefined,
        instructions: [newExInstructions.trim()],
        defaultSets: [{ weight: 20, reps: 10 }, { weight: 20, reps: 10 }, { weight: 20, reps: 10 }],
      });

      if (res.success) {
        showSuccess('Exercise Created', `${newExName} added to the live library.`);
        setShowAddExerciseModal(false);
        setNewExName('');
        setNewExImageUrl('');
        setNewExInstructions('');
        loadTabContent();
      }
    } catch (err: any) {
      showError('Creation Error', err?.message || 'Could not save exercise.');
    } finally {
      setSavingExercise(false);
    }
  };

  const handleDeleteExercise = (ex: ApiLibraryExercise) => {
    Alert.alert(
      'Remove Exercise',
      `Delete "${ex.name}" from the system library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              triggerHapticFeedback();
              const res = await deleteLibraryExercise(ex.id);
              if (res.success) {
                showSuccess('Exercise Removed', `"${ex.name}" deleted.`);
                setExercises((prev) => prev.filter((item) => item.id !== ex.id));
              }
            } catch (err: any) {
              showError('Delete Failed', err?.message || 'Could not delete exercise.');
            }
          },
        },
      ]
    );
  };

  // --- Handlers: Support Tickets ---
  const handleUpdateTicketStatus = async (status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    if (!selectedTicket) return;
    try {
      setUpdatingTicket(true);
      triggerHapticFeedback();
      const res = await updateAdminTicketApi(selectedTicket.id, {
        status,
        adminNotes: adminTicketNotes.trim() || undefined,
      });

      if (res.success) {
        showSuccess('Ticket Updated', `Status changed to ${status}.`);
        setTickets((prev) =>
          prev.map((t) => (t.id === selectedTicket.id ? res.ticket : t))
        );
        setSelectedTicket(res.ticket);
      }
    } catch (err: any) {
      showError('Update Failed', err?.message || 'Could not update ticket.');
    } finally {
      setUpdatingTicket(false);
    }
  };

  const handleDeleteTicket = (ticketId: string) => {
    Alert.alert(
      'Delete Ticket',
      'Remove this support ticket permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              triggerHapticFeedback();
              const res = await deleteAdminTicketApi(ticketId);
              if (res.success) {
                showSuccess('Ticket Removed', 'Ticket deleted from support queue.');
                setSelectedTicket(null);
                setTickets((prev) => prev.filter((t) => t.id !== ticketId));
              }
            } catch (err: any) {
              showError('Delete Failed', err?.message || 'Could not delete ticket.');
            }
          },
        },
      ]
    );
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
            className="w-9 h-9 rounded-full bg-surface-card dark:bg-surface-card-dark items-center justify-center border border-input-border dark:border-input-border-dark"
          >
            <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                Admin Control Center
              </Text>
              <View className="bg-amber-500/20 px-1.5 py-0.5 rounded-full">
                <Text className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">
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
        <View className="flex-row items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-full">
          <View className="w-2 h-2 rounded-full bg-emerald-500" />
          <Text className="text-[10px] font-bold text-emerald-500">Live DB</Text>
        </View>
      </View>

      {/* ── Segmented Navigation Tabs ── */}
      <View className="border-b border-input-border dark:border-input-border-dark bg-surface dark:bg-surface-dark">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}
        >
          {[
            { key: 'overview', label: 'Overview', icon: 'grid-outline' },
            { key: 'users', label: 'Users & Roles', icon: 'people-outline' },
            { key: 'finance', label: 'Revenue & Ledger', icon: 'cash-outline' },
            { key: 'exercises', label: 'Exercise Catalog', icon: 'barbell-outline' },
            { key: 'support', label: 'Support Desk', icon: 'chatbubbles-outline' },
          ].map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => {
                  triggerHapticFeedback();
                  setActiveTab(tab.key as AdminTab);
                }}
                className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border ${
                  isSelected
                    ? 'bg-amber-500 border-amber-500'
                    : 'bg-surface-card dark:bg-surface-card-dark border-input-border dark:border-input-border-dark'
                }`}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={14}
                  color={isSelected ? '#000000' : colors.textMuted}
                />
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-black font-bold' : 'text-text-primary dark:text-text-primary-dark'
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
        contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* ══════════════════════════════════════════
            TAB 1: OVERVIEW & SYSTEM VITALS
        ══════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <View className="gap-4">
            {loadingStats && !refreshing ? (
              <View className="py-20 items-center justify-center">
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-3">
                  Aggregating live platform metrics...
                </Text>
              </View>
            ) : stats ? (
              <>
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
                      ₱{(stats.financials.platformBalance * 58).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        setActiveTab('support');
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
              </>
            ) : null}
          </View>
        )}

        {/* ══════════════════════════════════════════
            TAB 2: USERS & ROLE MANAGEMENT
        ══════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <View className="gap-3">
            {/* Search Bar */}
            <View className="flex-row items-center bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark">
              <Ionicons name="search" size={16} color={colors.textMuted} className="mr-2" />
              <TextInput
                className="flex-1 text-sm text-text-primary dark:text-text-primary-dark p-0"
                placeholder="Search athletes by name or email..."
                placeholderTextColor={colors.textMuted}
                value={userSearch}
                onChangeText={setUserSearch}
                onSubmitEditing={loadTabContent}
                returnKeyType="search"
              />
              {userSearch.length > 0 && (
                <TouchableOpacity onPress={() => setUserSearch('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Role Filter Chips */}
            <View className="flex-row gap-2">
              {(['ALL', 'USER', 'ADMIN'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => {
                    triggerHapticFeedback();
                    setUserRoleFilter(filter);
                  }}
                  className={`px-3 py-1.5 rounded-full border ${
                    userRoleFilter === filter
                      ? 'bg-amber-500 border-amber-500'
                      : 'bg-surface dark:bg-surface-dark border-input-border dark:border-input-border-dark'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      userRoleFilter === filter ? 'text-black font-bold' : 'text-text-muted dark:text-text-muted-dark'
                    }`}
                  >
                    {filter === 'ALL' ? 'All Roles' : filter === 'USER' ? 'Athletes Only' : 'Admins Only'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* User List */}
            {loadingUsers && !refreshing ? (
              <View className="py-20 items-center justify-center">
                <ActivityIndicator size="small" color="#F59E0B" />
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
                  Loading user records...
                </Text>
              </View>
            ) : users.length === 0 ? (
              <View className="py-16 items-center justify-center">
                <Ionicons name="people-outline" size={36} color={colors.textMuted} />
                <Text className="text-sm font-semibold text-text-muted dark:text-text-muted-dark mt-2">
                  No matching users found
                </Text>
              </View>
            ) : (
              users.map((item) => {
                const isItemAdmin = item.role === 'ADMIN';
                const isPro = item.subscription?.tier && item.subscription.tier !== 'FREE';

                return (
                  <SurfaceCard key={item.id} className="p-3.5">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
                            {item.firstName} {item.lastName}
                          </Text>
                          {isItemAdmin ? (
                            <View className="bg-amber-500/20 px-2 py-0.5 rounded-full">
                              <Text className="text-[10px] font-bold text-amber-500">ADMIN</Text>
                            </View>
                          ) : (
                            <View className="bg-blue-500/10 px-2 py-0.5 rounded-full">
                              <Text className="text-[10px] font-bold text-blue-500">ATHLETE</Text>
                            </View>
                          )}
                          {isPro && (
                            <View className="bg-emerald-500/15 px-2 py-0.5 rounded-full">
                              <Text className="text-[10px] font-bold text-emerald-500">PRO</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                          {item.email}
                        </Text>
                        <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-1.5">
                          🏋️ {item._count?.workoutSessions || 0} sessions · 🥗 {item._count?.dailyFoodLogs || 0} meal days · Goal: {item.goal}
                        </Text>
                      </View>

                      {/* Action Menu Trigger */}
                      <TouchableOpacity
                        onPress={() => {
                          triggerHapticFeedback();
                          setSelectedUser(item);
                        }}
                        className="bg-surface-card dark:bg-surface-card-dark px-3 py-1.5 rounded-lg border border-input-border dark:border-input-border-dark"
                      >
                        <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                          Manage
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </SurfaceCard>
                );
              })
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════
            TAB 3: REVENUE & LEDGER
        ══════════════════════════════════════════ */}
        {activeTab === 'finance' && (
          <View className="gap-4">
            {loadingRevenue && !refreshing ? (
              <View className="py-20 items-center justify-center">
                <ActivityIndicator size="small" color="#F59E0B" />
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
                  Fetching ledger transactions...
                </Text>
              </View>
            ) : revenueData ? (
              <>
                <SurfaceCard className="p-4 border-amber-500/30 dark:border-amber-500/30">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark uppercase">
                      Settlement & Treasury
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        triggerHapticFeedback();
                        setShowPayoutModal(true);
                      }}
                      className="bg-amber-500 px-3 py-1.5 rounded-lg"
                    >
                      <Text className="text-xs font-bold text-black">+ Payout</Text>
                    </TouchableOpacity>
                  </View>

                  <Text className="text-2xl font-extrabold text-amber-500">
                    ${revenueData.platformWallet.balance.toFixed(2)} {revenueData.platformWallet.currency}
                  </Text>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                    Available balance for admin payouts & operating funds
                  </Text>
                </SurfaceCard>

                {/* Recent Ledger Transactions */}
                <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                  Live Transactions Ledger ({revenueData.recentTransactions.length})
                </Text>

                {revenueData.recentTransactions.length === 0 ? (
                  <SurfaceCard className="p-6 items-center justify-center">
                    <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                      No transactions recorded in database yet.
                    </Text>
                  </SurfaceCard>
                ) : (
                  revenueData.recentTransactions.map((tx) => (
                    <SurfaceCard key={tx.id} className="p-3">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                              {tx.type}
                            </Text>
                            <View className="bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              <Text className="text-[9px] font-bold text-emerald-500">{tx.status}</Text>
                            </View>
                          </View>
                          <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
                            {tx.user?.email || 'System Platform'} · {tx.paymentMethod}
                          </Text>
                          <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                            {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <Text
                          className={`text-sm font-extrabold ${
                            tx.type === 'PAYOUT' ? 'text-rose-500' : 'text-emerald-500'
                          }`}
                        >
                          {tx.type === 'PAYOUT' ? '-' : '+'}${tx.amount.toFixed(2)}
                        </Text>
                      </View>
                    </SurfaceCard>
                  ))
                )}
              </>
            ) : null}
          </View>
        )}

        {/* ══════════════════════════════════════════
            TAB 4: EXERCISE CATALOG
        ══════════════════════════════════════════ */}
        {activeTab === 'exercises' && (
          <View className="gap-3">
            {/* Header + Add button */}
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                Exercise Database ({exercises.length})
              </Text>
              <TouchableOpacity
                onPress={() => {
                  triggerHapticFeedback();
                  setShowAddExerciseModal(true);
                }}
                className="bg-amber-500 px-3 py-1.5 rounded-lg flex-row items-center gap-1"
              >
                <Ionicons name="add" size={16} color="#000" />
                <Text className="text-xs font-bold text-black">Add Exercise</Text>
              </TouchableOpacity>
            </View>

            {/* Muscle Filter Scroll */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {MUSCLE_GROUPS.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    triggerHapticFeedback();
                    setSelectedMuscle(m);
                  }}
                  className={`px-3 py-1 rounded-full border ${
                    selectedMuscle === m
                      ? 'bg-amber-500 border-amber-500'
                      : 'bg-surface dark:bg-surface-dark border-input-border dark:border-input-border-dark'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selectedMuscle === m ? 'text-black font-bold' : 'text-text-muted dark:text-text-muted-dark'
                    }`}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Exercise List */}
            {loadingExercises && !refreshing ? (
              <View className="py-20 items-center justify-center">
                <ActivityIndicator size="small" color="#F59E0B" />
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
                  Fetching catalog from database...
                </Text>
              </View>
            ) : exercises.length === 0 ? (
              <SurfaceCard className="py-12 items-center justify-center">
                <Ionicons name="barbell-outline" size={36} color={colors.textMuted} />
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
                  No exercises match this muscle group.
                </Text>
              </SurfaceCard>
            ) : (
              exercises.map((ex) => (
                <SurfaceCard key={ex.id} className="p-3">
                  <View className="flex-row items-center gap-3">
                    {ex.imageUrl ? (
                      <Image
                        source={{ uri: ex.imageUrl }}
                        className="w-14 h-14 rounded-xl bg-surface-card dark:bg-surface-card-dark"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 items-center justify-center">
                        <Ionicons name="fitness" size={24} color="#F59E0B" />
                      </View>
                    )}

                    <View className="flex-1">
                      <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
                        {ex.name}
                      </Text>
                      <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                        {ex.primaryMuscle || ex.muscleGroup} · {ex.category} · {ex.difficulty}
                      </Text>
                      {ex.instructions && ex.instructions[0] && (
                        <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-1" numberOfLines={1}>
                          {ex.instructions[0]}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDeleteExercise(ex)}
                      className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 items-center justify-center"
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </SurfaceCard>
              ))
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════
            TAB 5: SUPPORT & FEEDBACK DESK
        ══════════════════════════════════════════ */}
        {activeTab === 'support' && (
          <View className="gap-3">
            {/* Filter chips */}
            <View className="flex-row gap-2">
              {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => {
                    triggerHapticFeedback();
                    setTicketFilter(filter);
                  }}
                  className={`px-3 py-1.5 rounded-full border ${
                    ticketFilter === filter
                      ? 'bg-amber-500 border-amber-500'
                      : 'bg-surface dark:bg-surface-dark border-input-border dark:border-input-border-dark'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      ticketFilter === filter ? 'text-black font-bold' : 'text-text-muted dark:text-text-muted-dark'
                    }`}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {loadingTickets && !refreshing ? (
              <View className="py-20 items-center justify-center">
                <ActivityIndicator size="small" color="#F59E0B" />
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
                  Loading support queue...
                </Text>
              </View>
            ) : tickets.length === 0 ? (
              <SurfaceCard className="py-16 items-center justify-center">
                <Ionicons name="checkmark-circle-outline" size={40} color="#10B981" />
                <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mt-2">
                  Queue is clear!
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                  No pending support tickets in this category.
                </Text>
              </SurfaceCard>
            ) : (
              tickets.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => {
                    triggerHapticFeedback();
                    setSelectedTicket(t);
                    setAdminTicketNotes(t.adminNotes || '');
                  }}
                >
                  <SurfaceCard className="p-3.5">
                    <View className="flex-row items-start justify-between mb-1.5">
                      <View className="flex-row items-center gap-2">
                        <View
                          className={`px-2 py-0.5 rounded-full ${
                            t.status === 'OPEN'
                              ? 'bg-amber-500/20'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-blue-500/20'
                              : 'bg-emerald-500/20'
                          }`}
                        >
                          <Text
                            className={`text-[9px] font-bold ${
                              t.status === 'OPEN'
                                ? 'text-amber-500'
                                : t.status === 'IN_PROGRESS'
                                ? 'text-blue-500'
                                : 'text-emerald-500'
                            }`}
                          >
                            {t.status}
                          </Text>
                        </View>
                        <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase">
                          {t.category}
                        </Text>
                      </View>
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark mb-1">
                      {t.subject}
                    </Text>
                    <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-2" numberOfLines={2}>
                      {t.message}
                    </Text>

                    <View className="flex-row items-center justify-between pt-2 border-t border-input-border dark:border-input-border-dark">
                      <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                        From: {t.userName ? `${t.userName} · ` : ''}{t.userEmail}
                      </Text>
                      <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                        Review →
                      </Text>
                    </View>
                  </SurfaceCard>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ══════════════════════════════════════════
          MODAL: USER MANAGEMENT ACTIONS
      ══════════════════════════════════════════ */}
      {selectedUser && (
        <Modal
          visible={!!selectedUser}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedUser(null)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-sm rounded-2xl p-5 border border-input-border dark:border-input-border-dark">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                  Manage User
                </Text>
                <ModalCloseButton onClose={() => setSelectedUser(null)} />
              </View>

              <View className="bg-surface-card dark:bg-surface-card-dark p-3 rounded-xl mb-4">
                <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
                  {selectedUser.firstName} {selectedUser.lastName}
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  {selectedUser.email}
                </Text>
                <View className="flex-row gap-2 mt-2">
                  <View className="bg-amber-500/20 px-2 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-amber-500">
                      ROLE: {selectedUser.role}
                    </Text>
                  </View>
                  <View className="bg-blue-500/20 px-2 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-blue-500">
                      TIER: {selectedUser.subscription?.tier || 'FREE'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="gap-2.5">
                {/* 1. Toggle Admin Role */}
                <TouchableOpacity
                  onPress={() => handleToggleUserRole(selectedUser)}
                  disabled={updatingUserRole}
                  className={`py-3 rounded-xl border flex-row items-center justify-center gap-2 ${
                    selectedUser.role === 'ADMIN'
                      ? 'bg-rose-500/15 border-rose-500/30'
                      : 'bg-amber-500 border-amber-500'
                  }`}
                >
                  <Ionicons
                    name="shield-outline"
                    size={16}
                    color={selectedUser.role === 'ADMIN' ? '#EF4444' : '#000'}
                  />
                  <Text
                    className={`text-xs font-bold ${
                      selectedUser.role === 'ADMIN' ? 'text-rose-500' : 'text-black'
                    }`}
                  >
                    {selectedUser.role === 'ADMIN' ? 'Demote to Athlete' : 'Promote to Admin'}
                  </Text>
                </TouchableOpacity>

                {/* 2. Override Subscription */}
                <TouchableOpacity
                  onPress={() => {
                    setShowOverrideModal(true);
                  }}
                  className="py-3 rounded-xl bg-surface-card dark:bg-surface-card-dark border border-input-border dark:border-input-border-dark flex-row items-center justify-center gap-2"
                >
                  <Ionicons name="ribbon-outline" size={16} color={colors.textPrimary} />
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    Override Subscription Tier
                  </Text>
                </TouchableOpacity>

                {/* 3. Delete Account */}
                <TouchableOpacity
                  onPress={() => handleDeleteUserAccount(selectedUser)}
                  className="py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex-row items-center justify-center gap-2 mt-2"
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text className="text-xs font-bold text-rose-500">
                    Delete User Account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ══════════════════════════════════════════
          MODAL: OVERRIDE SUBSCRIPTION TIER
      ══════════════════════════════════════════ */}
      {showOverrideModal && selectedUser && (
        <Modal
          visible={showOverrideModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowOverrideModal(false)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-sm rounded-2xl p-5 border border-input-border dark:border-input-border-dark">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                  Grant Subscription Tier
                </Text>
                <ModalCloseButton onClose={() => setShowOverrideModal(false)} />
              </View>

              <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-4">
                Assign testing or founder access for {selectedUser.firstName}.
              </Text>

              <View className="gap-2 mb-5">
                {(
                  [
                    { tier: 'FREE', label: 'Free Tier', desc: 'Standard quotas' },
                    { tier: 'PRO_MONTHLY', label: 'Pro Monthly', desc: 'Full AI Vision & Routines' },
                    { tier: 'PRO_ANNUAL', label: 'Pro Annual', desc: '12 Months access' },
                    { tier: 'LIFETIME_FOUNDER', label: 'Lifetime Founder', desc: 'Permanent VIP VIP' },
                  ] as const
                ).map((item) => (
                  <TouchableOpacity
                    key={item.tier}
                    onPress={() => {
                      triggerHapticFeedback();
                      setOverrideTier(item.tier);
                    }}
                    className={`p-3 rounded-xl border flex-row items-center justify-between ${
                      overrideTier === item.tier
                        ? 'bg-amber-500/15 border-amber-500'
                        : 'bg-surface-card dark:bg-surface-card-dark border-input-border dark:border-input-border-dark'
                    }`}
                  >
                    <View>
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                        {item.label}
                      </Text>
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                        {item.desc}
                      </Text>
                    </View>
                    {overrideTier === item.tier && (
                      <Ionicons name="checkmark-circle" size={18} color="#F59E0B" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleApplySubscriptionOverride}
                disabled={savingOverride}
                className="bg-amber-500 py-3 rounded-xl items-center justify-center"
              >
                {savingOverride ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text className="text-xs font-bold text-black">Apply Tier Override</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ══════════════════════════════════════════
          MODAL: PROCESS PAYOUT
      ══════════════════════════════════════════ */}
      {showPayoutModal && (
        <Modal
          visible={showPayoutModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPayoutModal(false)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-sm rounded-2xl p-5 border border-input-border dark:border-input-border-dark">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                  Process Admin Payout
                </Text>
                <ModalCloseButton onClose={() => setShowPayoutModal(false)} />
              </View>

              <View className="gap-3 mb-4">
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Payout Amount ($ USD)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. 50.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={payoutAmount}
                    onChangeText={setPayoutAmount}
                  />
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Destination (GCash / Maya / Bank)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. GCash 0917-123-4567"
                    placeholderTextColor={colors.textMuted}
                    value={payoutDestination}
                    onChangeText={setPayoutDestination}
                  />
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Internal Reference Notes
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. Monthly server cost reimbursement"
                    placeholderTextColor={colors.textMuted}
                    value={payoutNotes}
                    onChangeText={setPayoutNotes}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleProcessPayout}
                disabled={processingPayout}
                className="bg-amber-500 py-3 rounded-xl items-center justify-center"
              >
                {processingPayout ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text className="text-xs font-bold text-black">Confirm & Settle Payout</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ══════════════════════════════════════════
          MODAL: ADD EXERCISE TO LIBRARY
      ══════════════════════════════════════════ */}
      {showAddExerciseModal && (
        <Modal
          visible={showAddExerciseModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddExerciseModal(false)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-sm rounded-2xl p-5 border border-input-border dark:border-input-border-dark max-h-[85%]">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                  Add Exercise to Catalog
                </Text>
                <ModalCloseButton onClose={() => setShowAddExerciseModal(false)} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 10 }}>
                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Exercise Name *
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="e.g. Incline Dumbbell Press"
                    placeholderTextColor={colors.textMuted}
                    value={newExName}
                    onChangeText={setNewExName}
                  />
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Muscle Group
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {MUSCLE_GROUPS.filter((m) => m !== 'All').map((m) => (
                      <TouchableOpacity
                        key={m}
                        onPress={() => setNewExMuscle(m)}
                        className={`px-3 py-1 rounded-full border ${
                          newExMuscle === m
                            ? 'bg-amber-500 border-amber-500'
                            : 'bg-surface-card dark:bg-surface-card-dark border-input-border dark:border-input-border-dark'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            newExMuscle === m ? 'text-black font-bold' : 'text-text-muted dark:text-text-muted-dark'
                          }`}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Image URL (Unsplash or verified)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark"
                    placeholder="https://images.unsplash.com/..."
                    placeholderTextColor={colors.textMuted}
                    value={newExImageUrl}
                    onChangeText={setNewExImageUrl}
                  />
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Execution Instructions *
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-sm text-text-primary dark:text-text-primary-dark min-h-[70px]"
                    placeholder="Describe proper posture, tempo, and form cues..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={newExInstructions}
                    onChangeText={setNewExInstructions}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleCreateExercise}
                  disabled={savingExercise}
                  className="bg-amber-500 py-3 rounded-xl items-center justify-center mt-2"
                >
                  {savingExercise ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text className="text-xs font-bold text-black">Save to Database</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ══════════════════════════════════════════
          MODAL: REVIEW SUPPORT TICKET
      ══════════════════════════════════════════ */}
      {selectedTicket && (
        <Modal
          visible={!!selectedTicket}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedTicket(null)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-sm rounded-2xl p-5 border border-input-border dark:border-input-border-dark max-h-[85%]">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                  Support Ticket
                </Text>
                <ModalCloseButton onClose={() => setSelectedTicket(null)} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                <View className="bg-surface-card dark:bg-surface-card-dark p-3 rounded-xl">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[10px] font-bold text-amber-500 uppercase">
                      {selectedTicket.category} · {selectedTicket.id}
                    </Text>
                    <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                      {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
                    {selectedTicket.subject}
                  </Text>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                    User: {selectedTicket.userName ? `${selectedTicket.userName} (${selectedTicket.userEmail})` : selectedTicket.userEmail}
                  </Text>
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    User Message
                  </Text>
                  <Text className="text-xs text-text-primary dark:text-text-primary-dark bg-surface-card dark:bg-surface-card-dark p-3 rounded-xl border border-input-border dark:border-input-border-dark leading-relaxed">
                    {selectedTicket.message}
                  </Text>
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1">
                    Admin Resolution Note
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3 py-2 rounded-xl border border-input-border dark:border-input-border-dark text-xs text-text-primary dark:text-text-primary-dark min-h-[60px]"
                    placeholder="Enter resolution notes, actions taken, or replies..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    value={adminTicketNotes}
                    onChangeText={setAdminTicketNotes}
                  />
                </View>

                {/* Workflow Buttons */}
                <View className="flex-row gap-2 mt-1">
                  <TouchableOpacity
                    onPress={() => handleUpdateTicketStatus('IN_PROGRESS')}
                    disabled={updatingTicket}
                    className="flex-1 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 items-center justify-center"
                  >
                    <Text className="text-[11px] font-bold text-blue-500">In Progress</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleUpdateTicketStatus('RESOLVED')}
                    disabled={updatingTicket}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 items-center justify-center"
                  >
                    <Text className="text-[11px] font-bold text-black">Mark Resolved</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteTicket(selectedTicket.id)}
                  className="py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 items-center justify-center mt-1"
                >
                  <Text className="text-[11px] font-bold text-rose-500">Delete Ticket</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
