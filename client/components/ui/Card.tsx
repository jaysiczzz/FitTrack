import React from 'react';
import { View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';

export type CardVariant = 'default' | 'flat' | 'subtle' | 'elevated' | 'bordered';

export interface CardProps {
  children?: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  activeOpacity?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export default function Card({
  children,
  variant = 'default',
  onPress,
  activeOpacity = 0.85,
  className = '',
  style,
  accessibilityLabel,
  testID,
}: CardProps) {
  const variantClass = {
    default:
      'bg-surface dark:bg-surface-dark border-0 shadow-md shadow-slate-200/70 dark:shadow-none',
    elevated:
      'bg-surface dark:bg-surface-dark border-0 shadow-md shadow-slate-200/70 dark:shadow-none',
    bordered:
      'bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark shadow-sm',
    flat: 'bg-surface dark:bg-surface-dark border-transparent',
    subtle:
      'bg-input/60 dark:bg-input-dark/60 border border-input-border/60 dark:border-input-border-dark/60',
  }[variant];

  const baseClass = `rounded-2xl p-4 ${variantClass} ${className}`;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className={baseClass}
        style={style}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={baseClass} style={style} testID={testID}>
      {children}
    </View>
  );
}
