import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/constants/colors';
import Button from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onActionPress?: () => void;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon = 'cube-outline',
  actionLabel,
  onActionPress,
  onAction,
  secondaryActionLabel,
  onSecondaryActionPress,
  children,
  className = '',
}: EmptyStateProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#94A3B8' : '#64748B';
  const handlePrimaryAction = onActionPress || onAction;

  return (
    <View
      className={`items-center justify-center p-6 rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark ${className}`}
    >
      <View className="w-14 h-14 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center mb-3">
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>

      <Text className="text-base font-baloo-bold text-text-primary dark:text-text-primary-dark text-center mb-1">
        {title}
      </Text>

      {description ? (
        <Text className="text-xs text-text-muted dark:text-text-muted-dark text-center max-w-xs leading-4 mb-4">
          {description}
        </Text>
      ) : null}

      {children}

      <View className="w-full flex-col gap-2 mt-2 max-w-xs">
        {actionLabel && handlePrimaryAction ? (
          <Button
            title={actionLabel}
            onPress={handlePrimaryAction}
            variant="primary"
            size="sm"
          />
        ) : null}

        {secondaryActionLabel && onSecondaryActionPress ? (
          <Button
            title={secondaryActionLabel}
            onPress={onSecondaryActionPress}
            variant="outline"
            size="sm"
          />
        ) : null}
      </View>
    </View>
  );
}
