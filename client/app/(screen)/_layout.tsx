import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import FloatingNavBar from '@/components/ui/FloatingNavBar';
import FloatingAiCoachButton from '@/components/ui/FloatingAiCoachButton';
import RestTimerDock from '@/components/workouts/RestTimerDock';
import { useAuth } from '@/context/AuthContext';

export default function Layout() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)');
    }
  }, [isLoading, isAuthenticated, router]);

  if (!isLoading && !isAuthenticated) {
    return <View className="flex-1 bg-background dark:bg-background-dark" />;
  }

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
      <RestTimerDock />
      <FloatingAiCoachButton />
      <FloatingNavBar />
    </View>
  );
}