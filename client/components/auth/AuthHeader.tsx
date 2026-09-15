import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

interface AuthHeaderProps {
  compact?: boolean;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ compact }) => {
  const { colors } = useThemeColors();

  return (
    <View className={`items-center ${compact ? 'mb-2' : 'mb-6 mt-2'}`}>
      {!compact && (
        <View className="w-12 h-12 rounded-2xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mb-3 border border-accent/20 dark:border-accent-dark/30">
          <Ionicons name="fitness" size={28} color={colors.accent} />
        </View>
      )}
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