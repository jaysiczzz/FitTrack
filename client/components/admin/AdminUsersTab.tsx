import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { triggerHapticFeedback } from '@/utils/haptics';
import { sanitizeAvatarUrl } from '@/utils/imageUtils';
import SurfaceCard from '@/components/ui/SurfaceCard';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import FilterChip from '@/components/ui/FilterChip';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  AdminUserItem,
  updateUserRoleApi,
  deleteUserApi,
  toggleUserSuspensionApi,
} from '@/api/admin';
import {
  adminOverrideSubscriptionApi,
  SubscriptionTierType,
} from '@/api/subscription';
import { capitalizeWords, formatGoalLabel } from '@/utils/formatters';

interface AdminUsersTabProps {
  users: AdminUserItem[];
  loading: boolean;
  refreshing: boolean;
  search: string;
  onSearchChange: (s: string) => void;
  onSearchSubmit: () => void;
  roleFilter: 'ALL' | 'USER' | 'ADMIN';
  onRoleFilterChange: (role: 'ALL' | 'USER' | 'ADMIN') => void;
  tierFilter?: 'ALL' | 'PRO' | 'FREE';
  onTierFilterChange?: (tier: 'ALL' | 'PRO' | 'FREE') => void;
  onReloadUsers: () => void;
}

const SUSPENSION_PRESETS = [
  'Terms of Service violation',
  'Abusive / inappropriate behavior',
  'Spamming community boards',
  'Suspected fraudulent activity',
  'Requested by account owner',
];

const TIER_OPTIONS: {
  tier: SubscriptionTierType;
  label: string;
  badge: string;
  desc: string;
  durationMonths: number;
  icon: 'leaf-outline' | 'flash-outline' | 'sparkles-outline';
}[] = [
  {
    tier: 'FREE',
    label: 'FitTrack Free',
    badge: 'Starter',
    desc: 'Standard calorie tracking, workout logging & basic quotas',
    durationMonths: 1,
    icon: 'leaf-outline',
  },
  {
    tier: 'PRO_MONTHLY',
    label: 'Pro Monthly',
    badge: 'Most Popular',
    desc: '30 AI scans/day, 150 AI coach msgs, unlimited routines (₱499 / $9.99/mo)',
    durationMonths: 1,
    icon: 'flash-outline',
  },
  {
    tier: 'PRO_ANNUAL',
    label: 'Pro Annual',
    badge: 'Best Value · Save 33%',
    desc: 'All Pro features with 12 months access · 2 months free (₱3,999 / $79.99/yr)',
    durationMonths: 1,
    icon: 'sparkles-outline',
  },
];

