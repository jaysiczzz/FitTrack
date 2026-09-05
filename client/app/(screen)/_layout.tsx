import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import FloatingNavBar from '@/components/ui/FloatingNavBar';
import { useAuth } from '@/context/AuthContext';

export default function Layout() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)');
    }
  }, [isLoading, isAuthenticated, router]);

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