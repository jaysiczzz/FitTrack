import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { triggerHapticFeedback } from '@/utils/haptics';
import SurfaceCard from '@/components/ui/SurfaceCard';
import ModalCloseButton from '@/components/ui/ModalCloseButton';
import FilterChip from '@/components/ui/FilterChip';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { AdminUserItem, updateUserRoleApi, deleteUserApi } from '@/api/admin';
import {
  adminOverrideSubscriptionApi,
  SubscriptionTierType,
} from '@/api/subscription';
import { capitalizeWords } from '@/utils/formatters';

const formatGoal = (goal?: string) => {
  if (!goal) return 'General Fitness';
  if (goal === 'MUSCLE_GAIN') return 'Muscle Gain';
  if (goal === 'WEIGHT_LOSS') return 'Weight Loss';
  if (goal === 'MAINTENANCE') return 'Maintenance';
  return capitalizeWords(goal.replace(/_/g, ' ').toLowerCase());
};

interface AdminUsersTabProps {
  users: AdminUserItem[];
  loading: boolean;
  refreshing: boolean;
  search: string;
  onSearchChange: (s: string) => void;
  onSearchSubmit: () => void;
  roleFilter: 'ALL' | 'USER' | 'ADMIN';
  onRoleFilterChange: (role: 'ALL' | 'USER' | 'ADMIN') => void;
  onReloadUsers: () => void;
}

