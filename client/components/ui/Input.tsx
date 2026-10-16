import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import FieldLabel from './FieldLabel';

export { FieldLabel };

export interface InputProps extends TextInputProps {
  label?: string;
  labelClassName?: string;
  error?: string;
  helperText?: string;
  unit?: string;
  isPassword?: boolean;
  leftIcon?: React.ReactNode;
  rightAdornment?: React.ReactNode;
}

const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      label,
      labelClassName,
      error,
      helperText,
      unit,
      isPassword,
      leftIcon,
      rightAdornment,
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
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const inputRef = useRef<TextInput | null>(null);

    const setMergedRef = React.useCallback(
      (node: TextInput | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as any).current = node;
        }
      },
      [ref]
    );

    const isPasswordField = isPassword ?? Boolean(secureTextEntry);
    const shouldBeSecure = isPasswordField ? !showPassword : secureTextEntry;

    const placeholderColor = isDark ? '#94A3B8' : '#64748B';
    const eyeIconColor = isFocused
      ? isDark
        ? '#10B981'
        : '#047857'
      : isDark
      ? '#94A3B8'
      : '#64748B';

    return (
      <View className="w-full mb-3">
        {label ? (
          <Pressable
            onPress={() => inputRef.current?.focus()}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <FieldLabel className={labelClassName}>
              {label}
            </FieldLabel>
          </Pressable>
        ) : null}

        <View
          className={`w-full flex-row items-center bg-input dark:bg-input-dark border rounded-xl min-h-[48px] px-3.5 ${
            error
              ? 'border-danger dark:border-danger-dark'
              : isFocused
              ? 'border-accent dark:border-accent-dark ring-1 ring-accent/30'
              : 'border-input-border dark:border-input-border-dark'
          }`}
        >
          {leftIcon ? <View className="mr-2.5 shrink-0">{leftIcon}</View> : null}

          <TextInput
            ref={setMergedRef}
            keyboardAppearance={isDark ? 'dark' : 'light'}
            className={`flex-1 min-w-0 text-text-primary dark:text-text-primary-dark text-sm py-2.5 min-h-[44px] ${className}`}
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              accessibilityRole="button"
              className="w-10 h-10 items-center justify-center shrink-0 -mr-1 rounded-lg active:opacity-60"
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={eyeIconColor}
              />
            </TouchableOpacity>
          ) : unit ? (
            <Text
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
              className="shrink-0 ml-2 text-xs font-baloo-bold text-text-muted dark:text-text-muted-dark uppercase select-none"
            >
              {unit}
            </Text>
          ) : rightAdornment ? (
            <View className="shrink-0 ml-2">{rightAdornment}</View>
          ) : null}
        </View>

        {error ? (
          <Text
            accessibilityRole="alert"
            className="text-danger dark:text-danger-dark text-xs mt-1.5 font-baloo-medium px-0.5"
          >
            {error}
          </Text>
        ) : helperText ? (
          <Text className="text-text-muted dark:text-text-muted-dark text-xs mt-1 font-sans px-0.5">
            {helperText}
          </Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

export default Input;