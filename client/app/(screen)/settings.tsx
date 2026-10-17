import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  ScrollView,
  Platform,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { authStorage } from '@/utils/authStorage';
import ConfirmModal from '@/components/ui/ConfirmModal';
import SurfaceCard from '@/components/ui/SurfaceCard';
import { THEME_STORAGE_KEY } from '@/constants/storageKeys';
import { getFriendlyErrorMessage } from '@/utils/errorMapper';
import ResetPasswordModal from '@/components/settings/ResetPasswordModal';
import HelpSupportModal from '@/components/settings/HelpSupportModal';
import PrivacyPolicyModal from '@/components/settings/PrivacyPolicyModal';
import SubscriptionModal from '@/components/subscription/SubscriptionModal';
import EWalletModal from '@/components/subscription/EWalletModal';
import EditProfileModal from '@/components/profile/EditProfileModal';
import {
  getCurrentSubscriptionApi,
  getUserWalletApi,
  UserSubscription,
} from '@/api/subscription';
import { deleteUserAccount } from '@/api/user';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColors } from '@/constants/colors';
import TimePickerModal from '@/components/settings/TimePickerModal';
import {
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  saveNotificationSettings,
  resetNotificationSettings,
  requestNotificationPermission,
  hasNotificationPermission,
  sendTestNotification,
  formatTimeDisplay,
} from '@/utils/notificationService';

import { hapticFeedback } from '@/utils/haptics';
import { useWeightUnit, useHeightUnit } from '@/constants/units';

