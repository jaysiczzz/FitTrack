import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function Settings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      router.replace('/(auth)');
    } catch (err) {
      console.error('Logout error:', err);
      router.replace('/(auth)');
    }
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        <Text className="mb-1 text-[28px] font-extrabold text-text-primary dark:text-text-primary-dark">
          Settings
        </Text>

        <Text className="mb-5 text-sm text-text-muted dark:text-text-muted-dark">
          Manage your account preferences
        </Text>

        {/* Account & Security Section */}
        <View className="rounded-xl border border-input-border bg-surface p-3 dark:border-input-border-dark dark:bg-surface-dark">
          <Text className="mb-2 font-bold text-text-primary dark:text-text-primary-dark">
            Account & Security
          </Text>

          <Pressable
            className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            onPress={() => {}}
          >
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-lg bg-input dark:bg-input-dark">
              <Text className="text-lg">🔒</Text>
            </View>

            <View className="flex-1">
              <Text className="text-base font-bold text-text-primary dark:text-text-primary-dark">
                Reset Password
              </Text>

              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                Change your account password
              </Text>
            </View>

            <Text className="text-xl text-text-muted dark:text-text-muted-dark">
              ›
            </Text>
          </Pressable>

          <View className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-lg bg-input dark:bg-input-dark">
              <Text className="text-lg">🛡️</Text>
            </View>

            <View className="flex-1">
              <Text className="text-base font-bold text-text-primary dark:text-text-primary-dark">
                Two-Factor Auth
              </Text>

              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                Extra layer of security
              </Text>
            </View>

            <Switch
              value={twoFactorEnabled}
              onValueChange={setTwoFactorEnabled}
              thumbColor="#FFFFFF"
              trackColor={{
                false: '#2A3346',
                true: '#00E5A0',
              }}
            />
          </View>
        </View>

        {/* Support Section */}
        <View className="mt-3 rounded-xl border border-input-border bg-surface p-3 dark:border-input-border-dark dark:bg-surface-dark">
          <Text className="mb-2 font-bold text-text-primary dark:text-text-primary-dark">
            Support
          </Text>

          {[
            ['💬', 'Contact Support', 'Get help from our team'],
            ['⭐', 'Rate FitTrack', 'Share your feedback'],
            ['📄', 'Privacy Policy', 'Read our data practices'],
          ].map(([icon, title, subtitle]) => (
            <Pressable
              key={title}
              className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3"
            >
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-lg bg-input dark:bg-input-dark">
                <Text className="text-lg">{icon}</Text>
              </View>

              <View className="flex-1">
                <Text className="text-base font-bold text-text-primary dark:text-text-primary-dark">
                  {title}
                </Text>

                <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                  {subtitle}
                </Text>
              </View>

              <Text className="text-xl text-text-muted dark:text-text-muted-dark">
                ›
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Appearance / Theme Section */}
        <View className="mt-3 rounded-xl border border-input-border bg-surface p-3 dark:border-input-border-dark dark:bg-surface-dark">
          <Text className="mb-2 font-bold text-text-primary dark:text-text-primary-dark">
            Appearance
          </Text>

          <View className="flex-row items-center border-t border-input-border dark:border-input-border-dark py-3">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-lg bg-input dark:bg-input-dark">
              <Text className="text-lg">{colorScheme === 'dark' ? '🌙' : '☀️'}</Text>
            </View>

            <View className="flex-1">
              <Text className="text-base font-bold text-text-primary dark:text-text-primary-dark">
                Dark Mode
              </Text>

              <Text className="text-xs text-text-muted dark:text-text-muted-dark">
                {colorScheme === 'dark' ? 'Dark theme active' : 'Light theme active'}
              </Text>
            </View>

            <Switch
              value={colorScheme === 'dark'}
              onValueChange={(isDark) => setColorScheme(isDark ? 'dark' : 'light')}
              thumbColor="#FFFFFF"
              trackColor={{
                false: '#2A3346',
                true: '#00E5A0',
              }}
            />
          </View>
        </View>

        {/* Log Out Section (Below everything else) */}
        <View className="mt-6">
          <Pressable
            className="flex-row items-center justify-center rounded-xl bg-red-500/15 dark:bg-red-500/20 border border-red-500/30 p-4 active:opacity-80"
            onPress={() => setShowLogoutModal(true)}
          >
            <Text className="mr-2 text-lg">🚪</Text>
            <Text className="text-base font-bold text-red-500 dark:text-red-400">
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
        icon="🚪"
        confirmText="Log Out"
        cancelText="Cancel"
        isDanger
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </SafeAreaView>
  );
}