import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import ProgressBar from '@/components/ui/ProgressBar';
import { COLORS } from '@/constants/colors';

interface OnboardingHeaderProps {
  compact?: boolean;
  step?: number;
  totalSteps?: number;
  onBack?: () => void;
  showBack?: boolean;
  title?: string;
  subtitle?: string;
}

const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  compact,
  step = 1,
  totalSteps = 3,
  onBack,
  showBack = true,
  title,
  subtitle,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    try {
      if (typeof router.canGoBack === 'function' && router.canGoBack()) {
        router.back();
        return;
      }
    } catch (e) {}
    if (typeof router.replace === 'function') router.replace('/(auth)');
  };

  const progressPercent = Math.min(100, Math.max(0, (step / totalSteps) * 100));

  // Default titles per step if not explicitly provided
  const defaultTitles: Record<number, { title: string; subtitle: string }> = {
    1: {
      title: 'Choose Your Goal',
      subtitle: 'What do you want to accomplish on FitTrack?',
    },
    2: {
      title: 'Body Metrics',
      subtitle: 'We use these to customize your calorie & workout targets.',
    },
    3: {
      title: 'Your AI Plan',
      subtitle: 'Generating your personalized fitness program.',
    },
  };

  const headerTitle = title || defaultTitles[step]?.title || 'Almost done!';
  const headerSubtitle = subtitle || defaultTitles[step]?.subtitle || 'Just a few details to personalize your plan';

  return (
    <View className={`${compact ? 'mb-1.5 pt-0' : 'mb-3.5 pt-0'}`}>
      {/* Top Header Row with Aligned Back Button & Step Progress Badge */}
      <View className="flex-row items-center justify-between mb-2">
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            className="w-8 h-8 rounded-full bg-surface dark:bg-surface-dark border border-input-border/60 dark:border-input-border-dark/60 items-center justify-center"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text className="text-text-primary dark:text-text-primary-dark text-sm font-bold">←</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-8 h-8" />
        )}

        <View className="bg-accent/15 dark:bg-accent-dark/20 px-2.5 py-0.5 rounded-full border border-accent/30 dark:border-accent-dark/30">
          <Text className="text-accent dark:text-accent-dark text-[11px] font-bold uppercase tracking-wider">
            Step {step} of {totalSteps}
          </Text>
        </View>
      </View>

      {/* Visual Progress Bar */}
      <ProgressBar
        percentage={progressPercent}
        height={4}
        color={COLORS.accent.dark}
        trackClassName="bg-surface dark:bg-surface-dark"
        className="mb-2.5"
      />

      <Text className={`text-text-primary dark:text-text-primary-dark font-black tracking-tight ${compact ? 'text-xl mb-0.5' : 'text-2xl mb-0.5'}`}>
        {headerTitle}
      </Text>
      {!compact && (
        <Text className="text-text-muted dark:text-text-muted-dark text-xs font-normal">
          {headerSubtitle}
        </Text>
      )}
    </View>
  );
};

export default OnboardingHeader;
