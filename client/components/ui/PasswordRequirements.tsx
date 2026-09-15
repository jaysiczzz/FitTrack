import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { validatePasswordStrength } from '@/utils/passwordValidation';

interface PasswordRequirementsProps {
  password: string;
  showAlways?: boolean;
}

export default function PasswordRequirements({
  password,
  showAlways = false,
}: PasswordRequirementsProps) {
  const { colors } = useThemeColors();
  const { hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar } =
    validatePasswordStrength(password);

  if (!showAlways && password.length === 0) {
    return null;
  }

  const items = [
    { label: '8+ chars', met: hasMinLength },
    { label: 'Uppercase', met: hasUppercase },
    { label: 'Lowercase', met: hasLowercase },
    { label: 'Number', met: hasNumber },
    { label: 'Special symbol (!@#$)', met: hasSpecialChar },
  ];

  return (
    <View className="mt-1 mb-3.5 p-2.5 rounded-xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark">
      <Text className="text-[11px] font-bold text-text-muted dark:text-text-muted-dark mb-1.5">
        Security Requirements:
      </Text>
      <View className="flex-row flex-wrap gap-x-2.5 gap-y-1">
        {items.map((item, index) => (
          <View key={index} className="flex-row items-center">
            <Ionicons
              name={item.met ? 'checkmark-circle' : 'ellipse-outline'}
              size={13}
              color={item.met ? colors.accent : colors.textMuted}
            />
            <Text
              className={`text-[11px] ml-1 font-medium ${
                item.met
                  ? 'text-accent dark:text-accent-dark font-semibold'
                  : 'text-text-muted dark:text-text-muted-dark'
              }`}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
