import React from 'react';
import { TouchableOpacity, Text, ViewStyle, ActivityIndicator, Platform } from 'react-native';
import { useThemeColors } from '@/constants/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

interface Props {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
  className?: string;
}

const Button: React.FC<Props> = ({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
  className = '',
}) => {
  const { colors, isDark } = useThemeColors();
  const isDisabled = disabled || loading;

  const getVariantStyles = () => {
    if (isDisabled) {
      return {
        container: 'bg-input dark:bg-input-dark border border-input-border/60 dark:border-input-border-dark/60 opacity-60',
        text: 'text-text-muted dark:text-text-muted-dark',
        spinner: colors.textMuted,
      };
    }

    switch (variant) {
      case 'secondary':
        return {
          container: 'bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-80',
          text: 'text-text-primary dark:text-text-primary-dark font-bold',
          spinner: colors.textPrimary,
        };
      case 'outline':
        return {
          container: 'bg-transparent border border-input-border dark:border-input-border-dark active:opacity-75',
          text: 'text-text-primary dark:text-text-primary-dark font-semibold',
          spinner: colors.textPrimary,
        };
      case 'danger':
        return {
          container: 'bg-danger active:opacity-90',
          text: 'text-white font-bold',
          spinner: '#FFFFFF',
        };
      case 'primary':
      default:
        return {
          container: 'bg-accent dark:bg-accent-dark active:opacity-90',
          text: 'text-white font-bold',
          spinner: '#FFFFFF',
        };
    }
  };

  const v = getVariantStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      className={`h-12 rounded-2xl items-center justify-center w-full px-4 ${v.container} ${className}`}
      style={style}
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} size="small" />
      ) : (
        <Text className={`text-sm tracking-wide ${v.text}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;