import React from 'react';
import { TouchableOpacity, Text, ViewStyle, ActivityIndicator, Platform } from 'react-native';
import { COLORS } from '@/constants/colors';

interface Props {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const Button: React.FC<Props> = ({ title, onPress, disabled, loading, style }) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={isDisabled}
      className={`h-12 rounded-xl items-center justify-center w-full ${
        isDisabled ? 'bg-input-border dark:bg-input-border-dark opacity-80' : 'bg-accent dark:bg-accent-dark'
      }`}
      style={[
        Platform.select({
          web: {
            boxShadow: isDisabled ? '0 2px 8px rgba(0, 229, 160, 0.06)' : '0 6px 16px rgba(0, 229, 160, 0.18)',
          } as any,
          default: {
            elevation: isDisabled ? 1 : 3,
          },
        }),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.textPrimary.light} size="small" />
      ) : (
        <Text
          className={`font-bold text-base ${
            isDisabled ? 'text-text-muted dark:text-text-muted-dark' : 'text-white dark:text-background-dark'
          }`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;