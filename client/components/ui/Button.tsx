import React from 'react';
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';
import { useColorScheme } from '@/constants/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  textClassName?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  style,
  className = '',
  textClassName = '',
  accessibilityLabel,
  ...rest
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: {
      container: 'min-h-[44px] h-11 px-3.5 rounded-xl',
      text: 'text-xs font-baloo-bold',
      iconGap: 'gap-1.5',
    },
    md: {
      container: 'min-h-[48px] h-12 px-4 rounded-2xl',
      text: 'text-sm font-baloo-bold',
      iconGap: 'gap-2',
    },
    lg: {
      container: 'min-h-[56px] h-14 px-6 rounded-2xl',
      text: 'text-base font-baloo-bold',
      iconGap: 'gap-2.5',
    },
  }[size];

  const getVariantStyles = () => {
    if (isDisabled) {
      return {
        container:
          'bg-input dark:bg-input-dark border border-input-border/60 dark:border-input-border-dark/60 opacity-50',
        text: 'text-text-muted dark:text-text-muted-dark',
        spinnerColor: isDark ? '#94A3B8' : '#64748B',
      };
    }

    switch (variant) {
      case 'secondary':
        return {
          container:
            'bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark active:opacity-80 active:bg-input-border/30 dark:active:bg-input-border-dark/30',
          text: 'text-text-primary dark:text-text-primary-dark',
          spinnerColor: isDark ? '#F8FAFC' : '#0F172A',
        };
      case 'outline':
        return {
          container:
            'bg-transparent border border-input-border dark:border-input-border-dark active:opacity-75 active:bg-input/50 dark:active:bg-input-dark/50',
          text: 'text-text-primary dark:text-text-primary-dark font-baloo-semibold',
          spinnerColor: isDark ? '#F8FAFC' : '#0F172A',
        };
      case 'ghost':
        return {
          container:
            'bg-transparent border-transparent active:bg-input/50 dark:active:bg-input-dark/50',
          text: 'text-text-primary dark:text-text-primary-dark font-baloo-semibold',
          spinnerColor: isDark ? '#F8FAFC' : '#0F172A',
        };
      case 'danger':
        return {
          container: 'bg-danger dark:bg-danger-dark border border-transparent active:opacity-90',
          text: 'text-accent-contrast dark:text-accent-contrast-dark',
          spinnerColor: '#FFFFFF',
        };
      case 'primary':
      default:
        return {
          container:
            'bg-accent dark:bg-accent-dark border border-transparent active:opacity-90',
          text: 'text-accent-contrast dark:text-accent-contrast-dark',
          spinnerColor: isDark ? '#0B1120' : '#FFFFFF',
        };
    }
  };

  const v = getVariantStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof title === 'string' ? title : undefined)}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`flex-row items-center justify-center select-none ${sizeStyles.container} ${v.container} ${className}`}
      style={style}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.spinnerColor} size="small" />
      ) : (
        <View className={`flex-row items-center justify-center ${sizeStyles.iconGap}`}>
          {leftIcon}
          {title ? (
            <Text
              className={`tracking-wide text-center ${sizeStyles.text} ${v.text} ${textClassName}`}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : (
            children
          )}
          {rightIcon}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Button;