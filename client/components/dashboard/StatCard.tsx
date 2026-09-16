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

  const getBadgeConfig = () => {
    switch (iconName) {
      case 'flame':
        return {
          container: 'bg-orange-500/15 border-orange-500/30',
          iconColor: '#FB923C',
        };
      case 'water':
        return {
          container: 'bg-sky-500/15 border-sky-500/30',
          iconColor: '#38BDF8',
        };
      case 'barbell':
        return {
          container: 'bg-purple-500/15 border-purple-500/30',
          iconColor: '#A855F7',
        };
      case 'sparkles':
      default:
        return {
          container: 'bg-emerald-500/15 border-emerald-500/30',
          iconColor: '#10B981',
        };
    }
  };

  const badge = getBadgeConfig();

  return (
    <Container
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className="flex-1 bg-surface dark:bg-surface-dark p-4 rounded-2xl border border-input-border dark:border-input-border-dark justify-between"
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text
          className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold uppercase tracking-wider flex-1 mr-1"
          numberOfLines={1}
        >
          {title}
        </Text>
        {iconName ? (
          <View className={`w-7 h-7 rounded-full items-center justify-center border ${badge.container}`}>
            <Ionicons
              name={iconName}
              size={13}
              color={badge.iconColor}
            />
          </View>
        ) : null}
      </View>

      <Text className="text-text-primary dark:text-text-primary-dark text-xl font-black leading-6">
        {value}
      </Text>

      {subtitle ? (
        <Text
          className="text-text-muted dark:text-text-muted-dark mt-1 text-xs font-normal leading-snug"
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}
    </Container>
  );
}
