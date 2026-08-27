import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import FloatingNavBar from '@/components/ui/FloatingNavBar';

export default function Layout() {
  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
      <FloatingNavBar />
    </View>
  );
}