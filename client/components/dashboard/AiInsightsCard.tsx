import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { AIInsight } from '../../api/ai';

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
    <View
      className="bg-surface dark:bg-surface-dark rounded-[24px] p-5 mb-4 border border-input-border dark:border-input-border-dark"
      style={Platform.select({
        web: { boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)' } as any,
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 3,
        },
      })}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mr-2.5">
            <Text className="text-base">✨</Text>
          </View>
          <View>
            <Text className="text-text-primary dark:text-text-primary-dark font-extrabold text-sm">
              AI Insights & Predictions
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-[11px]">
              Personalized for your fitness progress
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onRefresh}
          disabled={loading}
          activeOpacity={0.7}
          className="bg-input dark:bg-input-dark px-3 py-1 rounded-xl border border-input-border/60"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#00E5A0" />
          ) : (
            <Text className="text-accent dark:text-accent-dark text-[11px] font-bold">
              Refresh ✨
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Insights List */}
      <View className="gap-2.5">
        {insights.map((item, index) => (
          <View
            key={index}
            className="bg-input/60 dark:bg-input-dark/60 rounded-2xl p-3.5 border border-input-border/40"
          >
            <Text className="text-accent dark:text-accent-dark font-extrabold text-xs mb-1.5">
              {item.title}
            </Text>
            {item.lines.map((line, lIdx) => (
              <Text
                key={lIdx}
                className="text-text-muted dark:text-text-muted-dark text-xs leading-4 mb-1 font-medium"
              >
                {line}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
