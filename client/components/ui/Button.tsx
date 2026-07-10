import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import colors from '@/constants/colors';

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
      style={[styles.button, disabled && styles.disabled, style]}
    >
      <Text style={[styles.text, disabled && styles.textDisabled]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  disabled: {
    backgroundColor: colors.inputBorder,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  text: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  textDisabled: {
    color: colors.textMuted,
  },
});

export default Button;
