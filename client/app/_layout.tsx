import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Baloo2_400Regular,
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
} from '@expo-google-fonts/baloo-2';
import colors from '@/constants/colors';

SplashScreen.preventAutoHideAsync();

const fontMap: Record<string, string> = {
  '400': 'Baloo2_400Regular',
  normal: 'Baloo2_400Regular',
  '500': 'Baloo2_500Medium',
  '600': 'Baloo2_600SemiBold',
  '700': 'Baloo2_700Bold',
  bold: 'Baloo2_700Bold',
};

function applyGlobalFont() {
  const TextRender = (Text as any).render;
  (Text as any).render = function (...args: any[]) {
    const origin = TextRender.apply(this, args);
    const flatStyle = StyleSheet.flatten(origin.props.style) || {};
    const weight = String(flatStyle.fontWeight ?? '400');
    const family = fontMap[weight] || 'Baloo2_400Regular';
    return React.cloneElement(origin, {
      style: [{ fontFamily: family }, origin.props.style],
    });
  };
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Baloo2_400Regular,
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      applyGlobalFont();
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
  },
});
