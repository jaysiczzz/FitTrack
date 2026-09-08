import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';

interface QuickActionToolbarProps {
  onScanPhoto: () => void;
  onAiSuggest: () => void;
  onSearchFood: () => void;
  onQuickStaples?: () => void;
  onTextLog: () => void;
}

export default function QuickActionToolbar({
  onScanPhoto,
  onAiSuggest,
  onSearchFood,
  onQuickStaples,
  onTextLog,
}: QuickActionToolbarProps) {
  return (
    <View className="mb-3.5">
      <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm mb-2">
        Quick Actions ⚡
      </Text>

      <View className="flex-row justify-between gap-1.5">
        {/* Photo Scanner Button (Hero Action) */}
        <TouchableOpacity
          onPress={onScanPhoto}
          activeOpacity={0.8}
          className="flex-1 bg-accent dark:bg-accent-dark py-2.5 px-1 rounded-xl items-center justify-center"
          style={Platform.select({
            web: { boxShadow: '0 2px 8px rgba(0, 229, 160, 0.25)' } as any,
            default: { elevation: 1 },
          })}
        >
          <Text className="text-lg mb-0.5">📸</Text>
          <Text className="text-background dark:text-background-dark font-black text-[11px] text-center leading-tight">
            Scan Photo
          </Text>
          <Text className="text-background/80 dark:text-background-dark/80 text-xs text-center font-medium leading-tight mt-0.5">
            AI Vision
          </Text>
        </TouchableOpacity>

        {/* AI Suggest / "What to eat?" Button */}
        <TouchableOpacity
          onPress={onAiSuggest}
          activeOpacity={0.8}
          className="flex-1 bg-surface dark:bg-surface-dark border border-accent/40 dark:border-accent-dark/40 py-2.5 px-1 rounded-xl items-center justify-center"
          style={Platform.select({
            web: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)' } as any,
            default: { elevation: 1 },
          })}
        >
          <Text className="text-lg mb-0.5">✨</Text>
          <Text className="text-accent dark:text-accent-dark font-extrabold text-[11px] text-center leading-tight">
            AI Suggest
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center leading-tight mt-0.5">
            What to eat
          </Text>
        </TouchableOpacity>

        {/* Food Search Button */}
        <TouchableOpacity
          onPress={onSearchFood || onQuickStaples}
          activeOpacity={0.8}
          className="flex-1 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark py-2.5 px-1 rounded-xl items-center justify-center"
          style={Platform.select({
            web: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)' } as any,
            default: { elevation: 1 },
          })}
        >
          <Text className="text-lg mb-0.5">🔍</Text>
          <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-[11px] text-center leading-tight">
            Search Food
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center leading-tight mt-0.5">
            Database & API
          </Text>
        </TouchableOpacity>

        {/* Text / Describe Button */}
        <TouchableOpacity
          onPress={onTextLog}
          activeOpacity={0.8}
          className="flex-1 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark py-2.5 px-1 rounded-xl items-center justify-center"
          style={Platform.select({
            web: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)' } as any,
            default: { elevation: 1 },
          })}
        >
          <Text className="text-lg mb-0.5">✍️</Text>
          <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-[11px] text-center leading-tight">
            Describe
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center leading-tight mt-0.5">
            Type Meal
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
