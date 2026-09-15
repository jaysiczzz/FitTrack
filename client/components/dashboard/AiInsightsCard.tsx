import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
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
  const router = useRouter();
  const { colors } = useThemeColors();

  return (
    <SurfaceCard className="mb-3">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
            AI Insights & Coach
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs">
            Personalized recovery, predictions and advice
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

      {/* Chat with AI Coach Action Button */}
      <TouchableOpacity
        onPress={() => router.push('/(screen)/ai-coach' as any)}
        activeOpacity={0.8}
        className="mt-3 bg-accent/10 dark:bg-accent-dark/15 border border-accent/30 dark:border-accent-dark/30 p-3 rounded-xl flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1 pr-2">
          <View className="w-8 h-8 rounded-full bg-accent/20 dark:bg-accent-dark/25 items-center justify-center mr-2.5 border border-accent/30 dark:border-accent-dark/30">
            <Ionicons name="sparkles" size={16} color={colors.accent} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-text-primary dark:text-text-primary-dark font-black text-xs">
                Chat with FitTrack Coach
              </Text>
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </View>
            <Text className="text-text-muted dark:text-text-muted-dark text-[10px] leading-3 mt-0.5">
              Ask about your meal plan, breaking plateaus, or workout tweaks
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.accent} />
      </TouchableOpacity>
    </SurfaceCard>
  );
}
