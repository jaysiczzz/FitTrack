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
    } catch (e) {}
    if (typeof router.replace === 'function') router.replace('/(auth)');
  };

  return (
    <View className="mb-6 pt-1">
      {/* Top Header Row with Aligned Back Button & Step Progress Badge */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full bg-surface dark:bg-surface-dark border border-input-border/60 dark:border-input-border-dark/60 items-center justify-center"
        >
          <Text className="text-text-primary dark:text-text-primary-dark text-lg font-bold">←</Text>
        </TouchableOpacity>

        <View className="bg-accent/15 dark:bg-accent-dark/20 px-3 py-1 rounded-full border border-accent/30 dark:border-accent-dark/30">
          <Text className="text-accent dark:text-accent-dark text-xs font-bold uppercase tracking-wider">
            Step 2 of 2
          </Text>
        </View>
      </View>

      {/* Visual Progress Line */}
      <View className="h-1.5 w-full bg-surface dark:bg-surface-dark rounded-full overflow-hidden mb-5">
        <View className="h-1.5 w-full bg-accent dark:bg-accent-dark rounded-full" />
      </View>

      <Text className="text-text-primary dark:text-text-primary-dark text-3xl font-extrabold tracking-tight mb-1.5">
        Almost done!
      </Text>
      <Text className="text-text-muted dark:text-text-muted-dark text-sm font-normal">
        Just a few details to personalize your plan
      </Text>
    </View>
  );
};

export default OnboardingHeader;
