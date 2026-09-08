import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { AIInsight } from '../../api/ai';
import { COLORS } from '../../constants/colors';
import SurfaceCard from '../ui/SurfaceCard';

interface AiInsightsCardProps {
  insights: AIInsight[];
  loading: boolean;
  onRefresh: () => void;
}

export default function AiInsightsCard({
  insights,
  loading,
  onRefresh,
}: AiInsightsCardProps) {
  return (
    <SurfaceCard className="mb-3">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-2.5">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-7 h-7 rounded-lg bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mr-2">
            <Text className="text-xs">✨</Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm">
              AI Insights & Predictions
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px]">
              Tailored for your fitness progress
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onRefresh}
          disabled={loading}
          activeOpacity={0.7}
          className="bg-input dark:bg-input-dark px-2.5 py-1 rounded-lg border border-input-border/60 dark:border-input-border-dark/60"
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.accent.light} />
          ) : (
            <Text className="text-accent dark:text-accent-dark text-[10px] font-bold">
              Refresh ✨
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Insights List */}
      <View className="gap-2">
        {insights.map((item, index) => (
          <View
            key={index}
            className="bg-input/60 dark:bg-input-dark/60 rounded-xl p-3 border border-input-border/40 dark:border-input-border-dark/40"
          >
            <Text className="text-accent dark:text-accent-dark font-extrabold text-xs mb-1">
              {item.title}
            </Text>
            {item.lines.map((line, lIdx) => (
              <Text
                key={lIdx}
                className="text-text-muted dark:text-text-muted-dark text-[11px] leading-4 font-medium"
              >
                {line}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </SurfaceCard>
  );
}
