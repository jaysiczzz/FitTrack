import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '@/components/ui/ProgressBar';
import { useThemeColors } from '@/constants/colors';

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
  const { colors } = useThemeColors();
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

  const defaultTitles: Record<number, { title: string; subtitle: string }> = {
    1: {
      title: 'Choose Your Goal',
      subtitle: 'What do you want to accomplish on FitTrack?',
    },
    2: {
      title: 'Body Metrics',
      subtitle: 'We use these to calibrate your calorie and workout targets.',
    },
    3: {
      title: 'Your Plan',
      subtitle: 'Generating your personalized fitness program.',
    },
  };

  const headerTitle = title || defaultTitles[step]?.title || 'Almost done';
  const headerSubtitle = subtitle || defaultTitles[step]?.subtitle || 'A few details to personalize your plan';

  return (
    <View className={`${compact ? 'mb-2' : 'mb-4'}`}>
      {/* Top Navigation Row */}
      <View className="flex-row items-center justify-between mb-3">
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            className="w-8 h-8 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View className="w-8 h-8" />
        )}

        <View className="bg-input dark:bg-input-dark px-2.5 py-1 rounded-full border border-input-border dark:border-input-border-dark">
          <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-semibold tracking-wide uppercase">
            Step {step} of {totalSteps}
          </Text>
        </View>
      </View>

      {/* Visual Progress Bar */}
      <ProgressBar
        percentage={progressPercent}
        height={4}
        className="mb-3"
      />

      <Text className={`text-text-primary dark:text-text-primary-dark font-extrabold tracking-tight ${compact ? 'text-xl mb-0.5' : 'text-2xl mb-1'}`}>
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
