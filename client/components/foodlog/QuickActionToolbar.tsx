import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';

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
  return (
    <View className="mb-3.5">
      <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm mb-2">
        Quick Actions ⚡
      </Text>

      <View className="flex-row justify-between gap-2">
        {/* Food Search Button (Primary Hero Action) */}
        <TouchableOpacity
          onPress={onSearchFood}
          activeOpacity={0.8}
          className="flex-1 bg-accent dark:bg-accent-dark py-3.5 px-2 rounded-2xl items-center justify-center"
          style={Platform.select({
            web: { boxShadow: '0 2px 8px rgba(0, 229, 160, 0.25)' } as any,
            default: { elevation: 2 },
          })}
        >
          <Text className="text-xl mb-1">🔍</Text>
          <Text className="text-background dark:text-background-dark font-black text-xs text-center leading-tight">
            Search Food
          </Text>
        </TouchableOpacity>

        {/* Text / Describe Meal Button */}
        <TouchableOpacity
          onPress={onTextLog}
          activeOpacity={0.8}
          className="flex-1 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark py-3.5 px-2 rounded-2xl items-center justify-center"
          style={Platform.select({
            web: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)' } as any,
            default: { elevation: 1 },
          })}
        >
          <Text className="text-xl mb-1">✍️</Text>
          <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-xs text-center leading-tight">
            Describe
          </Text>
        </TouchableOpacity>

        {/* AI Suggest / "What to eat?" Button */}
        <TouchableOpacity
          onPress={onAiSuggest}
          activeOpacity={0.8}
          className="flex-1 bg-surface dark:bg-surface-dark border border-accent/40 dark:border-accent-dark/40 py-3.5 px-2 rounded-2xl items-center justify-center"
          style={Platform.select({
            web: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)' } as any,
            default: { elevation: 1 },
          })}
        >
          <Text className="text-xl mb-1">✨</Text>
          <Text className="text-accent dark:text-accent-dark font-extrabold text-xs text-center leading-tight">
            AI Suggest
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
