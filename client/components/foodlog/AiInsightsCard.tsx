import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIInsight } from '@/api/ai';
import { useColorScheme } from 'nativewind';
import SurfaceCard from '../ui/SurfaceCard';
import { ListItemSkeleton } from '../ui/Skeleton';

export interface AiInsightsCardProps {
  insights: AIInsight[];
  loading: boolean;
  category?: 'workout' | 'nutrition' | 'all';
}

export default function AiInsightsCard({
  insights,
  loading,
  category = 'all',
}: AiInsightsCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const accentColor = isDark ? '#10B981' : '#047857';

  const cardTitle =
    category === 'workout'
      ? 'AI Workout Insights'
      : category === 'nutrition'
      ? 'AI Nutrition Insights'
      : 'Daily AI Insights';

  const cardSubtitle =
    category === 'workout'
      ? 'Guidance tailored to your sets & recovery'
      : category === 'nutrition'
      ? 'Pacing recommendations for your goals'
      : 'Real-time coaching recommendations';

  return (
    <SurfaceCard className="mb-3 p-3.5">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center gap-1.5 flex-1">
          <Ionicons name="sparkles" size={14} color={accentColor} />
          <Text className="text-text-primary dark:text-text-primary-dark font-baloo-bold text-sm">
            {cardTitle}
          </Text>
        </View>
        <Text className="text-text-muted dark:text-text-muted-dark text-[11px]">
          {cardSubtitle}
        </Text>
      </View>

      {/* Insights List */}
      <View className="gap-2">
        {loading && insights.length === 0 ? (
          <>
            <ListItemSkeleton />
            <ListItemSkeleton />
          </>
        ) : (
          insights.map((item, index) => {
            const isHydration =
              item.title.toLowerCase().includes('hydrat') || item.title.toLowerCase().includes('water');

            let itemIcon: keyof typeof Ionicons.glyphMap = 'sparkles';
            let itemColor = accentColor;
            let itemBg = 'bg-surface dark:bg-surface-dark border-input-border dark:border-input-border-dark';
            let cardBg = 'bg-input/50 dark:bg-input-dark/50 border-input-border dark:border-input-border-dark';

            if (category === 'workout') {
              itemIcon = 'barbell-outline';
              itemColor = isDark ? '#34D399' : '#047857';
            } else if (category === 'nutrition') {
              if (isHydration) {
                itemIcon = 'water-outline';
                itemColor = isDark ? '#38BDF8' : '#0284C7';
              } else {
                itemIcon = 'nutrition-outline';
                itemColor = isDark ? '#FBBF24' : '#D97706';
              }
            }

            return (
              <View
                key={index}
                className={`${cardBg} rounded-xl p-3 border flex-row items-start`}
              >
                <View className={`w-7 h-7 rounded-full ${itemBg} border items-center justify-center mr-3 mt-0.5 shadow-2xs`}>
                  <Ionicons name={itemIcon} size={13} color={itemColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary dark:text-text-primary-dark font-baloo-bold text-xs mb-1">
                    {item.title}
                  </Text>
                  {item.lines.map((line, lIdx) => (
                    <Text
                      key={lIdx}
                      className="text-text-muted dark:text-text-muted-dark text-xs leading-4 font-normal"
                    >
                      {line}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </View>
    </SurfaceCard>
  );
}
