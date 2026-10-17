import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Slot, useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Baloo2_400Regular,
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
} from "@expo-google-fonts/baloo-2";
import { ToastProvider } from "../context/ToastContext";
import { AuthProvider } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import { WorkoutTimerProvider } from "../context/WorkoutTimerContext";
import { ThemeProvider, useThemeColors } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import { initWebAriaFix } from "@/utils/webAriaFix";
import { setupNotificationListeners, registerForPushNotificationsAsync } from "@/utils/notificationService";
import "../global.css";

initWebAriaFix();
SplashScreen.preventAutoHideAsync();

// Suppress verbose debug console logs in production release builds
if (!__DEV__) {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
}

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center bg-background dark:bg-background-dark p-6">
      <View className="w-16 h-16 rounded-full bg-red-500/10 items-center justify-center mb-4">
        <Text className="text-2xl">⚠️</Text>
      </View>
      <Text className="text-xl font-baloo-bold text-text-primary dark:text-text-primary-dark text-center mb-2">
        Something went wrong
      </Text>
      <Text className="text-sm font-baloo text-text-muted dark:text-text-muted-dark text-center mb-6 max-w-sm">
        {__DEV__
          ? error?.message || 'An unexpected issue occurred while rendering this view.'
          : 'An unexpected issue occurred. Please restart the app or try again.'}
      </Text>
      <TouchableOpacity
        onPress={retry}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        className="px-6 py-3 rounded-2xl bg-accent dark:bg-accent-dark items-center justify-center min-h-[48px]"
      >
        <Text className="text-base font-baloo-bold text-accent-contrast dark:text-accent-contrast-dark">Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

function RootLayoutContent() {
  const { isDark, colors } = useThemeColors();
  const [fontsLoaded] = useFonts({
    Baloo2_400Regular,
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
  });

  const router = useRouter();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Unified Mobile Notification Listeners & Push Token Sync
  useEffect(() => {
    const cleanup = setupNotificationListeners(router);
    registerForPushNotificationsAsync().catch(() => {});
    return () => {
      cleanup();
    };
  }, [router]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <WorkoutTimerProvider>
              <View className="flex-1 min-h-0 bg-background dark:bg-background-dark">
                <View className="flex-1 min-h-0 w-full">
                  <Slot />
                </View>
              </View>
            </WorkoutTimerProvider>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}