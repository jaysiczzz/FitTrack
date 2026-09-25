import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import ConfirmModal from '@/components/ui/ConfirmModal';
import SurfaceCard from '@/components/ui/SurfaceCard';
import ResetPasswordModal from '@/components/settings/ResetPasswordModal';
import HelpSupportModal from '@/components/settings/HelpSupportModal';
import PrivacyPolicyModal from '@/components/settings/PrivacyPolicyModal';
import TestimonialModal from '@/components/settings/TestimonialModal';
import SubscriptionModal from '@/components/subscription/SubscriptionModal';
import EWalletModal from '@/components/subscription/EWalletModal';
import AdminRevenueModal from '@/components/subscription/AdminRevenueModal';
import {
  getCurrentSubscriptionApi,
  getUserWalletApi,
  UserSubscription,
} from '@/api/subscription';
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

export default function Settings() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { colors } = useThemeColors();
  const { user, logout } = useAuth();
  const { showSuccess, showWarning, showError } = useToast();

  // Modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpInitialTab, setHelpInitialTab] = useState<'faq' | 'contact'>('faq');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showEWalletModal, setShowEWalletModal] = useState(false);
  const [showAdminRevenueModal, setShowAdminRevenueModal] = useState(false);

  // Subscription & Wallet State
  const [currentSub, setCurrentSub] = useState<UserSubscription | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletCurrency, setWalletCurrency] = useState<string>('PHP');

  const loadBillingSummary = useCallback(async () => {
    try {
      const [subRes, walletRes] = await Promise.all([
        getCurrentSubscriptionApi().catch(() => null),
        getUserWalletApi().catch(() => null),
      ]);
      if (subRes?.success && subRes.subscription) {
        setCurrentSub(subRes.subscription);
      }
      if (walletRes?.success && walletRes.wallet) {
        setWalletBalance(walletRes.wallet.balance);
        if (walletRes.wallet.currency) {
          setWalletCurrency(walletRes.wallet.currency.toUpperCase());
        }
      }
    } catch {
      // Non-critical background fetch
    }
  }, []);

  useEffect(() => {
    loadBillingSummary();
  }, [loadBillingSummary]);

  // Notifications
  const [hasPermission, setHasPermission] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [testingNotification, setTestingNotification] = useState(false);
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
      showWarning('Web Notice', 'Push/Local notifications are best experienced on the iOS/Android app.');
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

  // Test notification button
  const handleTestNotification = async () => {
    if (Platform.OS === 'web') {
      showWarning('Web Notice', 'Local notifications are supported natively on iOS and Android.');
      return;
    }

    setTestingNotification(true);
    try {
      const sent = await sendTestNotification();
      if (sent) {
        showSuccess('Test Notification Sent', 'Check your device notification tray!');
      } else {
        showWarning('Permissions Needed', 'Enable notification permissions above first.');
      }
    } catch {
      showError('Test Failed', 'Could not dispatch test notification.');
    } finally {
      setTestingNotification(false);
    }
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
      router.replace('/(auth)');
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 115 }}>
        {/* Back Button & Header */}
        <View className="flex-row items-center mb-1">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-input dark:bg-input-dark items-center justify-center mr-3 border border-input-border dark:border-input-border-dark"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text className="text-3xl font-black text-text-primary dark:text-text-primary-dark tracking-tight">
            Settings
          </Text>
        </View>

        <Text className="mb-4 text-xs font-normal text-text-muted dark:text-text-muted-dark mt-1">
          Manage your account, preferences, and daily reminders
        </Text>

        {/* Membership & Billing Section */}
        <SurfaceCard className="mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
              Membership & Billing
            </Text>
            {currentSub?.tier && currentSub.tier !== 'FREE' ? (
              <View className="flex-row items-center bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                <Ionicons name="sparkles" size={11} color="#F59E0B" />
                <Text className="text-[10px] font-black text-amber-500 uppercase ml-1">
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
            <View className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 items-center justify-center mr-3">
              <Ionicons name="diamond" size={14} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                  FitTrack Pro Subscription
                </Text>
                {currentSub?.tier && currentSub.tier !== 'FREE' ? (
                  <View className="bg-emerald-500/20 px-1.5 py-0.5 rounded-md">
                    <Text className="text-[9px] font-bold text-emerald-500 uppercase">Active</Text>
                  </View>
                ) : (
                  <View className="bg-accent/20 px-1.5 py-0.5 rounded-md">
                    <Text className="text-[9px] font-bold text-accent uppercase">Upgrade</Text>
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
            <View className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mr-3">
              <Ionicons name="wallet" size={14} color="#10B981" />
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
        {user?.role === 'ADMIN' && (
          <SurfaceCard className="mb-3 border-amber-500/30 dark:border-amber-500/30">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
                Admin Management
              </Text>
              <View className="bg-amber-500/20 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-amber-500 uppercase">
                  Executive Access
                </Text>
              </View>
            </View>

            <Pressable
              className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
              onPress={() => setShowAdminRevenueModal(true)}
            >
              <View className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 items-center justify-center mr-3">
                <Ionicons name="trending-up" size={14} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                  Revenue & e-Wallet Dashboard
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                  MRR metrics, Stripe fees, platform payouts & subscribers
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

          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => setShowResetPasswordModal(true)}
          >
            <View className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mr-3">
              <Ionicons name="key" size={14} color="#10B981" />
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
        </SurfaceCard>

        {/* 2. Notifications Section */}
        <SurfaceCard className="mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1 pr-2">
              <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
                Notifications & Reminders
              </Text>
              <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mt-0.5">
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
          <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mt-2 mb-1">
            Daily Reminders & Timings
          </Text>

          {/* Meal Reminders */}
          <View className="border-t border-input-border dark:border-input-border-dark py-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 pr-2">
                <View className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30 items-center justify-center mr-3">
                  <Ionicons name="sunny" size={14} color="#FB923C" />
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
                trackColor={{ false: colors.inputBorder, true: '#10B981' }}
              />
            </View>

            {/* Meal Time Pickers if enabled */}
            {notifSettings.mealReminders && (
              <View className="mt-3 pl-11 flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => openTimePicker('breakfastTime', 'Breakfast Reminder')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Ionicons name="time-outline" size={12} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mr-1">Breakfast:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {formatTimeDisplay(notifSettings.breakfastTime)}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => openTimePicker('lunchTime', 'Lunch Reminder')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Ionicons name="time-outline" size={12} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mr-1">Lunch:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {formatTimeDisplay(notifSettings.lunchTime)}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => openTimePicker('dinnerTime', 'Dinner Reminder')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Ionicons name="time-outline" size={12} color={colors.accent} style={{ marginRight: 6 }} />
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
                <View className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/30 items-center justify-center mr-3">
                  <Ionicons name="water" size={14} color="#38BDF8" />
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
                trackColor={{ false: colors.inputBorder, true: '#10B981' }}
              />
            </View>

            {/* Hydration Time Pickers if enabled */}
            {notifSettings.hydrationReminders && (
              <View className="mt-3 pl-11 flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => openTimePicker('hydrationTime1', 'Morning Hydration')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Ionicons name="time-outline" size={12} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mr-1">Alert 1:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {formatTimeDisplay(notifSettings.hydrationTime1)}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => openTimePicker('hydrationTime2', 'Afternoon Hydration')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Ionicons name="time-outline" size={12} color={colors.accent} style={{ marginRight: 6 }} />
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
                <View className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/30 items-center justify-center mr-3">
                  <Ionicons name="barbell" size={14} color="#A855F7" />
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
                trackColor={{ false: colors.inputBorder, true: '#10B981' }}
              />
            </View>

            {/* Workout Time Picker if enabled */}
            {notifSettings.workoutReminders && (
              <View className="mt-3 pl-11 flex-row">
                <Pressable
                  onPress={() => openTimePicker('workoutTime', 'Workout Reminder')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Ionicons name="time-outline" size={12} color={colors.accent} style={{ marginRight: 6 }} />
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
                <View className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mr-3">
                  <Ionicons name="pulse" size={14} color="#10B981" />
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
                trackColor={{ false: colors.inputBorder, true: '#10B981' }}
              />
            </View>

            {/* Check-In Time Picker if enabled */}
            {notifSettings.checkinReminders && (
              <View className="mt-3 pl-11 flex-row">
                <Pressable
                  onPress={() => openTimePicker('checkinTime', 'Daily Readiness Check-In')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Ionicons name="time-outline" size={12} color={colors.accent} style={{ marginRight: 6 }} />
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
            <View className="w-8 h-8 rounded-full bg-teal-500/15 border border-teal-500/30 items-center justify-center mr-3">
              <Ionicons name="volume-high" size={14} color="#14B8A6" />
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
              trackColor={{ false: colors.inputBorder, true: '#10B981' }}
            />
          </View>

          {/* Vibration Toggle */}
          <View className="flex-row items-center justify-between border-t border-input-border dark:border-input-border-dark py-3">
            <View className="w-8 h-8 rounded-full bg-pink-500/15 border border-pink-500/30 items-center justify-center mr-3">
              <Ionicons name="phone-portrait-outline" size={14} color="#EC4899" />
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
              trackColor={{ false: colors.inputBorder, true: '#10B981' }}
            />
          </View>

          {/* Subheader: Quiet Hours */}
          <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mt-4 mb-1">
            Quiet Hours (Do Not Disturb)
          </Text>

          {/* Quiet Hours Switch */}
          <View className="border-t border-input-border dark:border-input-border-dark py-3">
            <View className="flex-row items-center justify-between">
              <View className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 items-center justify-center mr-3">
                <Ionicons name="bed" size={14} color="#818CF8" />
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
                trackColor={{ false: colors.inputBorder, true: '#10B981' }}
              />
            </View>

            {/* Quiet Hours Window Pickers */}
            {notifSettings.quietHoursEnabled && (
              <View className="mt-3 pl-11 flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => openTimePicker('quietHoursStart', 'Quiet Hours Start (Sleep)')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Ionicons name="moon-outline" size={12} color="#818CF8" style={{ marginRight: 6 }} />
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mr-1">Starts at:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {formatTimeDisplay(notifSettings.quietHoursStart)}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => openTimePicker('quietHoursEnd', 'Quiet Hours End (Wake Up)')}
                  className="flex-row items-center px-3 py-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-70"
                >
                  <Ionicons name="sunny-outline" size={12} color="#FB923C" style={{ marginRight: 6 }} />
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mr-1">Ends at:</Text>
                  <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                    {formatTimeDisplay(notifSettings.quietHoursEnd)}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Action Row: Test notification & Reset Defaults */}
          <View className="border-t border-input-border dark:border-input-border-dark pt-3 flex-col gap-2">
            {Platform.OS !== 'web' ? (
              <Pressable
                onPress={handleTestNotification}
                disabled={testingNotification}
                className="py-2.5 px-3 rounded-xl bg-accent/10 dark:bg-accent-dark/15 border border-accent/30 dark:border-accent-dark/30 flex-row items-center justify-center active:opacity-80"
              >
                {testingNotification ? (
                  <ActivityIndicator size="small" color="#10B981" className="mr-2" />
                ) : (
                  <Ionicons name="notifications-outline" size={16} color="#10B981" className="mr-2" />
                )}
                <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                  Send Test Notification Now
                </Text>
              </Pressable>
            ) : null}

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

          <View className="flex-row items-center justify-between border-t border-input-border dark:border-input-border-dark pt-3">
            <View className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 items-center justify-center mr-3">
              <Ionicons name="moon" size={14} color="#818CF8" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Dark Mode
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                {colorScheme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled'}
              </Text>
            </View>

            <Switch
              value={colorScheme === 'dark'}
              onValueChange={(isDark) => setColorScheme(isDark ? 'dark' : 'light')}
              thumbColor={colors.surface}
              trackColor={{
                false: colors.inputBorder,
                true: '#10B981',
              }}
            />
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
            <View className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/30 items-center justify-center mr-3">
              <Ionicons name="help-circle" size={15} color="#38BDF8" />
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

          {/* Contact Support */}
          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => {
              setHelpInitialTab('contact');
              setShowHelpModal(true);
            }}
          >
            <View className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/30 items-center justify-center mr-3">
              <Ionicons name="mail" size={14} color="#A855F7" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Contact Support
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Reach our team or report an issue
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          {/* Athlete Stories & Testimonials */}
          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => setShowTestimonialModal(true)}
          >
            <View className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 items-center justify-center mr-3">
              <Ionicons name="sparkles" size={14} color={colors.accent} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center space-x-1.5">
                <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                  Athlete Stories & Reviews
                </Text>
                <View className="flex-row items-center bg-amber-500/15 px-1.5 py-0.5 rounded-full">
                  <Ionicons name="star" size={10} color="#F59E0B" />
                  <Text className="text-[10px] font-bold text-amber-500 ml-0.5">Community</Text>
                </View>
              </View>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Read transformations or share your journey
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          {/* Rate / Feedback */}
          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => {
              setHelpInitialTab('contact');
              setShowHelpModal(true);
            }}
          >
            <View className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 items-center justify-center mr-3">
              <Ionicons name="chatbubble-ellipses" size={14} color="#FBBF24" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Share Suggestions & Feedback
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Help us improve future FitTrack releases
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          {/* Privacy Policy */}
          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => setShowPrivacyModal(true)}
          >
            <View className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mr-3">
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
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
            className="flex-row items-center justify-center rounded-2xl bg-danger/10 border border-danger/25 py-3.5 active:opacity-80"
            onPress={() => setShowLogoutModal(true)}
          >
            <Text className="text-sm font-bold text-danger dark:text-danger-dark">
              Log Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
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

      {/* Reset Password Modal */}
      <ResetPasswordModal
        visible={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
      />

      {/* Help & Support Modal */}
      <HelpSupportModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        initialTab={helpInitialTab}
      />

      {/* Athlete Testimonials Modal */}
      <TestimonialModal
        visible={showTestimonialModal}
        onClose={() => setShowTestimonialModal(false)}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscriptionUpdated={() => loadBillingSummary()}
      />

      {/* e-Wallet Modal */}
      <EWalletModal
        visible={showEWalletModal}
        onClose={() => setShowEWalletModal(false)}
        onBalanceUpdated={(newBal) => setWalletBalance(newBal)}
      />

      {/* Admin Revenue Dashboard Modal */}
      <AdminRevenueModal
        visible={showAdminRevenueModal}
        onClose={() => {
          setShowAdminRevenueModal(false);
          loadBillingSummary();
        }}
      />

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