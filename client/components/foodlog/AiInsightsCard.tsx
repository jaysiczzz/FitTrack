import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If no insights and not loading, do not render an empty card
  if (!loading && (!insights || insights.length === 0)) {
    return null;
  }

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
      {/* Header with Collapsible Toggle and Stacked Subtitle */}
      <TouchableOpacity
        onPress={() => setIsCollapsed((prev) => !prev)}
        activeOpacity={0.7}
        className="flex-row items-center justify-between"
        accessibilityRole="button"
        accessibilityLabel={`Toggle ${cardTitle}`}
      >
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="sparkles" size={14} color={accentColor} />
            <Text className="text-text-primary dark:text-text-primary-dark font-baloo-bold text-sm" numberOfLines={1}>
              {cardTitle}
            </Text>
          </View>
          <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mt-0.5 ml-5" numberOfLines={1}>
            {cardSubtitle}
          </Text>
        </View>
        <View className="w-6 h-6 rounded-full bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark shrink-0">
          <Ionicons
            name={isCollapsed ? 'chevron-down' : 'chevron-up'}
            size={12}
            color={isDark ? '#94A3B8' : '#64748B'}
          />
        </View>
      </TouchableOpacity>

      {/* Insights List */}
      {!isCollapsed && (
        <View className="gap-2 mt-2.5">
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
                  <View className={`w-7 h-7 rounded-full ${itemBg} border items-center justify-center mr-3 mt-0.5 shadow-2xs shrink-0`}>
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
      )}
    </SurfaceCard>
  );
}
