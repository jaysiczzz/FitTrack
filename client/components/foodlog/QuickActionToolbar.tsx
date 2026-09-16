import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

interface QuickActionToolbarProps {
  onAiSuggest: () => void;
  onTextLog: () => void;
}

export default function QuickActionToolbar({
  onAiSuggest,
  onTextLog,
}: QuickActionToolbarProps) {
  const { colors, isDark } = useThemeColors();

  return (
    <View className="mb-3.5">
      <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm mb-2.5">
        Quick Actions
      </Text>

      <View className="flex-row gap-2.5">
        {/* Text / Describe Meal */}
        <TouchableOpacity
          onPress={onTextLog}
          activeOpacity={0.8}
          className="flex-1 bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark py-3 px-3 rounded-2xl flex-row items-center justify-center gap-2"
        >
          <Ionicons name="create-outline" size={16} color={colors.textPrimary} />
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs text-center">
            Describe Meal
          </Text>
        </TouchableOpacity>

        {/* AI Suggest */}
        <TouchableOpacity
          onPress={onAiSuggest}
          activeOpacity={0.8}
          className="flex-1 bg-accent/15 dark:bg-accent-dark/20 border border-accent/40 dark:border-accent-dark/40 py-3 px-3 rounded-2xl flex-row items-center justify-center gap-2"
        >
          <Ionicons name="sparkles" size={16} color="#10B981" />
          <Text className="text-accent dark:text-accent-dark font-bold text-xs text-center">
            AI Suggest
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
