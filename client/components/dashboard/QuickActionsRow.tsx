import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';

interface QuickActionsRowProps {
  onScanFoodPress: () => void;
  onQuickAddWater: () => void;
  waterMl?: number;
  targetWater?: number;
}

export default function QuickActionsRow({
  onScanFoodPress,
  onQuickAddWater,
  waterMl = 0,
  targetWater = 2000,
}: QuickActionsRowProps) {
  const isHydrated = waterMl >= targetWater;

  return (
    <View className="mb-4">
      <View className="flex-row gap-2.5">
        {/* Action 1: AI Food Scanner */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onScanFoodPress}
          className="flex-1 bg-surface dark:bg-surface-dark border border-sky-500/30 dark:border-sky-500/30 rounded-2xl p-3 flex-row items-center"
          style={Platform.select({
            web: { boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)' } as any,
            default: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
            },
          })}
        >
          <View className="w-9 h-9 rounded-xl bg-sky-500/15 dark:bg-sky-500/25 items-center justify-center mr-2.5">
            <Text className="text-lg">📸</Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-xs">
              AI Food Scan
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-medium" numberOfLines={1}>
              Instant photo macros
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action 2: 1-Tap Hydration */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onQuickAddWater}
          className={`flex-1 bg-surface dark:bg-surface-dark border rounded-2xl p-3 flex-row items-center ${
            isHydrated
              ? 'border-emerald-500/40 dark:border-emerald-500/40 bg-emerald-500/5'
              : 'border-blue-500/30 dark:border-blue-500/30'
          }`}
          style={Platform.select({
            web: { boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)' } as any,
            default: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
            },
          })}
        >
          <View
            className={`w-9 h-9 rounded-xl items-center justify-center mr-2.5 ${
              isHydrated
                ? 'bg-emerald-500/15 dark:bg-emerald-500/25'
                : 'bg-blue-500/15 dark:bg-blue-500/25'
            }`}
          >
            <Text className="text-lg">{isHydrated ? '🏆' : '💧'}</Text>
          </View>
          <View className="flex-1">
            <Text
              className={`font-extrabold text-xs ${
                isHydrated
                  ? 'text-emerald-400'
                  : 'text-text-primary dark:text-text-primary-dark'
              }`}
            >
              {isHydrated ? 'Hydrated ✓' : '+250ml Water'}
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-medium" numberOfLines={1}>
              {isHydrated
                ? `${waterMl.toLocaleString()}/${targetWater.toLocaleString()}ml (100%)`
                : '1-tap quick log'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
