import React from 'react';
import { TouchableOpacity, Text, ViewStyle } from 'react-native';

interface Props {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

const Button: React.FC<Props> = ({ title, onPress, disabled, style }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      className={`h-14 rounded-2xl items-center justify-center w-full ${
        disabled ? 'bg-input-border dark:bg-input-border-dark' : 'bg-accent dark:bg-accent-dark'
      }`}
      style={[
        {
          shadowColor: disabled ? '#00E5A0' : '#00E5A0',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: disabled ? 0.06 : 0.12,
          shadowRadius: 12,
          elevation: disabled ? 2 : 6,
        },
        style,
      ]}
    >
      <Text
        className={`font-bold text-base ${
          disabled ? 'text-text-muted dark:text-text-muted-dark' : 'text-black'
        }`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;