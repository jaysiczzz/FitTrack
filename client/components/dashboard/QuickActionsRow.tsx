import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';

interface QuickActionsRowProps {
  onScanFoodPress: () => void;
  onQuickAddWater: () => void;
}

export default function QuickActionsRow({
  onScanFoodPress,
  onQuickAddWater,
}: QuickActionsRowProps) {
  const router = useRouter();

  const actions = [
    {
      label: 'Log Food',
      icon: '🥗',
      onPress: () => router.push('/(screen)/foodlog' as any),
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30',
      text: 'text-emerald-400',
    },
    {
      label: 'AI Scan',
      icon: '📸',
      onPress: onScanFoodPress,
      bg: 'bg-sky-500/10 dark:bg-sky-500/20 border-sky-500/30',
      text: 'text-sky-400',
    },
    {
      label: 'Workout',
      icon: '🏋️‍♂️',
      onPress: () => router.push('/(screen)/workouts' as any),
      bg: 'bg-accent/10 dark:bg-accent-dark/20 border-accent/30',
      text: 'text-accent dark:text-accent-dark',
    },
    {
      label: '+Water',
      icon: '💧',
      onPress: onQuickAddWater,
      bg: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30',
      text: 'text-blue-400',
    },
  ];

  return (
    <View className="mb-4">
      <View className="flex-row justify-between gap-2">
        {actions.map((act, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.75}
            onPress={act.onPress}
            className={`flex-1 py-3 px-1 rounded-2xl items-center border ${act.bg}`}
            style={Platform.select({
              web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any,
              default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              },
            })}
          >
            <Text className="text-xl mb-1">{act.icon}</Text>
            <Text className={`text-[11px] font-extrabold text-center ${act.text}`} numberOfLines={1}>
              {act.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
