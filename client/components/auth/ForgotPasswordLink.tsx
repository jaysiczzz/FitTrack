import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  onPress?: () => void;
}

const ForgotPasswordLink: React.FC<Props> = ({ onPress }) => {
  return (
    <View className="flex-row justify-center items-center mt-3">
      <Text className="text-text-muted dark:text-text-muted-dark text-xs font-sans">
        Forgot password?{' '}
      </Text>
      <TouchableOpacity
        onPress={onPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Reset forgotten password"
        className="min-h-[44px] justify-center py-1 px-1.5 active:opacity-60"
      >
        <Text className="text-accent dark:text-accent-dark text-xs font-baloo-bold">
          Reset
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ForgotPasswordLink;