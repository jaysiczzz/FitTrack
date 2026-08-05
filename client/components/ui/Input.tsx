import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useColorScheme } from 'nativewind';

interface Props extends TextInputProps {
  label?: string;
}

const Input: React.FC<Props> = ({ label, style, ...rest }) => {
  const { colorScheme } = useColorScheme();
  const placeholderColor = colorScheme === 'dark' ? '#8A93A6' : '#5C6478';

  return (
    <View className="w-full mb-[18px]">
      {label ? (
        <Text className="text-text-muted dark:text-text-muted-dark mb-1.5 text-[11px] tracking-wide uppercase font-semibold">
          {label}
        </Text>
      ) : null}
      <TextInput
        className="bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark px-4 py-4 rounded-[18px] text-text-primary dark:text-text-primary-dark min-h-[50px]"
        placeholderTextColor={placeholderColor}
        style={style}
        {...rest}
      />
    </View>
  );
};

export default Input;