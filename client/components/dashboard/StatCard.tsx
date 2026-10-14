import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

export type StatCardVariant = 'calories' | 'hydration' | 'workout' | 'streak';

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  variant?: StatCardVariant;
  onPress?: () => void;
}

export default function StatCard({
  title,
  value,
  subtitle,
  iconName,
  variant,
  onPress,
}: StatCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const Container = onPress ? TouchableOpacity : View;

  const getBadgeTheme = () => {
    let effectiveVariant = variant;
    if (!effectiveVariant) {
      if (iconName === 'restaurant' || iconName === 'nutrition') effectiveVariant = 'calories';
      else if (iconName === 'water') effectiveVariant = 'hydration';
      else if (iconName === 'barbell' || iconName === 'fitness') effectiveVariant = 'workout';
      else if (iconName === 'flame') effectiveVariant = 'streak';
    }

    switch (effectiveVariant) {
      case 'calories':
        return {
          icon: iconName || ('restaurant' as keyof typeof Ionicons.glyphMap),
          containerClass: 'bg-amber-500/10 dark:bg-amber-400/20 border-amber-500/25 dark:border-amber-400/40',
          iconColor: isDark ? '#FBBF24' : '#D97706',
        };
      case 'hydration':
        return {
          icon: iconName || ('water' as keyof typeof Ionicons.glyphMap),
          containerClass: 'bg-sky-500/10 dark:bg-sky-400/20 border-sky-500/25 dark:border-sky-400/40',
          iconColor: isDark ? '#38BDF8' : '#0284C7',
        };
      case 'workout':
        return {
          icon: iconName || ('barbell' as keyof typeof Ionicons.glyphMap),
          containerClass: 'bg-emerald-500/10 dark:bg-emerald-400/20 border-emerald-500/25 dark:border-emerald-400/40',
          iconColor: isDark ? '#34D399' : '#059669',
        };
      case 'streak':
        return {
          icon: iconName || ('flame' as keyof typeof Ionicons.glyphMap),
          containerClass: 'bg-rose-500/10 dark:bg-rose-400/20 border-rose-500/25 dark:border-rose-400/40',
          iconColor: isDark ? '#FB7185' : '#E11D48',
        };
      default:
        return iconName
          ? {
              icon: iconName,
              containerClass: 'bg-emerald-500/10 dark:bg-emerald-400/20 border-emerald-500/25 dark:border-emerald-400/40',
              iconColor: isDark ? '#34D399' : '#059669',
            }
          : null;
    }
  };

  const theme = getBadgeTheme();

  return (
    <Container
      activeOpacity={onPress ? 0.78 : 1}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${title}: ${value}, ${subtitle || ''}` : undefined}
      className={`flex-1 bg-surface dark:bg-surface-dark p-3.5 rounded-2xl border-0 shadow-md shadow-slate-200/70 dark:shadow-none justify-between min-h-[96px] ${
        onPress ? 'active:scale-[0.99]' : ''
      }`}
    >
      <View className="flex-row items-center justify-between mb-1.5">
        <Text
          className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold uppercase tracking-wider flex-1 mr-1.5"
          numberOfLines={1}
        >
          {title}
        </Text>
        {theme ? (
          <View className={`w-7 h-7 rounded-xl items-center justify-center border ${theme.containerClass}`}>
            <Ionicons name={theme.icon} size={13} color={theme.iconColor} />
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
