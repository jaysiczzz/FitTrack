import React, { useEffect } from "react";
import { View } from "react-native";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import {
  useFonts,
  Baloo2_400Regular,
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
} from "@expo-google-fonts/baloo-2";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Baloo2_400Regular,
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View className="flex-1 min-h-0 bg-background dark:bg-background-dark">
      <View className="flex-1 min-h-0 w-full max-w-[480px] self-center">
        <Slot />
      </View>
    </View>
  );
}