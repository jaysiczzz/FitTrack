import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

interface QuickActionToolbarProps {
  onScanPhoto?: () => void;
  onAiSuggest: () => void;
  onSearchFood: () => void;
  onTextLog: () => void;
}

export default function QuickActionToolbar({
  onAiSuggest,
  onSearchFood,
  onTextLog,
}: QuickActionToolbarProps) {
  const { colors, isDark } = useThemeColors();

  return (
    <View className="mb-3.5">
      <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm mb-2.5">
        Quick Actions
      </Text>

      <View className="flex-row gap-2">
        {/* Search Food */}
        <TouchableOpacity
          onPress={onSearchFood}
          activeOpacity={0.8}
          className="flex-1 bg-accent dark:bg-accent-dark py-2.5 px-2 rounded-xl flex-row items-center justify-center gap-1.5"
        >
          <Ionicons name="search" size={14} color={isDark ? colors.background : '#FFFFFF'} />
          <Text className="text-white dark:text-background-dark font-bold text-xs text-center">
            Search
          </Text>
        </TouchableOpacity>

        {/* Text / Describe Meal */}
        <TouchableOpacity
          onPress={onTextLog}
          activeOpacity={0.8}
          className="flex-1 bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark py-2.5 px-2 rounded-xl flex-row items-center justify-center gap-1.5"
        >
          <Ionicons name="create" size={14} color={colors.textPrimary} />
          <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xs text-center">
            Describe
          </Text>
        </TouchableOpacity>

        {/* AI Suggest */}
        <TouchableOpacity
          onPress={onAiSuggest}
          activeOpacity={0.8}
          className="flex-1 bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark py-2.5 px-2 rounded-xl flex-row items-center justify-center gap-1.5"
        >
          <Ionicons name="sparkles" size={14} color={colors.accent} />
          <Text className="text-accent dark:text-accent-dark font-bold text-xs text-center">
            AI Suggest
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
