import React from 'react';
import { View, Text } from 'react-native';

interface AuthHeaderProps {
  compact?: boolean;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ compact }) => {
  return (
    <View className={`items-center ${compact ? 'mb-2 mt-1' : 'mb-6 mt-4'}`}>
      {!compact && (
        <View className="w-14 h-14 rounded-2xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mb-3.5 border border-accent/30 dark:border-accent-dark/40">
          <Text className="text-2xl">⚡</Text>
        </View>
      )}
      <Text
        className={`text-text-primary dark:text-text-primary-dark font-extrabold tracking-tight text-center ${
          compact ? 'text-2xl mb-1' : 'text-3xl mb-2'
        }`}
      >
        Welcome to FitTrack
      </Text>
      {!compact && (
        <Text className="text-text-muted dark:text-text-muted-dark text-sm font-normal text-center max-w-[280px]">
          Your intelligent fitness companion powered by AI
        </Text>
      )}
    </View>
  );
};

export default AuthHeader;