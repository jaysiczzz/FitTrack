import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useColorScheme } from 'nativewind';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  unit?: string;
}

const Input: React.FC<Props> = ({ label, error, unit, style, className = '', onFocus, onBlur, ...rest }) => {
  const { colorScheme } = useColorScheme();
  const placeholderColor = colorScheme === 'dark' ? '#8A93A6' : '#5C6478';
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="w-full mb-[18px]">
      {label ? (
        <Text className="text-text-muted dark:text-text-muted-dark mb-1.5 text-[11px] tracking-wide uppercase font-semibold">
          {label}
        </Text>
      ) : null}
      <View className="relative w-full flex-row items-center">
        <TextInput
          className={`flex-1 bg-input dark:bg-input-dark border ${
            error
              ? 'border-red-500 dark:border-red-500'
              : isFocused
              ? 'border-accent dark:border-accent-dark'
              : 'border-input-border dark:border-input-border-dark'
          } px-4 py-3.5 rounded-[18px] text-text-primary dark:text-text-primary-dark min-h-[52px] ${className}`}
          placeholderTextColor={placeholderColor}
          style={style}
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          {...rest}
        />
        {unit ? (
          <View className="absolute right-3 bg-surface/80 dark:bg-surface-dark/80 px-2.5 py-1 rounded-lg border border-input-border/50 dark:border-input-border-dark/50 pointer-events-none">
            <Text className="text-text-muted dark:text-text-muted-dark text-xs font-bold uppercase">{unit}</Text>
          </View>
        ) : null}
      </View>
      {error ? (
        <Text className="text-red-500 text-xs mt-1 font-medium">{error}</Text>
      ) : null}
    </View>
  );
};

export default Input;