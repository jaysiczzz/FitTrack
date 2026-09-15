import React from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  icon?: string;
  onPress?: () => void;
}

export default function StatCard({
  title,
  value,
  subtitle,
  iconName,
  icon,
  onPress,
}: StatCardProps) {
  const { colors } = useThemeColors();
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className="flex-1 bg-surface dark:bg-surface-dark p-3.5 rounded-2xl border border-input-border dark:border-input-border-dark justify-between"
      style={Platform.select({
        web: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)' } as any,
        default: { elevation: 1 },
      })}
    >
      <View className="flex-row items-center mb-1">
        {iconName ? (
          <Ionicons
            name={iconName}
            size={13}
            color={colors.accent}
            style={{ marginRight: 4 }}
          />
        ) : null}
        <Text
          className="text-text-muted dark:text-text-muted-dark text-[11px] font-semibold uppercase tracking-wider flex-1"
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      <Text className="text-text-primary dark:text-text-primary-dark text-lg font-extrabold leading-6">
        {value}
      </Text>

      {subtitle ? (
        <Text
          className="text-text-muted dark:text-text-muted-dark mt-0.5 text-xs font-normal leading-snug"
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}
    </Container>
  );
}
