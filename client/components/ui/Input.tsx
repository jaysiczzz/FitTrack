import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  unit?: string;
  isPassword?: boolean;
}

const Input: React.FC<Props> = ({
  label,
  error,
  unit,
  isPassword,
  secureTextEntry,
  style,
  className = '',
  onFocus,
  onBlur,
  ...rest
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const placeholderColor = isDark ? '#8A93A6' : '#5C6478';
  const defaultIconColor = isDark ? '#8A93A6' : '#6B7280';
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = isPassword ?? Boolean(secureTextEntry);
  const shouldBeSecure = isPasswordField ? !showPassword : secureTextEntry;

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
          } pl-4 ${isPasswordField || unit ? 'pr-12' : 'pr-4'} py-3.5 rounded-[18px] text-text-primary dark:text-text-primary-dark min-h-[52px] ${className}`}
          placeholderTextColor={placeholderColor}
          style={style}
          secureTextEntry={shouldBeSecure}
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
        {isPasswordField ? (
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            className="absolute right-3.5 p-1.5 items-center justify-center rounded-lg"
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={isFocused ? (isDark ? '#00E5A0' : '#00C484') : defaultIconColor}
            />
          </TouchableOpacity>
        ) : unit ? (
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