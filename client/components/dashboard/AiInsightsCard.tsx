import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIInsight } from '../../api/ai';
import { useThemeColors } from '../../constants/colors';
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
  const { colors } = useThemeColors();

  return (
    <SurfaceCard className="mb-3">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
            AI Insights
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs">
            Personalized recovery and progress feedback
          </Text>
        </View>

        <TouchableOpacity
          onPress={onRefresh}
          disabled={loading}
          activeOpacity={0.7}
          className="bg-input dark:bg-input-dark px-2.5 py-1 rounded-lg border border-input-border dark:border-input-border-dark flex-row items-center"
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <>
              <Ionicons name="refresh" size={14} color={colors.accent} style={{ marginRight: 4 }} />
              <Text className="text-accent dark:text-accent-dark text-xs font-semibold">
                Refresh
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Insights List */}
      <View className="gap-2">
        {insights.map((item, index) => (
          <View
            key={index}
            className="bg-input dark:bg-input-dark rounded-xl p-3 border border-input-border dark:border-input-border-dark"
          >
            <Text className="text-text-primary dark:text-text-primary-dark font-bold text-xs mb-1">
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
        ))}
      </View>
    </SurfaceCard>
  );
}
