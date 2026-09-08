import React from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants/colors';

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
  accentColor?: string;
  onPress?: () => void;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  accentColor = COLORS.accent.dark,
  onPress,
}: StatCardProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      className="flex-1 bg-surface dark:bg-surface-dark p-3.5 rounded-2xl border border-input-border dark:border-input-border-dark justify-between"
      style={Platform.select({
        web: { boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)' } as any,
        default: { elevation: 1 },
      })}
    >
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center flex-1 mr-1">
          {icon ? (
            <View
              className="w-7 h-7 rounded-lg items-center justify-center mr-2"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Text className="text-xs">{icon}</Text>
            </View>
          ) : null}
          <Text
            className="text-text-muted dark:text-text-muted-dark text-[11px] font-bold uppercase tracking-wider flex-1"
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      </View>

      <Text className="text-text-primary dark:text-text-primary-dark text-lg font-black leading-6">
        {value}
      </Text>

      {subtitle ? (
        <Text
          className="text-text-muted dark:text-text-muted-dark mt-0.5 text-[11px] font-medium leading-snug"
        >
          {subtitle}
        </Text>
      ) : null}
    </Container>
  );
}
