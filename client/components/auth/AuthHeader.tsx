import React from 'react';
import { View, Text } from 'react-native';

interface AuthHeaderProps {
  compact?: boolean;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ compact }) => {
  return (
    <View className={`items-center ${compact ? 'mb-2' : 'mb-4 mt-1'}`}>
      {!compact && (
        <View className="w-11 h-11 rounded-xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mb-2 border border-accent/30 dark:border-accent-dark/40">
          <Text className="text-xl">⚡</Text>
        </View>
      )}
      <Text
        className={`text-text-primary dark:text-text-primary-dark font-black tracking-tight text-center ${
          compact ? 'text-xl' : 'text-2xl mb-1'
        }`}
      >
        Welcome to FitTrack
      </Text>
      {!compact && (
        <Text className="text-text-muted dark:text-text-muted-dark text-xs font-normal text-center max-w-[280px]">
          Your intelligent fitness companion powered by AI
        </Text>
      )}
    </View>
  );
};

export default AuthHeader;