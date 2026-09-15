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
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useThemeColors } from '@/constants/colors';
import {
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  hasNotificationPermission,
  sendTestNotification,
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

  // Notifications
  const [hasPermission, setHasPermission] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [testingNotification, setTestingNotification] = useState(false);
  const [requestingPerm, setRequestingPerm] = useState(false);

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
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 92 }}>
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
          <Text className="text-2xl font-black text-text-primary dark:text-text-primary-dark">
            Settings
          </Text>
        </View>

        <Text className="mb-4 text-xs font-normal text-text-muted dark:text-text-muted-dark">
          Manage your account, preferences, and daily reminders
        </Text>

        {/* 1. Account & Security Section */}
        <SurfaceCard className="mb-3">
          <Text className="mb-2 font-bold text-sm text-text-primary dark:text-text-primary-dark">
            Account & Security
          </Text>

          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => setShowResetPasswordModal(true)}
          >
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Reset Password
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                Change your account password securely
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </SurfaceCard>

        {/* 2. Notifications Section */}
        <SurfaceCard className="mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-bold text-sm text-text-primary dark:text-text-primary-dark">
              Notifications & Reminders
            </Text>
            {Platform.OS !== 'web' && (
              <View className="flex-row items-center">
                <View
                  className={`w-2 h-2 rounded-full mr-1.5 ${
                    hasPermission ? 'bg-accent dark:bg-accent-dark' : 'bg-warning dark:bg-warning-dark'
                  }`}
                />
                <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark">
                  {hasPermission ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            )}
          </View>

          {/* Permission Prompt Banner if Disabled */}
          {Platform.OS !== 'web' && !hasPermission ? (
            <View className="mb-3 p-3 bg-accent/10 dark:bg-accent-dark/10 rounded-xl border border-accent/25 dark:border-accent-dark/25">
              <Text className="text-xs font-bold text-accent dark:text-accent-dark mb-1">
                Enable Device Notifications
              </Text>
              <Text className="text-[11px] text-text-muted dark:text-text-muted-dark mb-2">
                Allow FitTrack to send timely meal, water, and workout nudges to keep your streak alive.
              </Text>
              <Pressable
                onPress={handleEnablePermissions}
                disabled={requestingPerm}
                className="bg-accent dark:bg-accent-dark py-2 px-3 rounded-lg self-start items-center justify-center flex-row"
              >
                {requestingPerm ? (
                  <ActivityIndicator size="small" color="#FFFFFF" className="mr-1.5" />
                ) : null}
                <Text className="text-xs font-bold text-background dark:text-background-dark">
                  Allow Notifications
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Meal Reminders Toggle */}
          <View className="flex-row items-center justify-between border-t border-input-border dark:border-input-border-dark py-3">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Meal Reminders
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                Breakfast (8:30 AM), Lunch (12:30 PM), Dinner (7:00 PM)
              </Text>
            </View>
            <Switch
              value={notifSettings.mealReminders}
              onValueChange={(val) => handleToggleNotification('mealReminders', val)}
              thumbColor={colors.surface}
              trackColor={{ false: colors.inputBorder, true: colors.accent }}
            />
          </View>

          {/* Hydration Reminders Toggle */}
          <View className="flex-row items-center justify-between border-t border-input-border dark:border-input-border-dark py-3">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Hydration Nudges
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                Midday alerts to hit your 2,000 ml water goal
              </Text>
            </View>
            <Switch
              value={notifSettings.hydrationReminders}
              onValueChange={(val) => handleToggleNotification('hydrationReminders', val)}
              thumbColor={colors.surface}
              trackColor={{ false: colors.inputBorder, true: colors.accent }}
            />
          </View>

          {/* Workout Reminders Toggle */}
          <View className="flex-row items-center justify-between border-t border-input-border dark:border-input-border-dark py-3">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Workout Reminders
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                Evening training reminder (5:30 PM)
              </Text>
            </View>
            <Switch
              value={notifSettings.workoutReminders}
              onValueChange={(val) => handleToggleNotification('workoutReminders', val)}
              thumbColor={colors.surface}
              trackColor={{ false: colors.inputBorder, true: colors.accent }}
            />
          </View>

          {/* Readiness Check-In Toggle */}
          <View className="flex-row items-center justify-between border-t border-input-border dark:border-input-border-dark py-3">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Daily Readiness Check-In
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                Morning energy check alert (9:00 AM)
              </Text>
            </View>
            <Switch
              value={notifSettings.checkinReminders}
              onValueChange={(val) => handleToggleNotification('checkinReminders', val)}
              thumbColor={colors.surface}
              trackColor={{ false: colors.inputBorder, true: colors.accent }}
            />
          </View>

          {/* Test Notification Button */}
          {Platform.OS !== 'web' ? (
            <View className="border-t border-input-border dark:border-input-border-dark pt-3">
              <Pressable
                onPress={handleTestNotification}
                disabled={testingNotification}
                className="py-2.5 px-3 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark flex-row items-center justify-center active:opacity-80"
              >
                {testingNotification ? (
                  <ActivityIndicator size="small" color={colors.accent} className="mr-2" />
                ) : (
                  <Ionicons name="notifications-outline" size={16} color={colors.accent} className="mr-2" />
                )}
                <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                  Send Test Notification Now
                </Text>
              </Pressable>
            </View>
          ) : null}
        </SurfaceCard>

        {/* 3. Preferences Section */}
        <SurfaceCard className="mb-3">
          <Text className="mb-2 font-bold text-sm text-text-primary dark:text-text-primary-dark">
            Preferences
          </Text>

          <View className="flex-row items-center justify-between border-t border-input-border dark:border-input-border-dark pt-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Dark Mode
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                {colorScheme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled'}
              </Text>
            </View>

            <Switch
              value={colorScheme === 'dark'}
              onValueChange={(isDark) => setColorScheme(isDark ? 'dark' : 'light')}
              thumbColor={colors.surface}
              trackColor={{
                false: colors.inputBorder,
                true: colors.accent,
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
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Help Center & FAQs
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
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
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Contact Support
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                Reach our team or report an issue
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
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Share Suggestions & Feedback
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
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
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Privacy Policy
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                Read our data & encryption practices
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </SurfaceCard>

        {/* 5. Log Out Section */}
        <View className="mt-2">
          <Pressable
            className="flex-row items-center justify-center rounded-xl bg-input dark:bg-input-dark border border-danger/30 dark:border-danger-dark/30 py-3.5 active:opacity-80"
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

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </SafeAreaView>
  );
}