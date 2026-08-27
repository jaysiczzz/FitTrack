import React from 'react';
import { View, Text, Platform } from 'react-native';

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
  accentColor?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  accentColor = '#00E5A0',
}: StatCardProps) {
  return (
    <View
      className="flex-1 bg-surface dark:bg-surface-dark p-4 rounded-[20px] border border-input-border dark:border-input-border-dark"
      style={Platform.select({
        web: { boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' } as any,
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        },
      })}
    >
      <View className="flex-row justify-between items-center mb-1.5">
        <Text className="text-text-muted dark:text-text-muted-dark text-[11px] font-bold uppercase tracking-wider" numberOfLines={1}>
          {title}
        </Text>
        {icon ? <Text className="text-sm">{icon}</Text> : null}
      </View>

      <Text className="text-text-primary dark:text-text-primary-dark text-lg font-black leading-6">
        {value}
      </Text>

      {subtitle ? (
        <Text className="text-text-muted dark:text-text-muted-dark mt-1 text-[11px] font-medium leading-4" numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
