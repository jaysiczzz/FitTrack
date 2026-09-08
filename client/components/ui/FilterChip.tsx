import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

export interface FilterChipProps extends TouchableOpacityProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  count?: number;
  icon?: string;
  variant?: 'accent' | 'warning';
  rounded?: 'full' | 'xl';
  className?: string;
}

export default function FilterChip({
  label,
  selected,
  onPress,
  count,
  icon,
  variant = 'accent',
  rounded = 'full',
  className = '',
  ...props
}: FilterChipProps) {
  const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-xl';

  const activeStyles =
    variant === 'warning'
      ? {
          container: 'bg-warning/15 dark:bg-warning/25 border-warning dark:border-warning-dark',
          text: 'text-warning dark:text-warning-dark',
        }
      : {
          container: 'bg-accent/15 dark:bg-accent-dark/20 border-accent dark:border-accent-dark',
          text: 'text-accent dark:text-accent-dark',
        };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`px-3.5 py-1.5 ${roundedClass} border ${
        selected
          ? activeStyles.container
          : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
      } ${className}`}
      {...props}
    >
      <Text
        className={`text-xs font-bold ${
          selected
            ? activeStyles.text
            : 'text-text-muted dark:text-text-muted-dark'
        }`}
      >
        {icon ? `${icon} ` : ''}{label}{count !== undefined ? ` (${count})` : ''}
      </Text>
    </TouchableOpacity>
  );
}
