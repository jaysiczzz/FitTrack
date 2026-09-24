import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

interface QuickActionToolbarProps {
  onPhotoScan: () => void;
  onBarcodeScan: () => void;
  onTextLog: () => void;
  onAiSuggest: () => void;
}

export default function QuickActionToolbar({
  onPhotoScan,
  onBarcodeScan,
  onTextLog,
  onAiSuggest,
}: QuickActionToolbarProps) {
  const { colors, isDark } = useThemeColors();

  return (
    <View className="mb-3.5">
      <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm mb-2">
        Food Scanner & Quick Actions
      </Text>

      <View className="gap-2">
        {/* Row 1: Primary Scanner Actions */}
        <View className="flex-row gap-2">
          {/* Photo / Camera Scanner */}
          <TouchableOpacity
            onPress={onPhotoScan}
            activeOpacity={0.8}
            className="flex-1 bg-accent/15 dark:bg-accent-dark/20 border border-accent/40 dark:border-accent-dark/40 py-2.5 px-3 rounded-2xl flex-row items-center justify-center gap-2 shadow-2xs"
          >
            <Ionicons name="camera" size={16} color={colors.accent} />
            <Text className="text-accent dark:text-accent-dark font-bold text-xs text-center">
              Scan Food Photo
            </Text>
          </TouchableOpacity>

          {/* Barcode & Package Scanner */}
          <TouchableOpacity
            onPress={onBarcodeScan}
            activeOpacity={0.8}
            className="flex-1 bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark py-2.5 px-3 rounded-2xl flex-row items-center justify-center gap-2"
          >
            <Ionicons name="barcode-outline" size={16} color={colors.textPrimary} />
            <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs text-center">
              Scan Barcode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Secondary Quick Log Actions */}
        <View className="flex-row gap-2">
          {/* Text / Describe Meal */}
          <TouchableOpacity
            onPress={onTextLog}
            activeOpacity={0.8}
            className="flex-1 bg-input/70 dark:bg-input-dark/70 border border-input-border dark:border-input-border-dark py-2 px-3 rounded-xl flex-row items-center justify-center gap-1.5"
          >
            <Ionicons name="create-outline" size={14} color={colors.textMuted} />
            <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xs text-center">
              Describe Meal
            </Text>
          </TouchableOpacity>

          {/* AI Suggest */}
          <TouchableOpacity
            onPress={onAiSuggest}
            activeOpacity={0.8}
            className="flex-1 bg-input/70 dark:bg-input-dark/70 border border-input-border dark:border-input-border-dark py-2 px-3 rounded-xl flex-row items-center justify-center gap-1.5"
          >
            <Ionicons name="sparkles" size={14} color="#10B981" />
            <Text className="text-text-primary dark:text-text-primary-dark font-semibold text-xs text-center">
              AI Suggest
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
