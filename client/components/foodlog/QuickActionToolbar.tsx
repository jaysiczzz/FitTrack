import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

interface QuickActionToolbarProps {
  onPhotoScan: () => void;
  onTextLog: () => void;
  onAiSuggest: () => void;
  onCopyYesterday?: () => void;
}

export default function QuickActionToolbar({
  onPhotoScan,
  onTextLog,
  onAiSuggest,
  onCopyYesterday,
}: QuickActionToolbarProps) {
  const { colors } = useThemeColors();

  return (
    <View className="mb-3.5">
      <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm mb-2">
        Food Scanner & Quick Actions
      </Text>

      <View className="flex-col md:flex-row gap-2">
        {/* Row 1: Primary Scanner Action */}
        <TouchableOpacity
          onPress={onPhotoScan}
          activeOpacity={0.8}
          className="w-full md:flex-1 bg-accent/15 dark:bg-accent-dark/20 border border-accent/40 dark:border-accent-dark/40 min-h-[44px] py-2.5 px-3 rounded-2xl flex-row items-center justify-center gap-2 shadow-2xs"
        >
          <Ionicons name="camera" size={16} color={colors.accent} />
          <Text className="text-accent dark:text-accent-dark font-bold text-xs text-center">
            Scan Food Photo
          </Text>
          <View className="bg-accent/25 dark:bg-accent-dark/30 px-1.5 py-0.5 rounded-full border border-accent/40 dark:border-accent-dark/40">
            <Text className="text-[10px] font-black text-accent dark:text-accent-dark tracking-wide">
              ✨ AI
            </Text>
          </View>
        </TouchableOpacity>

        {/* Row 2: Secondary Quick Log Actions */}
        <View className="flex-row flex-1 md:flex-2 gap-2">
          {/* Text / Describe Meal */}
          <TouchableOpacity
            onPress={onTextLog}
            activeOpacity={0.8}
            className="flex-1 bg-input/70 dark:bg-input-dark/70 border border-input-border dark:border-input-border-dark min-h-[44px] py-2.5 px-2.5 rounded-xl flex-row items-center justify-center gap-1.5"
          >
            <Ionicons name="create-outline" size={14} color={colors.textMuted} />
            <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xs text-center" numberOfLines={1}>
              Describe Meal
            </Text>
          </TouchableOpacity>

          {/* AI Suggest */}
          <TouchableOpacity
            onPress={onAiSuggest}
            activeOpacity={0.8}
            className="flex-1 bg-input/70 dark:bg-input-dark/70 border border-input-border dark:border-input-border-dark min-h-[44px] py-2.5 px-2.5 rounded-xl flex-row items-center justify-center gap-1.5"
          >
            <Ionicons name="sparkles" size={14} color={colors.accent} />
            <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xs text-center" numberOfLines={1}>
              AI Suggest
            </Text>
          </TouchableOpacity>

          {/* Copy from Yesterday */}
          {onCopyYesterday && (
            <TouchableOpacity
              onPress={onCopyYesterday}
              activeOpacity={0.8}
              className="flex-1 bg-input/70 dark:bg-input-dark/70 border border-input-border dark:border-input-border-dark py-2 px-2.5 rounded-xl flex-row items-center justify-center gap-1.5"
            >
              <Ionicons name="copy-outline" size={13} color={colors.accent} />
              <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xs text-center" numberOfLines={1}>
                Yesterday
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

