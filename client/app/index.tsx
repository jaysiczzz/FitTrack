import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants/colors';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.accent.dark} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(screen)/dashboard" />;
  }

  return <Redirect href="/(auth)" />;
}

