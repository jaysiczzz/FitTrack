import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

interface QuotaUsageMeterProps {
  isPro: boolean;
  used: number;
  limit: number;
  unit: string; // e.g. 'scans', 'messages', 'routines'
  period?: 'day' | 'month';
  onUpgradePress?: () => void;
  className?: string;
  resetsAt?: string;
  badgeLabel?: string;
}

export default function QuotaUsageMeter({
  isPro,
  used,
  limit,
  unit,
  period = 'day',
  onUpgradePress,
  className = '',
  resetsAt,
  badgeLabel,
}: QuotaUsageMeterProps) {
  const { colors } = useThemeColors();
  const remaining = Math.max(0, limit - used);
  const periodLabel = period === 'month' ? 'this month' : 'today';

  return (
    <View
      className={`px-3.5 py-2.5 rounded-xl flex-row items-center justify-between border bg-input/60 dark:bg-input-dark/60 border-input-border dark:border-input-border-dark ${className}`}
    >
      <View className="flex-row items-center gap-1.5 flex-1 mr-2">
        <Ionicons
          name={isPro ? 'sparkles' : 'flash'}
          size={14}
          color={colors.accent}
        />
        <Text className="text-xs font-baloo-bold text-text-primary dark:text-text-primary-dark">
          {badgeLabel || (isPro ? 'FitTrack Pro Active' : 'Free Tier')}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        <Text className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark">
          {remaining} of {limit} {unit} left {periodLabel}
        </Text>

        {!isPro && onUpgradePress && (
          <TouchableOpacity
            onPress={onUpgradePress}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="bg-accent/15 px-2.5 py-1 min-h-[32px] justify-center items-center rounded-full border border-accent/30"
          >
            <Text className="text-[10px] font-baloo-bold text-accent dark:text-accent-dark">
              Upgrade
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
