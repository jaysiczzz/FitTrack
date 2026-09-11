import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  unit?: string;
  isPassword?: boolean;
}

const Input = React.forwardRef<TextInput, Props>(
  (
    {
      label,
      error,
      unit,
      isPassword,
      secureTextEntry,
      className = '',
      style,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const placeholderColor = isDark ? COLORS.textMuted.dark : COLORS.textMuted.light;
    const defaultIconColor = isDark ? COLORS.textMuted.dark : COLORS.textMuted.light;
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordField = isPassword ?? Boolean(secureTextEntry);
    const shouldBeSecure = isPasswordField ? !showPassword : secureTextEntry;

    return (
      <View className="w-full mb-3">
        {label ? (
          <Text className="text-text-muted dark:text-text-muted-dark mb-1 text-[11px] tracking-wide uppercase font-semibold">
            {label}
          </Text>
        ) : null}
        <View className="relative w-full flex-row items-center">
          <TextInput
            ref={ref}
            className={`flex-1 bg-input dark:bg-input-dark border ${
              error
                ? 'border-danger dark:border-danger-dark'
                : isFocused
                ? 'border-accent dark:border-accent-dark'
                : 'border-input-border dark:border-input-border-dark'
            } pl-3.5 ${isPasswordField || unit ? 'pr-11' : 'pr-3.5'} py-2.5 rounded-xl text-text-primary dark:text-text-primary-dark text-sm min-h-[46px] ${className}`}
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
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              accessibilityRole="button"
              className="absolute right-3 p-1 items-center justify-center rounded-lg"
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={19}
                color={isFocused ? (isDark ? COLORS.accent.dark : COLORS.accent.light) : defaultIconColor}
              />
            </TouchableOpacity>
          ) : unit ? (
            <View
              style={{ pointerEvents: 'none' } as any}
              className="absolute right-2.5 bg-surface/80 dark:bg-surface-dark/80 px-2 py-0.5 rounded-md border border-input-border/50 dark:border-input-border-dark/50"
            >
              <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-bold uppercase">{unit}</Text>
            </View>
          ) : null}
        </View>
        {error ? (
          <Text className="text-danger dark:text-danger-dark text-[11px] mt-0.5 font-medium">{error}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

export default Input;