import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface OnboardingHeaderProps {
  compact?: boolean;
}

const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({ compact }) => {
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
    <View className={`${compact ? 'mb-3 pt-0' : 'mb-6 pt-1'}`}>
      {/* Top Header Row with Aligned Back Button & Step Progress Badge */}
      <View className={`flex-row items-center justify-between ${compact ? 'mb-2' : 'mb-4'}`}>
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-surface dark:bg-surface-dark border border-input-border/60 dark:border-input-border-dark/60 items-center justify-center`}
        >
          <Text className="text-text-primary dark:text-text-primary-dark text-base font-bold">←</Text>
        </TouchableOpacity>

        <View className="bg-accent/15 dark:bg-accent-dark/20 px-3 py-1 rounded-full border border-accent/30 dark:border-accent-dark/30">
          <Text className="text-accent dark:text-accent-dark text-xs font-bold uppercase tracking-wider">
            Step 2 of 2
          </Text>
        </View>
      </View>

      {/* Visual Progress Line */}
      <View className={`h-1.5 w-full bg-surface dark:bg-surface-dark rounded-full overflow-hidden ${compact ? 'mb-3' : 'mb-5'}`}>
        <View className="h-1.5 w-full bg-accent dark:bg-accent-dark rounded-full" />
      </View>

      <Text className={`text-text-primary dark:text-text-primary-dark font-extrabold tracking-tight ${compact ? 'text-2xl mb-0.5' : 'text-3xl mb-1.5'}`}>
        Almost done!
      </Text>
      {!compact && (
        <Text className="text-text-muted dark:text-text-muted-dark text-sm font-normal">
          Just a few details to personalize your plan
        </Text>
      )}
    </View>
  );
};

export default OnboardingHeader;
