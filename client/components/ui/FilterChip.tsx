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

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`px-3 py-1.5 ${roundedClass} border ${
        selected
          ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent dark:border-accent-dark'
          : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
      } ${className}`}
      {...props}
    >
      <Text
        className={`text-xs ${
          selected
            ? 'text-accent dark:text-accent-dark font-bold'
            : 'text-text-muted dark:text-text-muted-dark font-medium'
        }`}
      >
        {icon ? `${icon} ` : ''}{label}{count !== undefined ? ` (${count})` : ''}
      </Text>
    </TouchableOpacity>
  );
}
