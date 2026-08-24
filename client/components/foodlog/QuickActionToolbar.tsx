import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface QuickActionToolbarProps {
  onScanPhoto: () => void;
  onAiSuggest: () => void;
  onQuickStaples: () => void;
  onTextLog: () => void;
}

export default function QuickActionToolbar({
  onScanPhoto,
  onAiSuggest,
  onQuickStaples,
  onTextLog,
}: QuickActionToolbarProps) {
  return (
    <View className="mb-5">
      <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm mb-2.5">
        Quick Logging Actions ⚡
      </Text>

      <View className="flex-row justify-between gap-2">
        {/* Photo Scanner Button (Hero Action) */}
        <TouchableOpacity
          onPress={onScanPhoto}
          activeOpacity={0.8}
          className="flex-1 bg-accent dark:bg-accent-dark py-3 px-2 rounded-2xl items-center justify-center shadow-xs"
        >
          <Text className="text-xl mb-0.5">📸</Text>
          <Text className="text-background dark:text-background-dark font-extrabold text-xs text-center">
            Scan Photo
          </Text>
          <Text className="text-background/80 dark:text-background-dark/80 text-[10px] text-center font-medium">
            AI Vision
          </Text>
        </TouchableOpacity>

        {/* AI Suggest / "What to eat?" Button */}
        <TouchableOpacity
          onPress={onAiSuggest}
          activeOpacity={0.8}
          className="flex-1 bg-surface dark:bg-surface-dark border border-accent/40 dark:border-accent-dark/40 py-3 px-2 rounded-2xl items-center justify-center shadow-xs"
        >
          <Text className="text-xl mb-0.5">✨</Text>
          <Text className="text-accent dark:text-accent-dark font-extrabold text-xs text-center">
            AI Suggest
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-[10px] text-center">
            What to eat?
          </Text>
        </TouchableOpacity>

        {/* Beginner Staples Button */}
        <TouchableOpacity
          onPress={onQuickStaples}
          activeOpacity={0.8}
          className="flex-1 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark py-3 px-2 rounded-2xl items-center justify-center shadow-xs"
        >
          <Text className="text-xl mb-0.5">🥗</Text>
          <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-xs text-center">
            Staples
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-[10px] text-center">
            1-Tap Add
          </Text>
        </TouchableOpacity>

        {/* Text / Describe Button */}
        <TouchableOpacity
          onPress={onTextLog}
          activeOpacity={0.8}
          className="flex-1 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark py-3 px-2 rounded-2xl items-center justify-center shadow-xs"
        >
          <Text className="text-xl mb-0.5">✍️</Text>
          <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-xs text-center">
            Describe
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-[10px] text-center">
            Type Meal
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
