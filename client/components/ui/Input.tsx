import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import FieldLabel from './FieldLabel';

export { FieldLabel };

interface Props extends TextInputProps {
  label?: string;
  labelClassName?: string;
  error?: string;
  unit?: string;
  isPassword?: boolean;
}

const Input = React.forwardRef<TextInput, Props>(
  (
    {
      label,
      labelClassName,
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
    const { colors, isDark } = useThemeColors();
    const placeholderColor = colors.textMuted;
    const defaultIconColor = colors.textMuted;
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordField = isPassword ?? Boolean(secureTextEntry);
    const shouldBeSecure = isPasswordField ? !showPassword : secureTextEntry;

    return (
      <View className="w-full mb-3">
        {label ? (
          <FieldLabel className={labelClassName}>
            {label}
          </FieldLabel>
        ) : null}
        <View
          className={`w-full flex-row items-center bg-input dark:bg-input-dark border rounded-xl min-h-[46px] px-3.5 ${
            error
              ? 'border-danger dark:border-danger-dark'
              : isFocused
              ? 'border-accent dark:border-accent-dark'
              : 'border-input-border dark:border-input-border-dark'
          }`}
        >
          <TextInput
            ref={ref}
            keyboardAppearance={isDark ? 'dark' : 'light'}
            className={`flex-1 min-w-0 text-text-primary dark:text-text-primary-dark text-sm py-2.5 ${className}`}
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
              className="shrink-0 ml-2 p-1 items-center justify-center rounded-lg"
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={isFocused ? colors.accent : defaultIconColor}
              />
            </TouchableOpacity>
          ) : unit ? (
            <Text
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
              className="shrink-0 ml-2 text-xs font-semibold text-text-muted dark:text-text-muted-dark uppercase select-none"
            >
              {unit}
            </Text>
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