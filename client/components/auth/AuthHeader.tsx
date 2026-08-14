import React from 'react';
import { View, Text } from 'react-native';

const AuthHeader: React.FC = () => {
  return (
    <View className="items-center mb-6 mt-4">
      <View className="w-14 h-14 rounded-2xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mb-3.5 border border-accent/30 dark:border-accent-dark/40">
        <Text className="text-2xl">⚡</Text>
      </View>
      <Text className="text-text-primary dark:text-text-primary-dark text-3xl font-extrabold tracking-tight mb-2 text-center">
        Welcome to FitTrack
      </Text>
      <Text className="text-text-muted dark:text-text-muted-dark text-sm font-normal text-center max-w-[280px]">
        Your intelligent fitness companion powered by AI
      </Text>
    </View>
  );
};

export default AuthHeader;