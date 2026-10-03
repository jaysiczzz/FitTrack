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

    const isWarning = variant === 'warning';
    const activeBorderClass = isWarning
      ? 'bg-warning/15 dark:bg-warning-dark/20 border-warning dark:border-warning-dark'
      : 'bg-accent/15 dark:bg-accent-dark/20 border-accent dark:border-accent-dark';
    const activeTextClass = isWarning
      ? 'text-warning dark:text-warning-dark font-bold'
      : 'text-accent dark:text-accent-dark font-bold';

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        className={`min-h-[44px] px-3.5 py-2 justify-center items-center ${roundedClass} border ${
          selected
            ? activeBorderClass
            : 'bg-input dark:bg-input-dark border-input-border dark:border-input-border-dark'
        } ${className}`}
        {...props}
      >
        <Text
          className={`text-xs ${
            selected
              ? activeTextClass
              : 'text-text-muted dark:text-text-muted-dark font-medium'
          }`}
        >
          {icon ? `${icon} ` : ''}{label}{count !== undefined ? ` (${count})` : ''}
        </Text>
      </TouchableOpacity>
    );
}