export default function AdminUsersTab({
  users,
  loading,
  refreshing,
  search,
  onSearchChange,
  onSearchSubmit,
  roleFilter,
  onRoleFilterChange,
  onReloadUsers,
}: AdminUsersTabProps) {
  const { colors } = useThemeColors();
  const { showSuccess, showError } = useToast();

  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [updatingUserRole, setUpdatingUserRole] = useState(false);
  const [overrideTier, setOverrideTier] = useState<SubscriptionTierType>('PRO_MONTHLY');
  const [savingOverride, setSavingOverride] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Confirmation modal states
  const [roleConfirmTarget, setRoleConfirmTarget] = useState<{ user: AdminUserItem; newRole: 'USER' | 'ADMIN' } | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<AdminUserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [overrideConfirm, setOverrideConfirm] = useState(false);

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
        setSelectedUser(null);
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
      const res = await adminOverrideSubscriptionApi(selectedUser.id, overrideTier, 'ACTIVE', 1);
      if (res.success) {
        showSuccess('Tier Granted', `Updated ${selectedUser.firstName}'s plan to ${overrideTier}.`);
        setOverrideConfirm(false);
        setShowOverrideModal(false);
        setSelectedUser(null);
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

  return (
    <View className="gap-3">
      {/* Search Bar */}
      <View className="flex-row items-center bg-surface-card dark:bg-surface-card-dark px-3 py-2.5 rounded-xl border border-input-border dark:border-input-border-dark">
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

      {/* Role Filter Chips */}
      <View className="flex-row flex-wrap gap-2">
        {(['ALL', 'USER', 'ADMIN'] as const).map((filter) => (
          <FilterChip
            key={filter}
            label={filter === 'ALL' ? 'All Roles' : filter === 'USER' ? 'Athletes Only' : 'Admins Only'}
            selected={roleFilter === filter}
            onPress={() => {
              triggerHapticFeedback();
              onRoleFilterChange(filter);
            }}
          />
        ))}
      </View>

      {/* User List */}
      {loading && !refreshing ? (
        <View className="py-20 items-center justify-center">
          <ActivityIndicator size="small" color={colors.accent} />
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
                      {capitalizeWords(item.firstName)} {capitalizeWords(item.lastName)}
                    </Text>
                    {isItemAdmin ? (
                      <View className="bg-accent/15 dark:bg-accent-dark/20 border border-accent/30 dark:border-accent-dark/30 px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">ADMIN</Text>
                      </View>
                    ) : (
                      <View className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark">ATHLETE</Text>
                      </View>
                    )}
                    {isPro && (
                      <View className="bg-success/15 border border-success/30 px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] font-bold text-success dark:text-success-dark">PRO</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                    {item.email}
                  </Text>
                  <View className="flex-row items-center gap-1.5 mt-1.5 flex-wrap">
                    <View className="bg-input/80 dark:bg-input-dark/80 px-2 py-0.5 rounded-md border border-input-border/50">
                      <Text className="text-[10px] text-text-muted dark:text-text-muted-dark font-medium">
                        Goal: <Text className="font-bold text-text-primary dark:text-text-primary-dark">{formatGoal(item.goal)}</Text>
                      </Text>
                    </View>
                    <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                      🏋️ {item._count?.workoutSessions || 0} sessions · 🥗 {item._count?.dailyFoodLogs || 0} meal days
                    </Text>
                  </View>
                </View>

                {/* Action Menu Trigger */}
                <TouchableOpacity
                  onPress={() => {
                    triggerHapticFeedback();
                    setSelectedUser(item);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="bg-surface-card dark:bg-surface-card-dark min-h-[44px] px-3.5 py-2 rounded-lg border border-input-border dark:border-input-border-dark items-center justify-center"
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

      {/* ── Manage User Modal ── */}
      {selectedUser && (
        <Modal
          visible={!!selectedUser && !showOverrideModal && !roleConfirmTarget && !deleteConfirmTarget}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedUser(null)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-sm md:max-w-md rounded-2xl p-5 border border-input-border dark:border-input-border-dark">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-extrabold text-text-primary dark:text-text-primary-dark">
                  Manage User
                </Text>
                <ModalCloseButton onClose={() => setSelectedUser(null)} />
              </View>

              <View className="bg-surface-card dark:bg-surface-card-dark p-3 rounded-xl mb-4">
                <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
                  {capitalizeWords(selectedUser.firstName)} {capitalizeWords(selectedUser.lastName)}
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  {selectedUser.email}
                </Text>
                <View className="flex-row flex-wrap gap-1.5 mt-2">
                  <View className="bg-accent/15 dark:bg-accent-dark/20 border border-accent/30 dark:border-accent-dark/30 px-2 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                      Role: {selectedUser.role}
                    </Text>
                  </View>
                  <View className="bg-info/10 border border-info/20 px-2 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-info dark:text-info-dark">
                      Tier: {selectedUser.subscription?.tier?.replace(/_/g, ' ') || 'FREE'}
                    </Text>
                  </View>
                  <View className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-2 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark">
                      Goal: {formatGoal(selectedUser.goal)}
                    </Text>
                  </View>
                </View>

                <View className="mt-2.5 pt-2 border-t border-input-border/40 dark:border-input-border-dark/40 flex-row justify-between">
                  <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                    Total Workouts: <Text className="font-bold text-text-primary dark:text-text-primary-dark">{selectedUser._count?.workoutSessions || 0}</Text>
                  </Text>
                  <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                    Meal Days: <Text className="font-bold text-text-primary dark:text-text-primary-dark">{selectedUser._count?.dailyFoodLogs || 0}</Text>
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="gap-2.5">
                {/* 1. Toggle Admin Role */}
                <TouchableOpacity
                  onPress={() => handleToggleUserRole(selectedUser)}
                  disabled={updatingUserRole}
                  className={`min-h-[48px] py-3.5 rounded-xl border items-center justify-center ${
                    selectedUser.role === 'ADMIN'
                      ? 'bg-danger/15 border-danger/30'
                      : 'bg-accent border-accent'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      selectedUser.role === 'ADMIN'
                        ? 'text-danger dark:text-danger-dark'
                        : 'text-accent-contrast'
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
                  className="min-h-[48px] py-3.5 rounded-xl bg-surface-card dark:bg-surface-card-dark border border-input-border dark:border-input-border-dark items-center justify-center"
                >
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    Override Subscription Tier
                  </Text>
                </TouchableOpacity>

                {/* 3. Delete Account */}
                <TouchableOpacity
                  onPress={() => handleDeleteUserAccount(selectedUser)}
                  className="min-h-[48px] py-3.5 rounded-xl bg-danger/10 border border-danger/20 items-center justify-center mt-2"
                >
                  <Text className="text-xs font-bold text-danger dark:text-danger-dark">
                    Delete User Account
                  </Text>
                </TouchableOpacity>
              </View>
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
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-surface dark:bg-surface-dark w-full max-w-sm md:max-w-md rounded-2xl p-5 border border-input-border dark:border-input-border-dark">
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
                  ] as const
                ).map((item) => (
                  <TouchableOpacity
                    key={item.tier}
                    onPress={() => {
                      triggerHapticFeedback();
                      setOverrideTier(item.tier);
                    }}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    className={`min-h-[48px] p-3 rounded-xl border flex-row items-center justify-between ${
                      overrideTier === item.tier
                        ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent dark:border-accent-dark'
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
                      <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleApplySubscriptionOverride}
                disabled={savingOverride}
                className="bg-accent min-h-[48px] py-3.5 rounded-xl items-center justify-center"
              >
                {savingOverride ? (
                  <ActivityIndicator size="small" color={colors.accentContrast} />
                ) : (
                  <Text className="text-xs font-bold text-accent-contrast">Apply Tier Override</Text>
                )}
              </TouchableOpacity>
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
        message={`Grant ${overrideTier} subscription access to ${selectedUser?.firstName} ${selectedUser?.lastName}?`}
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