export default function Settings() {
  const router = useRouter();
  const { colors, isDark, setColorScheme } = useThemeColors();
  const { user, logout, refreshProfile } = useAuth();
  const { showSuccess, showWarning, showError } = useToast();
  const [weightUnit, setWeightUnit] = useWeightUnit();
  const [heightUnit, setHeightUnit] = useHeightUnit();

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  // Automatically sync fresh user profile (role, subscription) on settings view
  useEffect(() => {
    refreshProfile().catch(() => {});
  }, [refreshProfile]);

  const handleToggleTheme = (nextDark: boolean) => {
    hapticFeedback.light();
    setColorScheme(nextDark ? 'dark' : 'light');
  };

  // Modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpInitialTab, setHelpInitialTab] = useState<'faq' | 'contact'>('faq');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showEWalletModal, setShowEWalletModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const params = useLocalSearchParams<{ modal?: string; tab?: string }>();

  // Deep-link modal listener (e.g. from support or subscription notifications)
  useEffect(() => {
    if (params.modal === 'help' || params.modal === 'support') {
      setHelpInitialTab(params.tab === 'contact' ? 'contact' : 'faq');
      setShowHelpModal(true);
    } else if (params.modal === 'subscription') {
      setShowSubscriptionModal(true);
    } else if (params.modal === 'wallet') {
      setShowEWalletModal(true);
    } else if (params.modal === 'profile') {
      setShowEditProfileModal(true);
    }
  }, [params.modal, params.tab]);

  // Subscription & Wallet State
  const [currentSub, setCurrentSub] = useState<UserSubscription | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletCurrency, setWalletCurrency] = useState<string>('PHP');

  const subCacheKey = authStorage.getScopedKey(user?.id, 'fittrack_user_subscription_cache');
  const walletCacheKey = authStorage.getScopedKey(user?.id, 'fittrack_user_wallet_cache');

  // 1. Instant local cache load (0ms - eliminates pop-in delay)
  useEffect(() => {
    let isMounted = true;
    async function loadCachedBilling() {
      try {
        const [cachedSub, cachedWallet] = await Promise.all([
          AsyncStorage.getItem(subCacheKey),
          AsyncStorage.getItem(walletCacheKey),
        ]);
        if (cachedSub && isMounted) {
          const parsedSub = JSON.parse(cachedSub);
          if (parsedSub) setCurrentSub(parsedSub);
        }
        if (cachedWallet && isMounted) {
          const parsedWallet = JSON.parse(cachedWallet);
          if (parsedWallet && typeof parsedWallet.balance === 'number') {
            setWalletBalance(parsedWallet.balance);
            if (parsedWallet.currency) {
              setWalletCurrency(parsedWallet.currency.toUpperCase());
            }
          }
        }
      } catch {}
    }
    loadCachedBilling();
    return () => {
      isMounted = false;
    };
  }, [subCacheKey, walletCacheKey]);

  // 2. Background fresh fetch from API server (Stale-While-Revalidate)
  const loadBillingSummary = useCallback(async () => {
    try {
      const [subRes, walletRes] = await Promise.all([
        getCurrentSubscriptionApi().catch(() => null),
        getUserWalletApi().catch(() => null),
      ]);
      if (subRes?.success && subRes.subscription) {
        setCurrentSub(subRes.subscription);
        AsyncStorage.setItem(subCacheKey, JSON.stringify(subRes.subscription)).catch(() => {});
      }
      if (walletRes?.success && walletRes.wallet) {
        setWalletBalance(walletRes.wallet.balance);
        if (walletRes.wallet.currency) {
          setWalletCurrency(walletRes.wallet.currency.toUpperCase());
        }
        AsyncStorage.setItem(walletCacheKey, JSON.stringify(walletRes.wallet)).catch(() => {});
      }
    } catch {
      // Non-critical background fetch
    }
  }, [subCacheKey, walletCacheKey]);

  useEffect(() => {
    loadBillingSummary();
  }, [loadBillingSummary]);

  // Notifications
  const [hasPermission, setHasPermission] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [requestingPerm, setRequestingPerm] = useState(false);
  const [timePickerConfig, setTimePickerConfig] = useState<{
    key: keyof NotificationSettings;
    title: string;
    initialTime: string;
  } | null>(null);

  // Load notification permissions & settings
  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      if (Platform.OS !== 'web') {
        const perm = await hasNotificationPermission();
        if (isMounted) setHasPermission(perm);
      }
      const saved = await getNotificationSettings(user?.id);
      if (isMounted) setNotifSettings(saved);
    }

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Toggle individual notification preference
  const handleToggleNotification = useCallback(
    async (key: keyof NotificationSettings, value: boolean) => {
      const updated = { ...notifSettings, [key]: value };
      setNotifSettings(updated);
      await saveNotificationSettings(updated, user?.id);
    },
    [notifSettings, user?.id]
  );

  const openTimePicker = (key: keyof NotificationSettings, title: string) => {
    setTimePickerConfig({
      key,
      title,
      initialTime: (notifSettings[key] as string) || '08:00',
    });
  };

  const handleSaveTime = async (newTime: string) => {
    if (!timePickerConfig) return;
    const key = timePickerConfig.key;
    const title = timePickerConfig.title;
    const updated = { ...notifSettings, [key]: newTime };
    setNotifSettings(updated);
    await saveNotificationSettings(updated, user?.id);
    setTimePickerConfig(null);
    showSuccess('Schedule Updated', `${title} set to ${formatTimeDisplay(newTime)}`);
  };

  const handleResetSchedule = async () => {
    try {
      const defaults = await resetNotificationSettings(user?.id);
      setNotifSettings(defaults);
      showSuccess('Schedules Reset', 'All notification schedules and options restored to defaults.');
    } catch {
      showError('Error', 'Failed to reset notification settings.');
    }
  };

  // Request native permission
  const handleEnablePermissions = async () => {
    if (Platform.OS === 'web') {
      showWarning('Web Notice', 'Push/Local notifications are best experienced on the Android app.');
      return;
    }

    setRequestingPerm(true);
    try {
      const granted = await requestNotificationPermission();
      setHasPermission(granted);
      if (granted) {
        showSuccess('Permissions Granted', 'FitTrack notifications are now enabled.');
        await saveNotificationSettings(notifSettings, user?.id);
      } else {
        showWarning(
          'Permissions Required',
          'Please enable notifications for FitTrack in your device settings.'
        );
      }
    } catch {
      showError('Error', 'Could not request notification permissions.');
    } finally {
      setRequestingPerm(false);
    }
  };



  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    setTimeout(async () => {
      try {
        await logout();
      } catch (err) {
        console.error('Logout error:', err);
        router.replace('/(auth)');
      }
    }, 120);
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteUserAccount();
      setShowDeleteModal(false);
      showSuccess('Account Deleted', 'Your account and fitness data have been permanently erased.');
      setTimeout(async () => {
        try {
          await logout();
        } catch {
          router.replace('/(auth)');
        }
      }, 150);
    } catch (err: any) {
      showError('Action Failed', getFriendlyErrorMessage(err, 'Could not delete your account. Please try again.'));
      setIsDeletingAccount(false);
    }
  };


  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 115 }}
      >
        <View className="w-full max-w-2xl self-center">
          {/* Back Button & Header */}
          <View className="flex-row items-center mb-1">
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(screen)/profile');
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-11 h-11 rounded-xl bg-input dark:bg-input-dark items-center justify-center mr-3 border border-input-border dark:border-input-border-dark"
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <Text className="text-3xl font-black text-text-primary dark:text-text-primary-dark tracking-tight">
              Settings
            </Text>
          </View>

        {/* Membership & Billing Section */}
        <SurfaceCard className="my-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
              Membership & Billing
            </Text>
            {currentSub?.tier && currentSub.tier !== 'FREE' ? (
              <View className="flex-row items-center bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                <Ionicons name="sparkles" size={11} color={colors.warning} />
                <Text className="text-[10px] font-black text-warning dark:text-warning-dark uppercase ml-1">
                  {currentSub.tier === 'LIFETIME_FOUNDER' ? 'Lifetime Founder' : currentSub.tier.replace('_', ' ')}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center bg-zinc-500/15 border border-zinc-500/30 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-semibold text-text-muted dark:text-text-muted-dark uppercase">
                  Free Plan
                </Text>
              </View>
            )}
          </View>

          {/* Subscription Tier Row */}
          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => setShowSubscriptionModal(true)}
          >
            <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
              <Ionicons name="diamond-outline" size={14} color={colors.textPrimary} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                  FitTrack Pro Subscription
                </Text>
                {currentSub?.tier && currentSub.tier !== 'FREE' ? (
                  <View className="bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                    <Text className="text-[9px] font-bold text-accent dark:text-accent-dark uppercase">Active</Text>
                  </View>
                ) : (
                  <View className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-1.5 py-0.5 rounded-md">
                    <Text className="text-[9px] font-bold text-accent dark:text-accent-dark uppercase">Upgrade</Text>
                  </View>
                )}
              </View>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                {currentSub?.tier && currentSub.tier !== 'FREE'
                  ? `Active plan • Auto-renew ${currentSub.cancelAtPeriodEnd ? 'canceling' : 'enabled'}`
                  : 'Unlock AI Food Scanner, Macro Coach & Pro Workouts'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          {/* e-Wallet Row */}
          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => setShowEWalletModal(true)}
          >
            <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
              <Ionicons name="wallet-outline" size={14} color={colors.textPrimary} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between pr-2">
                <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                  FitTrack e-Wallet
                </Text>
                <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                  {walletCurrency === 'USD' ? '$' : '₱'}{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {walletCurrency}
                </Text>
              </View>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                GCash, Maya, Card & instant in-app payments
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </SurfaceCard>

        {/* Admin Management Section (Visible for ADMIN role) */}
        {isAdmin && (
          <SurfaceCard className="mb-3 border-input-border dark:border-input-border-dark">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
                <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
                  Admin Control Center
                </Text>
              </View>
              <View className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-accent dark:text-accent-dark uppercase">
                  Executive Access
                </Text>
              </View>
            </View>

            {/* Primary Entry to Full Mobile Admin Screen */}
            <Pressable
              className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
              onPress={() => {
                hapticFeedback.light();
                router.push('/(screen)/admin');
              }}
            >
              <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
                <Ionicons name="apps-outline" size={14} color={colors.textPrimary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                  Open Admin Hub
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                  Live KPIs, user directory, exercise catalog & support desk
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </SurfaceCard>
        )}

        {/* 1. Account & Security Section */}
        <SurfaceCard className="mb-3">
          <Text className="mb-2 font-bold text-sm text-text-primary dark:text-text-primary-dark">
            Account & Security
          </Text>

          {/* Personal Information Row */}
          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => {
              hapticFeedback.light();
              setShowEditProfileModal(true);
            }}
          >
            <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
              <Ionicons name="person-outline" size={14} color={colors.textPrimary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Personal Information
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Update your name, age, height, weight & avatar
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => setShowResetPasswordModal(true)}
          >
            <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
              <Ionicons name="key-outline" size={14} color={colors.textPrimary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Reset Password
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Change your account password securely
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => {
              hapticFeedback.light();
              setShowDeleteModal(true);
            }}
          >
            <View className="w-8 h-8 rounded-full bg-danger/10 border border-danger/20 items-center justify-center mr-3">
              <Ionicons name="trash-outline" size={14} color={colors.danger} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-danger dark:text-danger-dark">
                Delete Account
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Permanently delete your account and all fitness records
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </SurfaceCard>


        {/* 2. Notifications Section */}
        <SurfaceCard className="mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1 pr-2">
              <View className="flex-row items-center gap-2 mb-0.5">
                <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
                  Notifications & Reminders
                </Text>
              </View>
              <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
                Customize your daily schedules, alert sounds & quiet hours
              </Text>
            </View>
            {Platform.OS !== 'web' && (
              <View
                className={`px-2.5 py-0.5 rounded-full border ${
                  hasPermission
                    ? 'bg-emerald-500/15 border-emerald-500/30'
                    : 'bg-warning/15 border-warning/30'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    hasPermission ? 'text-accent dark:text-accent-dark' : 'text-warning dark:text-warning-dark'
                  }`}
                >
                  {hasPermission ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            )}
          </View>

          {/* Permission Prompt Banner if Disabled */}
          {Platform.OS !== 'web' && !hasPermission ? (
            <View className="mb-3 p-3.5 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-2xl border border-emerald-500/25">
              <Text className="text-xs font-bold text-accent dark:text-accent-dark mb-1">
                Enable Device Notifications
              </Text>
              <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mb-2.5">
                Allow FitTrack to send timely meal, water, and workout nudges to keep your streak alive.
              </Text>
              <Pressable
                onPress={handleEnablePermissions}
                disabled={requestingPerm}
                className="bg-accent dark:bg-accent-dark py-2.5 px-3.5 rounded-xl self-start items-center justify-center flex-row"
              >
                {requestingPerm ? (
                  <ActivityIndicator size="small" color="#FFFFFF" className="mr-1.5" />
                ) : null}
                <Text className="text-xs font-bold text-white">
                  Allow Notifications
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Subheader: Daily Reminders */}
          <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mt-2.5 mb-1">
            Daily Reminders & Timings
          </Text>

          {/* Meal Reminders */}
          <View className="border-t border-input-border dark:border-input-border-dark py-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 pr-2">
                <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
                  <Ionicons name="restaurant-outline" size={14} color={colors.textPrimary} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                    Meal Reminders
                  </Text>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                    Gentle nudges to log your meals on schedule
                  </Text>
                </View>
              </View>
              <Switch
                value={notifSettings.mealReminders}
                onValueChange={(val) => handleToggleNotification('mealReminders', val)}
                thumbColor={colors.surface}
                trackColor={{ false: colors.inputBorder, true: colors.accent }}
              />
            </View>

            {/* Meal Time Pickers if enabled */}
            {notifSettings.mealReminders && (
              <View className="mt-3 pl-11 flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => openTimePicker('breakfastTime', 'Breakfast Reminder')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mr-1">Breakfast:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {formatTimeDisplay(notifSettings.breakfastTime)}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => openTimePicker('lunchTime', 'Lunch Reminder')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mr-1">Lunch:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {formatTimeDisplay(notifSettings.lunchTime)}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => openTimePicker('dinnerTime', 'Dinner Reminder')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mr-1">Dinner:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {formatTimeDisplay(notifSettings.dinnerTime)}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Hydration Reminders */}
          <View className="border-t border-input-border dark:border-input-border-dark py-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 pr-2">
                <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
                  <Ionicons name="water-outline" size={14} color={colors.textPrimary} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                    Hydration Nudges
                  </Text>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                    Hydration check-ins to hit your daily water goal
                  </Text>
                </View>
              </View>
              <Switch
                value={notifSettings.hydrationReminders}
                onValueChange={(val) => handleToggleNotification('hydrationReminders', val)}
                thumbColor={colors.surface}
                trackColor={{ false: colors.inputBorder, true: colors.accent }}
              />
            </View>

            {/* Hydration Time Pickers if enabled */}
            {notifSettings.hydrationReminders && (
              <View className="mt-3 pl-11 flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => openTimePicker('hydrationTime1', 'Morning Hydration')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mr-1">Alert 1:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {formatTimeDisplay(notifSettings.hydrationTime1)}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => openTimePicker('hydrationTime2', 'Afternoon Hydration')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mr-1">Alert 2:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {formatTimeDisplay(notifSettings.hydrationTime2)}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Workout Reminders */}
          <View className="border-t border-input-border dark:border-input-border-dark py-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 pr-2">
                <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
                  <Ionicons name="barbell-outline" size={14} color={colors.textPrimary} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                    Workout Reminders
                  </Text>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                    Scheduled reminder for your daily workout session
                  </Text>
                </View>
              </View>
              <Switch
                value={notifSettings.workoutReminders}
                onValueChange={(val) => handleToggleNotification('workoutReminders', val)}
                thumbColor={colors.surface}
                trackColor={{ false: colors.inputBorder, true: colors.accent }}
              />
            </View>

            {/* Workout Time Picker if enabled */}
            {notifSettings.workoutReminders && (
              <View className="mt-3 pl-11 flex-row">
                <Pressable
                  onPress={() => openTimePicker('workoutTime', 'Workout Reminder')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mr-1">Training Time:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {formatTimeDisplay(notifSettings.workoutTime)}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Daily Readiness Check-In */}
          <View className="border-t border-input-border dark:border-input-border-dark py-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 pr-2">
                <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
                  <Ionicons name="pulse-outline" size={14} color={colors.textPrimary} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                    Daily Readiness Check-In
                  </Text>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                    Morning energy calibration & mood check
                  </Text>
                </View>
              </View>
              <Switch
                value={notifSettings.checkinReminders}
                onValueChange={(val) => handleToggleNotification('checkinReminders', val)}
                thumbColor={colors.surface}
                trackColor={{ false: colors.inputBorder, true: colors.accent }}
              />
            </View>

            {/* Check-In Time Picker if enabled */}
            {notifSettings.checkinReminders && (
              <View className="mt-3 pl-11 flex-row">
                <Pressable
                  onPress={() => openTimePicker('checkinTime', 'Daily Readiness Check-In')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mr-1">Check-In Time:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {formatTimeDisplay(notifSettings.checkinTime)}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Subheader: Sound & Haptics */}
          <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mt-4 mb-1">
            Sound & Haptics
          </Text>

          {/* Sound Toggle */}
          <View className="flex-row items-center justify-between border-t border-input-border dark:border-input-border-dark py-3">
            <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
              <Ionicons name="volume-high-outline" size={14} color={colors.textPrimary} />
            </View>
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Notification Sounds
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Play alert chime when notification fires
              </Text>
            </View>
            <Switch
              value={notifSettings.soundEnabled}
              onValueChange={(val) => handleToggleNotification('soundEnabled', val)}
              thumbColor={colors.surface}
              trackColor={{ false: colors.inputBorder, true: colors.accent }}
            />
          </View>

          {/* Vibration Toggle */}
          <View className="flex-row items-center justify-between border-t border-input-border dark:border-input-border-dark py-3">
            <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
              <Ionicons name="phone-portrait-outline" size={14} color={colors.textPrimary} />
            </View>
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Vibration / Haptic Feedback
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Vibrate device on incoming reminders
              </Text>
            </View>
            <Switch
              value={notifSettings.vibrationEnabled}
              onValueChange={(val) => handleToggleNotification('vibrationEnabled', val)}
              thumbColor={colors.surface}
              trackColor={{ false: colors.inputBorder, true: colors.accent }}
            />
          </View>

          {/* Subheader: Quiet Hours */}
          <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mt-4 mb-1">
            Quiet Hours (Do Not Disturb)
          </Text>

          {/* Quiet Hours Switch */}
          <View className="border-t border-input-border dark:border-input-border-dark py-3">
            <View className="flex-row items-center justify-between">
              <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
                <Ionicons name="bed-outline" size={14} color={colors.textPrimary} />
              </View>
              <View className="flex-1 pr-3">
                <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                  Mute During Sleep / Rest
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                  Suppress reminders during your sleep window
                </Text>
              </View>
              <Switch
                value={notifSettings.quietHoursEnabled}
                onValueChange={(val) => handleToggleNotification('quietHoursEnabled', val)}
                thumbColor={colors.surface}
                trackColor={{ false: colors.inputBorder, true: colors.accent }}
              />
            </View>

            {/* Quiet Hours Window Pickers */}
            {notifSettings.quietHoursEnabled && (
              <View className="mt-3 pl-11 flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => openTimePicker('quietHoursStart', 'Quiet Hours Start (Sleep)')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mr-1">Starts at:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {formatTimeDisplay(notifSettings.quietHoursStart)}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => openTimePicker('quietHoursEnd', 'Quiet Hours End (Wake Up)')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mr-1">Ends at:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {formatTimeDisplay(notifSettings.quietHoursEnd)}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Action Row: Reset Defaults */}
          <View className="border-t border-input-border dark:border-input-border-dark pt-3 flex-col gap-2">
            <Pressable
              onPress={handleResetSchedule}
              className="py-2.5 px-3 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark flex-row items-center justify-center active:opacity-80"
            >
              <Ionicons name="refresh-outline" size={15} color={colors.textMuted} className="mr-1.5" />
              <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
                Reset Timings to Recommended Defaults
              </Text>
            </Pressable>
          </View>
        </SurfaceCard>

        {/* 3. Preferences Section */}
        <SurfaceCard className="mb-3">
          <Text className="mb-2 font-bold text-sm text-text-primary dark:text-text-primary-dark">
            Preferences
          </Text>

          <View className="flex-row items-center justify-between border-t border-input-border dark:border-input-border-dark py-3">
            <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
              <Ionicons name="moon-outline" size={14} color={colors.textPrimary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Dark Mode
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
              </Text>
            </View>

            <Switch
              value={isDark}
              onValueChange={handleToggleTheme}
              thumbColor={colors.surface}
              trackColor={{
                false: colors.inputBorder,
                true: colors.accent,
              }}
            />
          </View>

          {/* Weight Units Preference */}
          <View className="flex-row items-center justify-between border-t border-input-border dark:border-input-border-dark py-3">
            <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
              <Ionicons name="scale-outline" size={14} color={colors.textPrimary} />
            </View>
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Weight Unit
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Display weights in {weightUnit === 'KG' ? 'Kilograms (kg)' : 'Pounds (lbs)'}
              </Text>
            </View>

            <View className="flex-row items-center bg-input dark:bg-input-dark p-1 rounded-xl border border-input-border dark:border-input-border-dark">
              <Pressable
                onPress={() => {
                  hapticFeedback.light();
                  setWeightUnit('KG');
                }}
                className={`px-3 py-1.5 rounded-lg ${
                  weightUnit === 'KG'
                    ? 'bg-accent dark:bg-accent-dark'
                    : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    weightUnit === 'KG'
                      ? 'text-white'
                      : 'text-text-muted dark:text-text-muted-dark'
                  }`}
                >
                  KG
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  hapticFeedback.light();
                  setWeightUnit('LBS');
                }}
                className={`px-3 py-1.5 rounded-lg ${
                  weightUnit === 'LBS'
                    ? 'bg-accent dark:bg-accent-dark'
                    : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    weightUnit === 'LBS'
                      ? 'text-white'
                      : 'text-text-muted dark:text-text-muted-dark'
                  }`}
                >
                  LBS
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Height Units Preference */}
          <View className="flex-row items-center justify-between border-t border-input-border dark:border-input-border-dark py-3">
            <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
              <Ionicons name="resize-outline" size={14} color={colors.textPrimary} />
            </View>
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Height Unit
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Display height in {heightUnit === 'CM' ? 'Centimeters (cm)' : 'Feet & Inches (ft/in)'}
              </Text>
            </View>

            <View className="flex-row items-center bg-input dark:bg-input-dark p-1 rounded-xl border border-input-border dark:border-input-border-dark">
              <Pressable
                onPress={() => {
                  hapticFeedback.light();
                  setHeightUnit('CM');
                }}
                className={`px-3 py-1.5 rounded-lg ${
                  heightUnit === 'CM'
                    ? 'bg-accent dark:bg-accent-dark'
                    : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    heightUnit === 'CM'
                      ? 'text-white'
                      : 'text-text-muted dark:text-text-muted-dark'
                  }`}
                >
                  CM
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  hapticFeedback.light();
                  setHeightUnit('FT_IN');
                }}
                className={`px-3 py-1.5 rounded-lg ${
                  heightUnit === 'FT_IN'
                    ? 'bg-accent dark:bg-accent-dark'
                    : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    heightUnit === 'FT_IN'
                      ? 'text-white'
                      : 'text-text-muted dark:text-text-muted-dark'
                  }`}
                >
                  FT / IN
                </Text>
              </Pressable>
            </View>
          </View>
        </SurfaceCard>

        {/* 4. Support & Help Center Section */}
        <SurfaceCard className="mb-3">
          <Text className="mb-2 font-bold text-sm text-text-primary dark:text-text-primary-dark">
            Support & Help
          </Text>

          {/* Help Center & FAQs */}
          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => {
              setHelpInitialTab('faq');
              setShowHelpModal(true);
            }}
          >
            <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
              <Ionicons name="help-circle-outline" size={15} color={colors.textPrimary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Help Center & FAQs
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Answers to common nutrition, workout, and app questions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          {/* Quick Start Guide */}
          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={async () => {
              hapticFeedback.light();
              if (user?.id) {
                await AsyncStorage.removeItem(authStorage.getScopedKey(user.id, 'quick_start_guide_dismissed'));
              }
              DeviceEventEmitter.emit('RESET_QUICK_START_GUIDE');
              showSuccess('Guide Activated', 'Quick Start Guide is now active on your Dashboard.');
              router.replace('/(screen)/dashboard');
            }}
          >
            <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
              <Ionicons name="rocket-outline" size={15} color={colors.accent} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                First-Day Quick Start Guide
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Re-open the 3-step beginner guide on your Dashboard
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          {/* Contact Support & Feedback */}
          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => {
              setHelpInitialTab('contact');
              setShowHelpModal(true);
            }}
          >
            <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
              <Ionicons name="chatbubbles-outline" size={14} color={colors.textPrimary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Contact Support & Feedback
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Reach our team, report an issue, or suggest features
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          {/* Privacy Policy */}
          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => setShowPrivacyModal(true)}
          >
            <View className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mr-3">
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.textPrimary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Privacy Policy
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Read our data & encryption practices
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </SurfaceCard>

        {/* 5. Log Out Section */}
        <View className="mt-2">
          <Pressable
            className="flex-row items-center justify-center rounded-2xl bg-danger/10 border border-danger/25 min-h-[48px] py-3.5 active:opacity-80"
            onPress={() => setShowLogoutModal(true)}
          >
            <Text className="text-sm font-bold text-danger dark:text-danger-dark">
              Log Out
            </Text>
          </Pressable>
        </View>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <ConfirmModal
          visible={showLogoutModal}
          title="Log Out"
          message="Are you sure you want to log out of your account?"
          iconName="log-out-outline"
          confirmText="Log Out"
          cancelText="Cancel"
          isDanger
          onConfirm={handleConfirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmModal
          visible={showDeleteModal}
          title="Delete Account"
          message="Are you sure you want to permanently delete your account? All your workout history, food logs, subscriptions, and profile data will be permanently wiped. This action cannot be undone."
          iconName="trash-outline"
          confirmText={isDeletingAccount ? "Deleting..." : "Permanently Delete"}
          cancelText="Cancel"
          isDanger
          onConfirm={handleConfirmDeleteAccount}
          onCancel={() => {
            if (!isDeletingAccount) setShowDeleteModal(false);
          }}
        />
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <ResetPasswordModal
          visible={showResetPasswordModal}
          onClose={() => setShowResetPasswordModal(false)}
        />
      )}

      {/* Help & Support Modal */}
      {showHelpModal && (
        <HelpSupportModal
          visible={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          initialTab={helpInitialTab}
        />
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <PrivacyPolicyModal
          visible={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
        />
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionModal
          visible={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          onSubscriptionUpdated={() => loadBillingSummary()}
        />
      )}

      {/* e-Wallet Modal */}
      {showEWalletModal && (
        <EWalletModal
          visible={showEWalletModal}
          onClose={() => setShowEWalletModal(false)}
          onBalanceUpdated={(newBal) => setWalletBalance(newBal)}
        />
      )}

      {/* Edit Personal Information & Avatar Modal */}
      {showEditProfileModal && (
        <EditProfileModal
          visible={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          onProfileUpdated={() => {
            refreshProfile().catch(() => {});
          }}
        />
      )}

      {/* Customizable Time Picker Modal */}
      {timePickerConfig && (
        <TimePickerModal
          visible={true}
          onClose={() => setTimePickerConfig(null)}
          title={timePickerConfig.title}
          initialTime={timePickerConfig.initialTime}
          onSaveTime={handleSaveTime}
        />
      )}
    </SafeAreaView>
  );
}