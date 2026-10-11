import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

export default function StatCard({
  title,
  value,
  subtitle,
  iconName,
  onPress,
}: StatCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const Container = onPress ? TouchableOpacity : View;

  const getBadgeConfig = () => {
    switch (iconName) {
      case 'restaurant':
        return {
          container: 'bg-warning/15 border-warning/30',
          iconColor: isDark ? '#FBBF24' : '#B45309',
        };
      case 'flame':
        return {
          container: 'bg-rose-500/15 border-rose-500/30',
          iconColor: isDark ? '#F87171' : '#EF4444',
        };
      case 'water':
        return {
          container: 'bg-info/15 border-info/30',
          iconColor: isDark ? '#38BDF8' : '#0369A1',
        };
      case 'barbell':
        return {
          container: 'bg-accent/15 border-accent/30',
          iconColor: isDark ? '#10B981' : '#047857',
        };
      case 'sparkles':
      default:
        return {
          container: 'bg-success/15 border-success/30',
          iconColor: isDark ? '#10B981' : '#047857',
        };
    }
  };

  const badge = getBadgeConfig();

  return (
    <Container
      activeOpacity={onPress ? 0.78 : 1}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${title}: ${value}, ${subtitle || ''}` : undefined}
      className={`flex-1 bg-surface dark:bg-surface-dark p-3.5 rounded-2xl border-0 shadow-md shadow-slate-200/70 dark:shadow-none justify-between min-h-[100px] ${
        onPress ? 'active:scale-[0.99]' : ''
      }`}
    >
      <View className="flex-row items-center justify-between mb-1.5">
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
              size={14}
              color={badge.iconColor}
            />
          </View>
        ) : null}
      </View>

      <Text className="text-text-primary dark:text-text-primary-dark text-xl font-baloo-bold leading-6">
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
