import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const OnboardingHeader: React.FC = () => {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)');
    }
  };

  return (
    <View className="mb-6">
      <TouchableOpacity
        onPress={handleBack}
        className="flex-row items-center self-start mb-4 py-1 pr-3"
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text className="text-accent dark:text-accent-dark text-xl mr-1.5 font-semibold">←</Text>
        <Text className="text-text-muted dark:text-text-muted-dark text-sm font-medium">Back to Login</Text>
      </TouchableOpacity>

      <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-bold mb-1.5">
        Almost done!
      </Text>
      <Text className="text-text-muted dark:text-text-muted-dark text-[13px]">
        Just a few details to personalize your plan
      </Text>
    </View>
  );
};

export default OnboardingHeader;
