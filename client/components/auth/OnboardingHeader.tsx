import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const OnboardingHeader: React.FC = () => {
  const router = useRouter();
  const handleBack = () => {
    try {
      if (typeof router.canGoBack === 'function' && router.canGoBack()) {
        router.back();
        return;
      }
    } catch (e) {
      
    }
    if (typeof router.replace === 'function') router.replace('/');
  };
  return (
    <View className="mb-6 relative pt-1">
      <TouchableOpacity onPress={handleBack} className="absolute left-0 top-0 mb-0">
        <Text className="text-text-muted dark:text-text-muted-dark text-xl">←</Text>
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