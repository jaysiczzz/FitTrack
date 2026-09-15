import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import ConfirmModal from '@/components/ui/ConfirmModal';
import SurfaceCard from '@/components/ui/SurfaceCard';
import { useAuth } from '@/context/AuthContext';
import { COLORS, useThemeColors } from '@/constants/colors';

export default function Settings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { colors, isDark } = useThemeColors();
  const { logout } = useAuth();

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
          Manage your account and preferences
        </Text>

        {/* Account & Security Section */}
        <SurfaceCard className="mb-3">
          <Text className="mb-2 font-bold text-sm text-text-primary dark:text-text-primary-dark">
            Account & Security
          </Text>

          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => {}}
          >
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Reset Password
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                Change your account password
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          <View className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                Two-Factor Auth
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                Extra layer of authentication
              </Text>
            </View>

            <Switch
              value={twoFactorEnabled}
              onValueChange={setTwoFactorEnabled}
              thumbColor={colors.surface}
              trackColor={{
                false: colors.inputBorder,
                true: colors.accent,
              }}
            />
          </View>
        </SurfaceCard>

        {/* Preferences Section */}
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

        {/* Support Section */}
        <SurfaceCard className="mb-3">
          <Text className="mb-2 font-bold text-sm text-text-primary dark:text-text-primary-dark">
            Support
          </Text>

          {[
            { title: 'Contact Support', subtitle: 'Get help from our team' },
            { title: 'Rate FitTrack', subtitle: 'Share your feedback' },
            { title: 'Privacy Policy', subtitle: 'Read our data practices' },
          ].map((item) => (
            <Pressable
              key={item.title}
              className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            >
              <View className="flex-1">
                <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                  {item.title}
                </Text>
                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  {item.subtitle}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </SurfaceCard>

        {/* Log Out Section */}
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
    </SafeAreaView>
  );
}