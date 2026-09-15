import React from 'react';
import { View, Text } from 'react-native';

interface AuthHeaderProps {
  compact?: boolean;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ compact }) => {
  return (
    <View className={`items-center ${compact ? 'mb-2' : 'mb-6 mt-4'}`}>
      <Text
        className={`text-text-primary dark:text-text-primary-dark font-extrabold tracking-tight text-center ${
          compact ? 'text-xl' : 'text-2xl mb-1'
        }`}
      >
        Welcome to FitTrack
      </Text>
      {!compact && (
        <Text className="text-text-muted dark:text-text-muted-dark text-xs font-normal text-center max-w-[280px]">
          Your intelligent fitness and nutrition companion
        </Text>
      )}
    </View>
  );
};

export default AuthHeader;