export default function AdminUsersTab({
  users,
  loading,
  refreshing,
  search,
  onSearchChange,
  onSearchSubmit,
  roleFilter,
  onRoleFilterChange,
  tierFilter = 'ALL',
  onTierFilterChange,
  onReloadUsers,
}: AdminUsersTabProps) {
  const { colors } = useThemeColors();
  const { showSuccess, showError } = useToast();

  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [updatingUserRole, setUpdatingUserRole] = useState(false);
  const [overrideTier, setOverrideTier] = useState<SubscriptionTierType>('PRO_MONTHLY');
  const [savingOverride, setSavingOverride] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = roleFilter !== 'ALL' || (tierFilter && tierFilter !== 'ALL');
  const activeFilterCount = (roleFilter !== 'ALL' ? 1 : 0) + (tierFilter && tierFilter !== 'ALL' ? 1 : 0);

  // Confirmation modal states
  const [roleConfirmTarget, setRoleConfirmTarget] = useState<{ user: AdminUserItem; newRole: 'USER' | 'ADMIN' } | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<AdminUserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [overrideConfirm, setOverrideConfirm] = useState(false);

  const [suspendConfirmTarget, setSuspendConfirmTarget] = useState<AdminUserItem | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [updatingSuspension, setUpdatingSuspension] = useState(false);

  const getInitials = (firstName?: string, lastName?: string): string => {
    const f = firstName?.trim()?.charAt(0) || '';
    const l = lastName?.trim()?.charAt(0) || '';
    return (f + l).toUpperCase() || 'U';
  };

  const formatTierLabel = (tier?: string | null): string => {
    if (!tier || tier === 'FREE') return 'FitTrack Free';
    switch (tier) {
      case 'PRO_MONTHLY':
        return 'Pro Monthly';
      case 'PRO_ANNUAL':
        return 'Pro Annual';
      default:
        return capitalizeWords(tier.replace(/_/g, ' '));
    }
  };

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleToggleUserRole = (targetUser: AdminUserItem) => {
    triggerHapticFeedback();
    const newRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    setRoleConfirmTarget({ user: targetUser, newRole });
  };

  const executeToggleUserRole = async () => {
    if (!roleConfirmTarget) return;
    try {
      setUpdatingUserRole(true);
      triggerHapticFeedback();
      const res = await updateUserRoleApi(roleConfirmTarget.user.id, roleConfirmTarget.newRole);
      if (res.success) {
        showSuccess('Role Updated', `${roleConfirmTarget.user.firstName} is now a ${roleConfirmTarget.newRole}.`);
        setRoleConfirmTarget(null);
        setSelectedUser((prev) =>
          prev?.id === roleConfirmTarget.user.id
            ? { ...prev, role: roleConfirmTarget.newRole }
            : prev
        );
        onReloadUsers();
      }
    } catch (err: any) {
      showError('Role Error', err?.message || 'Could not change user permissions.');
    } finally {
      setUpdatingUserRole(false);
    }
  };

  const handleApplySubscriptionOverride = () => {
    triggerHapticFeedback();
    setOverrideConfirm(true);
  };

  const executeApplySubscriptionOverride = async () => {
    if (!selectedUser) return;
    try {
      setSavingOverride(true);
      triggerHapticFeedback();
      const selectedOption = TIER_OPTIONS.find((t) => t.tier === overrideTier);
      const duration = selectedOption?.durationMonths || 1;
      const res = await adminOverrideSubscriptionApi(selectedUser.id, overrideTier, 'ACTIVE', duration);
      if (res.success) {
        showSuccess('Tier Granted', `Updated ${selectedUser.firstName}'s plan to ${formatTierLabel(overrideTier)}.`);
        setOverrideConfirm(false);
        setShowOverrideModal(false);
        setSelectedUser((prev) =>
          prev
            ? {
                ...prev,
                subscription: {
                  tier: overrideTier,
                  status: 'ACTIVE',
                  currentPeriodEnd: res.subscription?.currentPeriodEnd || prev.subscription?.currentPeriodEnd,
                },
              }
            : null
        );
        onReloadUsers();
      }
    } catch (err: any) {
      showError('Subscription Error', err?.message || 'Failed to update user tier.');
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDeleteUserAccount = (targetUser: AdminUserItem) => {
    triggerHapticFeedback();
    setDeleteConfirmTarget(targetUser);
  };

  const executeDeleteUserAccount = async () => {
    if (!deleteConfirmTarget) return;
    try {
      setDeletingUser(true);
      triggerHapticFeedback();
      const res = await deleteUserApi(deleteConfirmTarget.id);
      if (res.success) {
        showSuccess('User Deleted', 'Account has been removed from database.');
        setDeleteConfirmTarget(null);
        setSelectedUser(null);
        onReloadUsers();
      }
    } catch (err: any) {
      showError('Delete Failed', err?.message || 'Could not delete user account.');
    } finally {
      setDeletingUser(false);
    }
  };

  const handleToggleSuspension = (targetUser: AdminUserItem) => {
    triggerHapticFeedback();
    setSuspensionReason(targetUser.suspendedReason || '');
    setSuspendConfirmTarget(targetUser);
  };

  const handleConfirmSuspension = async () => {
    if (!suspendConfirmTarget) return;
    try {
      setUpdatingSuspension(true);
      triggerHapticFeedback();
      const willSuspend = !suspendConfirmTarget.isSuspended;
      const res = await toggleUserSuspensionApi(
        suspendConfirmTarget.id,
        willSuspend,
        suspensionReason.trim() || undefined
      );
      if (res.success) {
        showSuccess(
          willSuspend ? 'Account Suspended' : 'Suspension Lifted',
          res.message
        );
        if (selectedUser?.id === suspendConfirmTarget.id) {
          setSelectedUser({
            ...selectedUser,
            isSuspended: willSuspend,
            suspendedReason: willSuspend ? (suspensionReason.trim() || 'Account suspended by administrator') : null,
          });
        }
        setSuspendConfirmTarget(null);
        onReloadUsers();
      }
    } catch (err: any) {
      showError('Action Failed', err?.message || 'Could not update suspension status.');
    } finally {
      setUpdatingSuspension(false);
    }
  };

  return (
    <View className="flex-1 min-h-0">
      {/* Pinned Search & Filter Header */}
      <View className="pb-3 gap-2">
        {/* Row 1: Search Bar + Collapsible Filters Toggle Button */}
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-surface-card dark:bg-surface-card-dark px-3.5 py-2.5 rounded-2xl border border-input-border dark:border-input-border-dark">
            <Ionicons name="search" size={16} color={colors.textMuted} className="mr-2" />
            <TextInput
              className="flex-1 text-sm text-text-primary dark:text-text-primary-dark p-0"
              placeholder="Search athletes by name or email..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={onSearchChange}
              onSubmitEditing={onSearchSubmit}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => onSearchChange('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => {
              triggerHapticFeedback();
              setShowFilters((prev) => !prev);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            className={`min-h-[44px] px-3.5 rounded-2xl border flex-row items-center gap-1.5 ${
              hasActiveFilters
                ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent/40'
                : showFilters
                ? 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                : 'bg-surface-card dark:bg-surface-card-dark border-input-border dark:border-input-border-dark'
            }`}
            accessibilityRole="button"
            accessibilityLabel="Toggle role and plan filters"
          >
            <Ionicons
              name={showFilters ? 'options' : 'options-outline'}
              size={15}
              color={hasActiveFilters ? colors.accent : colors.textPrimary}
            />
            <Text
              className={`text-xs font-bold ${
                hasActiveFilters
                  ? 'text-accent dark:text-accent-dark'
                  : 'text-text-primary dark:text-text-primary-dark'
              }`}
            >
              Filters
            </Text>
            {activeFilterCount > 0 && (
              <View className="px-1.5 py-0.2 rounded-full bg-accent dark:bg-accent-dark">
                <Text className="text-[10px] font-black text-accent-contrast dark:text-accent-contrast-dark">
                  {activeFilterCount}
                </Text>
              </View>
            )}
            <Ionicons
              name={showFilters ? 'chevron-up' : 'chevron-down'}
              size={13}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Active Filter Indicators when drawer is collapsed */}
        {!showFilters && hasActiveFilters && (
          <View className="flex-row items-center gap-1.5 flex-wrap pt-0.5">
            <Text className="text-[10px] font-semibold text-text-muted dark:text-text-muted-dark">
              Active:
            </Text>
            {roleFilter !== 'ALL' && (
              <View className="bg-accent/15 dark:bg-accent-dark/20 border border-accent/30 dark:border-accent-dark/30 px-2 py-0.5 rounded-lg flex-row items-center gap-1">
                <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                  {roleFilter === 'USER' ? 'Athletes' : 'Admins'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerHapticFeedback();
                    onRoleFilterChange('ALL');
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close" size={11} color={colors.accent} />
                </TouchableOpacity>
              </View>
            )}
            {tierFilter !== 'ALL' && (
              <View className="bg-success/15 border border-success/30 px-2 py-0.5 rounded-lg flex-row items-center gap-1">
                <Text className="text-[10px] font-bold text-success dark:text-success-dark">
                  {tierFilter === 'PRO' ? 'Pro Tier' : 'Free Tier'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerHapticFeedback();
                    onTierFilterChange?.('ALL');
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close" size={11} color={colors.accent} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Collapsible Role & Tier Drawer */}
        {showFilters && (
          <View className="bg-surface-card dark:bg-surface-card-dark p-3.5 rounded-2xl border border-input-border dark:border-input-border-dark gap-2.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
                Filter Athletes
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity
                  onPress={() => {
                    triggerHapticFeedback();
                    onRoleFilterChange('ALL');
                    onTierFilterChange?.('ALL');
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text className="text-[11px] font-bold text-accent dark:text-accent-dark">
                    Reset Filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Role Filter Chips */}
            <View className="flex-row items-center gap-2">
              <Text className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark w-10">
                Role:
              </Text>
              <View className="flex-row flex-1 flex-wrap gap-1.5">
                {(['ALL', 'USER', 'ADMIN'] as const).map((filter) => (
                  <FilterChip
                    key={filter}
                    label={filter === 'ALL' ? 'All Roles' : filter === 'USER' ? 'Athletes' : 'Admins'}
                    selected={roleFilter === filter}
                    onPress={() => {
                      triggerHapticFeedback();
                      onRoleFilterChange(filter);
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Tier Filter Chips */}
            {onTierFilterChange ? (
              <View className="flex-row items-center gap-2">
                <Text className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark w-10">
                  Plan:
                </Text>
                <View className="flex-row flex-1 flex-wrap gap-1.5">
                  {(['ALL', 'PRO', 'FREE'] as const).map((tFilter) => (
                    <FilterChip
                      key={tFilter}
                      label={tFilter === 'ALL' ? 'All Plans' : tFilter === 'PRO' ? 'Pro Tier' : 'Free Tier'}
                      selected={tierFilter === tFilter}
                      onPress={() => {
                        triggerHapticFeedback();
                        onTierFilterChange(tFilter);
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* Scrollable User List */}
      <ScrollView
        className="flex-1 min-h-0"
        contentContainerStyle={{ paddingBottom: 90, gap: 10 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onReloadUsers}
            tintColor={colors.accent}
          />
        }
      >
        {loading && !refreshing ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="small" color={colors.accent} />
            <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-2">
              Loading athlete records...
            </Text>
          </View>
        ) : users.length === 0 ? (
          <View className="py-16 items-center justify-center bg-surface-card/50 dark:bg-surface-card-dark/50 rounded-2xl border border-dashed border-input-border dark:border-input-border-dark p-6">
            <Ionicons name="people-outline" size={36} color={colors.textMuted} />
            <Text className="text-sm font-semibold text-text-muted dark:text-text-muted-dark mt-2">
              No matching athletes found
            </Text>
            <Text className="text-xs text-text-muted dark:text-text-muted-dark text-center mt-1">
              Try adjusting your search criteria or active filters.
            </Text>
          </View>
        ) : (
          users.map((item) => {
            const isItemAdmin = item.role === 'ADMIN';
            const isPro = item.subscription?.tier && item.subscription.tier !== 'FREE';
            const initials = getInitials(item.firstName, item.lastName);
            const safeAvatarUrl = sanitizeAvatarUrl(item.avatarUrl);

            return (
              <SurfaceCard
                key={item.id}
                onPress={() => {
                  triggerHapticFeedback();
                  setSelectedUser(item);
                }}
                className="p-3.5 rounded-2xl border border-input-border/70 dark:border-input-border-dark/70 active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  {/* Avatar Photo / Initials */}
                  <View
                    className={`w-12 h-12 rounded-2xl items-center justify-center overflow-hidden border ${
                      item.isSuspended
                        ? 'bg-danger/10 border-danger/30'
                        : isItemAdmin
                        ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent/40 dark:border-accent-dark/40'
                        : isPro
                        ? 'bg-emerald-500/15 border-emerald-500/30'
                        : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                    }`}
                  >
                    {safeAvatarUrl ? (
                      <Image
                        source={{ uri: safeAvatarUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text
                        className={`text-sm font-extrabold ${
                          item.isSuspended
                            ? 'text-danger dark:text-danger-dark'
                            : isItemAdmin
                            ? 'text-accent dark:text-accent-dark'
                            : isPro
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-text-primary dark:text-text-primary-dark'
                        }`}
                      >
                        {initials}
                      </Text>
                    )}
                  </View>

                  {/* User Information */}
                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-1.5 flex-wrap">
                      <Text
                        numberOfLines={1}
                        className="font-bold text-sm text-text-primary dark:text-text-primary-dark"
                      >
                        {capitalizeWords(item.firstName)} {capitalizeWords(item.lastName)}
                      </Text>

                      {isItemAdmin && (
                        <View className="bg-accent/15 dark:bg-accent-dark/20 border border-accent/30 dark:border-accent-dark/30 px-1.5 py-0.5 rounded-md flex-row items-center gap-0.5">
                          <Ionicons name="shield-checkmark" size={10} color={colors.accent} />
                          <Text className="text-[9px] font-black text-accent dark:text-accent-dark tracking-wide">
                            ADMIN
                          </Text>
                        </View>
                      )}

                      {isPro ? (
                        <View className="bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md flex-row items-center gap-0.5">
                          <Ionicons name="sparkles" size={10} color="#10B981" />
                          <Text className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 tracking-wide">
                            {formatTierLabel(item.subscription?.tier).toUpperCase()}
                          </Text>
                        </View>
                      ) : (
                        <View className="bg-input dark:bg-input-dark border border-input-border/60 dark:border-input-border-dark/60 px-1.5 py-0.5 rounded-md">
                          <Text className="text-[9px] font-semibold text-text-muted dark:text-text-muted-dark">
                            FREE
                          </Text>
                        </View>
                      )}

                      {item.isSuspended && (
                        <View className="bg-danger/15 border border-danger/30 px-1.5 py-0.5 rounded-md flex-row items-center gap-0.5">
                          <Ionicons name="ban" size={10} color={colors.danger} />
                          <Text className="text-[9px] font-black text-danger dark:text-danger-dark">
                            SUSPENDED
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text numberOfLines={1} className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                      {item.email}
                    </Text>

                    {/* Engagement & Metric Chips */}
                    <View className="flex-row items-center gap-1.5 mt-2 flex-wrap">
                      <View className="flex-row items-center gap-1 bg-input/70 dark:bg-input-dark/70 px-2 py-0.5 rounded-md border border-input-border/50 dark:border-input-border-dark/50">
                        <Ionicons name="fitness-outline" size={11} color={colors.textMuted} />
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark font-medium">
                          <Text className="font-bold text-text-primary dark:text-text-primary-dark">
                            {item._count?.workoutSessions || 0}
                          </Text>{' '}
                          workouts
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1 bg-input/70 dark:bg-input-dark/70 px-2 py-0.5 rounded-md border border-input-border/50 dark:border-input-border-dark/50">
                        <Ionicons name="restaurant-outline" size={11} color={colors.textMuted} />
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark font-medium">
                          <Text className="font-bold text-text-primary dark:text-text-primary-dark">
                            {item._count?.dailyFoodLogs || 0}
                          </Text>{' '}
                          meals
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1 bg-input/70 dark:bg-input-dark/70 px-2 py-0.5 rounded-md border border-input-border/50 dark:border-input-border-dark/50">
                        <Ionicons name="flag-outline" size={11} color={colors.textMuted} />
                        <Text className="text-[10px] text-text-muted dark:text-text-muted-dark font-medium">
                          {formatGoalLabel(item.goal)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Tap Forward Indicator */}
                  <View className="pl-1">
                    <View className="w-8 h-8 rounded-full bg-input/60 dark:bg-input-dark/60 items-center justify-center border border-input-border/60 dark:border-input-border-dark/60">
                      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                    </View>
                  </View>
                </View>
              </SurfaceCard>
            );
          })
        )}
      </ScrollView>

      {/* ── Manage User Modal ── */}
      {selectedUser && (
        <Modal
          visible={!!selectedUser && !showOverrideModal && !roleConfirmTarget && !deleteConfirmTarget}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedUser(null)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-3 sm:p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-lg max-h-[92%] rounded-3xl p-5 border border-input-border dark:border-input-border-dark flex-col shadow-2xl">
              {/* Header */}
              <View className="flex-row items-center justify-between pb-3 border-b border-input-border/50 dark:border-input-border-dark/50">
                <View className="flex-row items-center gap-2.5 flex-1 pr-2 min-w-0">
                  <View className="w-9 h-9 rounded-2xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center">
                    <Ionicons name="person-circle-outline" size={20} color={colors.accent} />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={1} className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                      Athlete Management
                    </Text>
                    <Text numberOfLines={1} className="text-[10px] text-text-muted dark:text-text-muted-dark">
                      User ID: {selectedUser.id}
                    </Text>
                  </View>
                </View>
                <ModalCloseButton onClose={() => setSelectedUser(null)} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={{ paddingVertical: 12, gap: 14 }}
              >
                {/* User Profile Hero Card */}
                {(() => {
                  const safeSelectedAvatar = sanitizeAvatarUrl(selectedUser.avatarUrl);
                  return (
                    <View className="bg-input/50 dark:bg-input-dark/50 p-4 rounded-2xl border border-input-border/70 dark:border-input-border-dark/70">
                      <View className="flex-row items-center gap-3.5">
                        <View
                          className={`w-14 h-14 rounded-2xl items-center justify-center overflow-hidden border-2 ${
                            selectedUser.isSuspended
                              ? 'bg-danger/10 border-danger/40'
                              : selectedUser.role === 'ADMIN'
                              ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent/50 dark:border-accent-dark/50'
                              : selectedUser.subscription?.tier && selectedUser.subscription.tier !== 'FREE'
                              ? 'bg-emerald-500/15 border-emerald-500/40'
                              : 'bg-surface dark:bg-surface-dark border-input-border dark:border-input-border-dark'
                          }`}
                        >
                          {safeSelectedAvatar ? (
                            <Image
                              source={{ uri: safeSelectedAvatar }}
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          ) : (
                            <Text
                              className={`text-lg font-black ${
                                selectedUser.isSuspended
                                  ? 'text-danger dark:text-danger-dark'
                                  : selectedUser.role === 'ADMIN'
                                  ? 'text-accent dark:text-accent-dark'
                                  : selectedUser.subscription?.tier && selectedUser.subscription.tier !== 'FREE'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-text-primary dark:text-text-primary-dark'
                              }`}
                            >
                              {getInitials(selectedUser.firstName, selectedUser.lastName)}
                            </Text>
                          )}
                        </View>

                    <View className="flex-1 min-w-0">
                      <Text numberOfLines={1} className="font-extrabold text-base text-text-primary dark:text-text-primary-dark">
                        {capitalizeWords(selectedUser.firstName)} {capitalizeWords(selectedUser.lastName)}
                      </Text>
                      <Text numberOfLines={1} className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                        {selectedUser.email}
                      </Text>

                      {/* Status Badges */}
                      <View className="flex-row items-center gap-1.5 mt-2 flex-wrap">
                        {selectedUser.role === 'ADMIN' ? (
                          <View className="bg-accent/15 dark:bg-accent-dark/20 border border-accent/30 dark:border-accent-dark/30 px-2 py-0.5 rounded-md flex-row items-center gap-1">
                            <Ionicons name="shield-checkmark" size={10} color={colors.accent} />
                            <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">ADMIN</Text>
                          </View>
                        ) : (
                          <View className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-2 py-0.5 rounded-md">
                            <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark">ATHLETE</Text>
                          </View>
                        )}

                        <View
                          className={`px-2 py-0.5 rounded-md border flex-row items-center gap-1 ${
                            selectedUser.subscription?.tier && selectedUser.subscription.tier !== 'FREE'
                              ? 'bg-emerald-500/15 border-emerald-500/30'
                              : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                          }`}
                        >
                          <Ionicons
                            name={selectedUser.subscription?.tier && selectedUser.subscription.tier !== 'FREE' ? 'sparkles' : 'leaf-outline'}
                            size={10}
                            color={selectedUser.subscription?.tier && selectedUser.subscription.tier !== 'FREE' ? '#10B981' : colors.textMuted}
                          />
                          <Text
                            className={`text-[10px] font-bold ${
                              selectedUser.subscription?.tier && selectedUser.subscription.tier !== 'FREE'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-text-muted dark:text-text-muted-dark'
                            }`}
                          >
                            {formatTierLabel(selectedUser.subscription?.tier)}
                          </Text>
                        </View>

                        {selectedUser.isSuspended && (
                          <View className="bg-danger/15 border border-danger/30 px-2 py-0.5 rounded-md flex-row items-center gap-1">
                            <Ionicons name="ban" size={10} color={colors.danger} />
                            <Text className="text-[10px] font-bold text-danger dark:text-danger-dark">SUSPENDED</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Joined Date & Goal Footer */}
                  <View className="mt-3 pt-2.5 border-t border-input-border/50 dark:border-input-border-dark/50 flex-row items-center justify-between">
                    <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                      Joined: <Text className="font-semibold text-text-primary dark:text-text-primary-dark">{formatDate(selectedUser.createdAt)}</Text>
                    </Text>
                    <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                      Goal: <Text className="font-semibold text-text-primary dark:text-text-primary-dark">{formatGoalLabel(selectedUser.goal)}</Text>
                    </Text>
                  </View>
                </View>
              );
            })()}

                {/* 4-Tile Quick Metric Bento Grid */}
                <View className="gap-2">
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
                    Athlete Activity & Biometrics
                  </Text>
                  <View className="flex-row gap-2.5">
                    {/* Tile 1: Workouts Completed */}
                    <View className="flex-1 bg-surface-card dark:bg-surface-card-dark p-3 rounded-2xl border border-input-border dark:border-input-border-dark">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase">
                          Workouts
                        </Text>
                        <View className="w-6 h-6 rounded-lg bg-accent/15 dark:bg-accent-dark/20 items-center justify-center">
                          <Ionicons name="fitness" size={13} color={colors.accent} />
                        </View>
                      </View>
                      <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark">
                        {selectedUser._count?.workoutSessions || 0}
                      </Text>
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                        Sessions completed
                      </Text>
                    </View>

                    {/* Tile 2: Food & Meal Logs */}
                    <View className="flex-1 bg-surface-card dark:bg-surface-card-dark p-3 rounded-2xl border border-input-border dark:border-input-border-dark">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase">
                          Nutrition
                        </Text>
                        <View className="w-6 h-6 rounded-lg bg-warning/15 items-center justify-center">
                          <Ionicons name="restaurant" size={13} color={colors.warning} />
                        </View>
                      </View>
                      <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark">
                        {selectedUser._count?.dailyFoodLogs || 0}
                      </Text>
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                        Daily food logs
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2.5">
                    {/* Tile 3: Biometrics & Target */}
                    <View className="flex-1 bg-surface-card dark:bg-surface-card-dark p-3 rounded-2xl border border-input-border dark:border-input-border-dark">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase">
                          Body Weight
                        </Text>
                        <View className="w-6 h-6 rounded-lg bg-info/15 items-center justify-center">
                          <Ionicons name="scale" size={13} color={colors.info} />
                        </View>
                      </View>
                      <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark">
                        {selectedUser.weight || '--'}{' '}
                        <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">kg</Text>
                      </Text>
                      <Text numberOfLines={1} className="text-[10px] text-text-muted dark:text-text-muted-dark">
                        Target: {selectedUser.targetWeight ? `${selectedUser.targetWeight} kg` : 'N/A'} • {selectedUser.height || '--'} cm • {selectedUser.age ? `${selectedUser.age} yrs` : '--'}
                      </Text>
                    </View>

                    {/* Tile 4: Subscription Status */}
                    <View className="flex-1 bg-surface-card dark:bg-surface-card-dark p-3 rounded-2xl border border-input-border dark:border-input-border-dark">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase">
                          Subscription
                        </Text>
                        <View className="w-6 h-6 rounded-lg bg-purple-500/15 items-center justify-center">
                          <Ionicons name="ribbon" size={13} color="#A855F7" />
                        </View>
                      </View>
                      <Text numberOfLines={1} className="text-sm font-black text-text-primary dark:text-text-primary-dark">
                        {formatTierLabel(selectedUser.subscription?.tier)}
                      </Text>
                      <Text numberOfLines={1} className="text-[10px] text-text-muted dark:text-text-muted-dark">
                        {selectedUser.subscription?.currentPeriodEnd
                          ? `Renews: ${formatDate(selectedUser.subscription.currentPeriodEnd)}`
                          : `Status: ${selectedUser.subscription?.status || 'Active'}`}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Suspended Alert Banner (if applicable) */}
                {selectedUser.isSuspended && (
                  <View className="bg-danger/10 border border-danger/30 p-3.5 rounded-2xl gap-2">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="alert-circle" size={18} color={colors.danger} />
                        <Text className="text-xs font-bold text-danger dark:text-danger-dark">
                          Account is currently Suspended
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleToggleSuspension(selectedUser)}
                        className="bg-danger/20 px-2.5 py-1 rounded-lg"
                      >
                        <Text className="text-[10px] font-bold text-danger dark:text-danger-dark">
                          Lift Ban
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {selectedUser.suspendedReason ? (
                      <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                        Reason: <Text className="font-semibold text-danger dark:text-danger-dark">{selectedUser.suspendedReason}</Text>
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Administrative Controls */}
                <View className="gap-2.5">
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
                    Administrative Controls
                  </Text>

                  {/* Action 1: Role Switch */}
                  <View className="bg-surface-card dark:bg-surface-card-dark p-3.5 rounded-2xl border border-input-border dark:border-input-border-dark flex-row items-center justify-between gap-3">
                    <View className="w-10 h-10 rounded-xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center">
                      <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                        {selectedUser.role === 'ADMIN' ? 'Administrator Role' : 'Athlete Account'}
                      </Text>
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                        {selectedUser.role === 'ADMIN'
                          ? 'Has full dashboard permissions & system control'
                          : 'Standard athlete access for training and nutrition'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleToggleUserRole(selectedUser)}
                      disabled={updatingUserRole}
                      className={`px-3 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                        selectedUser.role === 'ADMIN'
                          ? 'bg-danger/10 border-danger/30'
                          : 'bg-accent border-accent'
                      }`}
                    >
                      <Ionicons
                        name={selectedUser.role === 'ADMIN' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                        size={14}
                        color={selectedUser.role === 'ADMIN' ? colors.danger : colors.textPrimary}
                      />
                      <Text
                        className={`text-xs font-bold ${
                          selectedUser.role === 'ADMIN'
                            ? 'text-danger dark:text-danger-dark'
                            : 'text-accent-contrast'
                        }`}
                      >
                        {selectedUser.role === 'ADMIN' ? 'Demote' : 'Promote'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Action 2: Subscription Override */}
                  <View className="bg-surface-card dark:bg-surface-card-dark p-3.5 rounded-2xl border border-input-border dark:border-input-border-dark flex-row items-center justify-between gap-3">
                    <View className="w-10 h-10 rounded-xl bg-purple-500/15 items-center justify-center">
                      <Ionicons name="ribbon-outline" size={20} color="#A855F7" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                        Subscription Plan
                      </Text>
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                        Override plan to Free, Pro Monthly, or Pro Annual
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        triggerHapticFeedback();
                        setShowOverrideModal(true);
                      }}
                      className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-3 py-2 rounded-xl flex-row items-center gap-1.5"
                    >
                      <Ionicons name="create-outline" size={14} color={colors.accent} />
                      <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                        Change Tier
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Action 3: Suspension Toggle */}
                  <View className="bg-surface-card dark:bg-surface-card-dark p-3.5 rounded-2xl border border-input-border dark:border-input-border-dark flex-row items-center justify-between gap-3">
                    <View
                      className={`w-10 h-10 rounded-xl items-center justify-center ${
                        selectedUser.isSuspended ? 'bg-success/15' : 'bg-warning/15'
                      }`}
                    >
                      <Ionicons
                        name={selectedUser.isSuspended ? 'lock-open-outline' : 'lock-closed-outline'}
                        size={20}
                        color={selectedUser.isSuspended ? colors.success : colors.warning}
                      />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                        {selectedUser.isSuspended ? 'Suspended Account' : 'Account Standing'}
                      </Text>
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                        {selectedUser.isSuspended
                          ? 'User is blocked from signing into FitTrack'
                          : 'Account is active and operating normally'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleToggleSuspension(selectedUser)}
                      disabled={updatingSuspension}
                      className={`px-3 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                        selectedUser.isSuspended
                          ? 'bg-success/15 border-success/30'
                          : 'bg-warning/15 border-warning/30'
                      }`}
                    >
                      <Ionicons
                        name={selectedUser.isSuspended ? 'checkmark-circle-outline' : 'ban-outline'}
                        size={14}
                        color={selectedUser.isSuspended ? colors.success : colors.warning}
                      />
                      <Text
                        className={`text-xs font-bold ${
                          selectedUser.isSuspended
                            ? 'text-success dark:text-success-dark'
                            : 'text-warning dark:text-warning-dark'
                        }`}
                      >
                        {selectedUser.isSuspended ? 'Lift Ban' : 'Suspend'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Action 4: Danger Zone */}
                  <View className="bg-danger/5 border border-danger/25 p-3.5 rounded-2xl gap-2 mt-1">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        <Text className="text-xs font-bold text-danger dark:text-danger-dark">
                          Danger Zone
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteUserAccount(selectedUser)}
                        disabled={deletingUser}
                        className="bg-danger/15 border border-danger/30 px-3 py-1.5 rounded-xl flex-row items-center gap-1.5"
                      >
                        <Ionicons name="trash" size={12} color={colors.danger} />
                        <Text className="text-xs font-bold text-danger dark:text-danger-dark">
                          Delete Account
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text className="text-[10px] text-text-muted dark:text-text-muted-dark leading-relaxed">
                      Permanently purge this athlete and all associated workout logs, meal entries, and history from the database.
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Override Subscription Modal ── */}
      {showOverrideModal && selectedUser && (
        <Modal
          visible={showOverrideModal && !overrideConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowOverrideModal(false)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-3 sm:p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-md max-h-[92%] rounded-3xl p-5 border border-input-border dark:border-input-border-dark flex-col shadow-2xl">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2.5 flex-1 pr-2 min-w-0">
                  <View className="w-9 h-9 rounded-2xl bg-purple-500/15 items-center justify-center">
                    <Ionicons name="ribbon" size={18} color="#A855F7" />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={1} className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                      Grant Subscription Tier
                    </Text>
                    <Text numberOfLines={1} className="text-[10px] text-text-muted dark:text-text-muted-dark">
                      For {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
                    </Text>
                  </View>
                </View>
                <ModalCloseButton onClose={() => setShowOverrideModal(false)} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingVertical: 8, gap: 10 }}>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark leading-relaxed">
                  Select a plan tier below. Overriding updates the user's entitlements immediately in the database.
                </Text>

                <View className="gap-2.5">
                  {TIER_OPTIONS.map((item) => {
                    const isSelected = overrideTier === item.tier;
                    return (
                      <TouchableOpacity
                        key={item.tier}
                        onPress={() => {
                          triggerHapticFeedback();
                          setOverrideTier(item.tier);
                        }}
                        className={`p-3.5 rounded-2xl border ${
                          isSelected
                            ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent dark:border-accent-dark'
                            : 'bg-surface-card dark:bg-surface-card-dark border-input-border dark:border-input-border-dark'
                        }`}
                      >
                        <View className="flex-row items-start justify-between gap-2">
                          <View className="flex-row items-start gap-3 flex-1">
                            <View
                              className={`w-9 h-9 rounded-xl items-center justify-center mt-0.5 ${
                                isSelected
                                  ? 'bg-accent'
                                  : 'bg-input dark:bg-input-dark'
                              }`}
                            >
                              <Ionicons
                                name={item.icon}
                                size={18}
                                color={isSelected ? colors.accentContrast : colors.textMuted}
                              />
                            </View>
                            <View className="flex-1 min-w-0">
                              <View className="flex-row items-center gap-1.5 flex-wrap">
                                <Text
                                  className={`text-xs font-bold ${
                                    isSelected
                                      ? 'text-accent dark:text-accent-dark'
                                      : 'text-text-primary dark:text-text-primary-dark'
                                  }`}
                                >
                                  {item.label}
                                </Text>
                                <View
                                  className={`px-1.5 py-0.2 rounded-md ${
                                    isSelected
                                      ? 'bg-accent/20 border border-accent/40'
                                      : 'bg-input dark:bg-input-dark border border-input-border/50'
                                  }`}
                                >
                                  <Text
                                    className={`text-[9px] font-bold ${
                                      isSelected ? 'text-accent dark:text-accent-dark' : 'text-text-muted'
                                    }`}
                                  >
                                    {item.badge}
                                  </Text>
                                </View>
                              </View>
                              <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-1 leading-snug">
                                {item.desc}
                              </Text>
                            </View>
                          </View>

                          <View
                            className={`w-5 h-5 rounded-full border items-center justify-center mt-1 ${
                              isSelected
                                ? 'border-accent bg-accent'
                                : 'border-input-border dark:border-input-border-dark'
                            }`}
                          >
                            {isSelected && (
                              <Ionicons name="checkmark" size={12} color={colors.accentContrast} />
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View className="flex-row gap-2.5 mt-2">
                  <TouchableOpacity
                    onPress={() => setShowOverrideModal(false)}
                    className="flex-1 min-h-[46px] rounded-xl border border-input-border dark:border-input-border-dark items-center justify-center"
                  >
                    <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleApplySubscriptionOverride}
                    disabled={savingOverride}
                    className="flex-1 min-h-[46px] bg-accent rounded-xl items-center justify-center"
                  >
                    {savingOverride ? (
                      <ActivityIndicator size="small" color={colors.accentContrast} />
                    ) : (
                      <Text className="text-xs font-bold text-accent-contrast">
                        Apply Plan Tier
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Suspension Modal ── */}
      {suspendConfirmTarget && (
        <Modal
          visible={Boolean(suspendConfirmTarget)}
          transparent
          animationType="fade"
          onRequestClose={() => setSuspendConfirmTarget(null)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-3 sm:p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-md rounded-3xl p-5 border border-input-border dark:border-input-border-dark shadow-2xl">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2.5 flex-1 pr-2 min-w-0">
                  <View
                    className={`w-9 h-9 rounded-2xl items-center justify-center ${
                      suspendConfirmTarget.isSuspended ? 'bg-success/15' : 'bg-danger/15'
                    }`}
                  >
                    <Ionicons
                      name={suspendConfirmTarget.isSuspended ? 'shield-checkmark' : 'ban'}
                      size={18}
                      color={suspendConfirmTarget.isSuspended ? colors.success : colors.danger}
                    />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={1} className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                      {suspendConfirmTarget.isSuspended ? 'Restore Platform Access' : 'Suspend Athlete Account'}
                    </Text>
                    <Text numberOfLines={1} className="text-[10px] text-text-muted dark:text-text-muted-dark">
                      {suspendConfirmTarget.firstName} {suspendConfirmTarget.lastName} ({suspendConfirmTarget.email})
                    </Text>
                  </View>
                </View>
                <ModalCloseButton onClose={() => setSuspendConfirmTarget(null)} />
              </View>

              <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-3 leading-relaxed">
                {suspendConfirmTarget.isSuspended
                  ? `Restore full platform access for ${suspendConfirmTarget.firstName}. Their account will be unlocked and they will be able to log in immediately.`
                  : `Revoke platform access for ${suspendConfirmTarget.firstName}. They will be immediately logged out and blocked from accessing FitTrack until restored.`}
              </Text>

              {!suspendConfirmTarget.isSuspended && (
                <View className="mb-4 gap-2">
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
                    Quick Reasons
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {SUSPENSION_PRESETS.map((preset) => (
                      <TouchableOpacity
                        key={preset}
                        onPress={() => {
                          triggerHapticFeedback();
                          setSuspensionReason(preset);
                        }}
                        className={`px-2.5 py-1 rounded-lg border ${
                          suspensionReason === preset
                            ? 'bg-danger/15 border-danger/40'
                            : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-semibold ${
                            suspensionReason === preset
                              ? 'text-danger dark:text-danger-dark'
                              : 'text-text-muted dark:text-text-muted-dark'
                          }`}
                        >
                          {preset}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mt-2">
                    Reason (shown upon login)
                  </Text>
                  <TextInput
                    className="bg-surface-card dark:bg-surface-card-dark px-3.5 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark text-xs text-text-primary dark:text-text-primary-dark min-h-[70px]"
                    placeholder="Provide a reason for the account suspension..."
                    placeholderTextColor={colors.textMuted}
                    value={suspensionReason}
                    onChangeText={setSuspensionReason}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              )}

              <View className="flex-row gap-2.5 mt-2">
                <TouchableOpacity
                  onPress={() => setSuspendConfirmTarget(null)}
                  className="flex-1 min-h-[46px] rounded-xl border border-input-border dark:border-input-border-dark items-center justify-center"
                >
                  <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirmSuspension}
                  disabled={updatingSuspension}
                  className={`flex-1 min-h-[46px] rounded-xl items-center justify-center ${
                    suspendConfirmTarget.isSuspended ? 'bg-success' : 'bg-danger'
                  }`}
                >
                  {updatingSuspension ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-xs font-bold text-white">
                      {suspendConfirmTarget.isSuspended ? 'Lift Suspension' : 'Confirm Suspension'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Role Change Confirmation Modal ── */}
      <ConfirmModal
        visible={Boolean(roleConfirmTarget)}
        title={roleConfirmTarget?.newRole === 'ADMIN' ? 'Promote to Administrator?' : 'Demote to Athlete?'}
        message={
          roleConfirmTarget?.newRole === 'ADMIN'
            ? `Grant full administrative privileges to ${roleConfirmTarget?.user.firstName} ${roleConfirmTarget?.user.lastName} (${roleConfirmTarget?.user.email})?`
            : `Remove administrator permissions for ${roleConfirmTarget?.user.firstName} ${roleConfirmTarget?.user.lastName}?`
        }
        confirmText={roleConfirmTarget?.newRole === 'ADMIN' ? 'Promote to Admin' : 'Demote User'}
        cancelText="Cancel"
        isDanger={roleConfirmTarget?.newRole === 'USER'}
        iconName={roleConfirmTarget?.newRole === 'ADMIN' ? 'shield-checkmark-outline' : 'shield-outline'}
        loading={updatingUserRole}
        onConfirm={executeToggleUserRole}
        onCancel={() => setRoleConfirmTarget(null)}
      />

      {/* ── User Account Deletion Confirmation Modal ── */}
      <ConfirmModal
        visible={Boolean(deleteConfirmTarget)}
        title="Permanently Delete User?"
        message={`Are you sure you want to permanently erase the account for ${deleteConfirmTarget?.firstName} ${deleteConfirmTarget?.lastName} (${deleteConfirmTarget?.email})? All workouts, meal logs, and metrics will be wiped permanently.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        isDanger
        iconName="trash-outline"
        loading={deletingUser}
        onConfirm={executeDeleteUserAccount}
        onCancel={() => setDeleteConfirmTarget(null)}
      />

      {/* ── Subscription Override Confirmation Modal ── */}
      <ConfirmModal
        visible={overrideConfirm}
        title="Confirm Tier Override?"
        message={`Grant ${formatTierLabel(overrideTier)} subscription access to ${selectedUser?.firstName} ${selectedUser?.lastName}?`}
        confirmText="Apply Override"
        cancelText="Cancel"
        iconName="ribbon-outline"
        loading={savingOverride}
        onConfirm={executeApplySubscriptionOverride}
        onCancel={() => setOverrideConfirm(false)}
      />
    </View>
  );
}
