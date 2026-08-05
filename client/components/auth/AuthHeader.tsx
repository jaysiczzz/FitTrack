import React from 'react';
import { View, Text } from 'react-native';

const AuthHeader: React.FC = () => {
  return (
    <View className="items-center mb-6 mt-14">
      <Text className="text-text-primary dark:text-text-primary-dark text-4xl font-bold mb-1.5">
        Welcome to FitTrack
      </Text>
      <Text className="text-text-muted dark:text-text-muted-dark text-[13px]">
        Your intelligent fitness companion powered by AI
      </Text>
    </View>
  );
};

export default AuthHeader;