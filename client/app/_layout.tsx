import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Slot } from "expo-router";
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
import { WorkoutTimerProvider } from "../context/WorkoutTimerContext";
import { useColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { initWebAriaFix } from "@/utils/webAriaFix";
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
      <Text className="text-sm font-baloo-normal text-text-muted dark:text-text-muted-dark text-center mb-6 max-w-sm">
        {error?.message || 'An unexpected issue occurred while rendering this view.'}
      </Text>
      <TouchableOpacity
        onPress={retry}
        activeOpacity={0.8}
        className="px-6 py-3 rounded-xl bg-accent items-center justify-center min-h-[44px]"
      >
        <Text className="text-base font-baloo-bold text-white">Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [fontsLoaded] = useFonts({
    Baloo2_400Regular,
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
  });

  useEffect(() => {
    AsyncStorage.getItem('fittrack_app_theme')
      .then((savedTheme) => {
        if (savedTheme === 'dark' || savedTheme === 'light') {
          if (savedTheme !== colorScheme) {
            setColorScheme(savedTheme);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ToastProvider>
        <AuthProvider>
          <WorkoutTimerProvider>
            <View className="flex-1 min-h-0 bg-background dark:bg-background-dark">
              <View className="flex-1 min-h-0 w-full">
                <Slot />
              </View>
            </View>
          </WorkoutTimerProvider>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}