import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import colors from '@/constants/colors';

interface Props extends TextInputProps {
  label?: string;
}

const Input: React.FC<Props> = ({ label, style, ...rest }) => {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
        {...rest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 18,
  },
  label: {
    color: colors.textMuted,
    marginBottom: 6,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.input,
    borderColor: colors.inputBorder,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 18,
    color: colors.textPrimary,
    minHeight: 50,
  },
});

export default Input;
