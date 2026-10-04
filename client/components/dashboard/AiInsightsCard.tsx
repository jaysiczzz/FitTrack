import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIInsight } from '../../api/ai';
import { useThemeColors } from '../../constants/colors';
import SurfaceCard from '../ui/SurfaceCard';

interface AiInsightsCardProps {
  insights: AIInsight[];
  loading: boolean;
  mode?: 'local' | 'gemini';
  hasGeminiInsights?: boolean;
  onRefresh: () => void;
  onToggleMode?: () => void;
}

export default function AiInsightsCard({
  insights,
  loading,
  mode = 'local',
  hasGeminiInsights = false,
  onRefresh,
  onToggleMode,
}: AiInsightsCardProps) {
  const { colors } = useThemeColors();
  const isGemini = mode === 'gemini';

  return (
    <SurfaceCard className="mb-3">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-1.5 flex-wrap">
            <Text className="text-text-primary dark:text-text-primary-dark font-bold text-sm">
              Daily AI Insights
            </Text>
            {isGemini ? (
              <View className="bg-purple-500/15 dark:bg-purple-500/25 border border-purple-500/30 dark:border-purple-500/40 px-1.5 py-0.5 rounded-md flex-row items-center gap-1">
                <Ionicons name="sparkles" size={10} color="#A855F7" />
                <Text className="text-[9px] font-black text-purple-700 dark:text-purple-300">
                  Gemini Deep AI
                </Text>
              </View>
            ) : (
              <View className="bg-accent/15 dark:bg-accent-dark/25 border border-accent/30 dark:border-accent-dark/40 px-1.5 py-0.5 rounded-md flex-row items-center gap-1">
                <Ionicons name="flash" size={10} color={colors.accent} />
                <Text className="text-[9px] font-black text-accent dark:text-accent-dark">
                  Live Dynamic
                </Text>
              </View>
            )}
          </View>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-0.5">
            {isGemini
              ? 'Multi-day periodization & recovery analysis'
              : 'Real-time coaching calculated from today’s sets & macros'}
          </Text>
        </View>

        {/* Action Controls */}
        <View className="flex-row items-center gap-1.5">
          {hasGeminiInsights && onToggleMode ? (
            <TouchableOpacity
              onPress={onToggleMode}
              activeOpacity={0.7}
              className="px-2 py-1 rounded-lg bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark min-h-[32px] justify-center"
            >
              <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark">
                {isGemini ? 'Live Tips' : 'Deep AI'}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={onRefresh}
            disabled={loading}
            activeOpacity={0.7}
            className="bg-accent/10 dark:bg-accent-dark/15 px-2.5 py-1 rounded-lg border border-accent/30 dark:border-accent-dark/35 flex-row items-center gap-1 min-h-[32px] justify-center"
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <>
                <Ionicons
                  name={isGemini ? 'refresh' : 'sparkles'}
                  size={12}
                  color={colors.accent}
                />
                <Text className="text-accent dark:text-accent-dark text-xs font-bold">
                  {isGemini ? 'Refresh' : 'Deep AI'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Insights List */}
      <View className="gap-2.5">
        {insights.map((item, index) => (
          <View
            key={index}
            className="bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl p-3.5 border border-emerald-500/25 dark:border-emerald-500/30 flex-row items-start"
          >
            <View className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/35 items-center justify-center mr-3 mt-0.5">
              <Ionicons
                name={isGemini ? 'sparkles' : index === 0 ? 'barbell-outline' : index === 1 ? 'nutrition-outline' : 'water-outline'}
                size={13}
                color={colors.accent}
              />
            </View>
            <View className="flex-1">
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
          </View>
        ))}
      </View>
    </SurfaceCard>
  );
}
