import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

export interface ModalErrorBannerProps {
  error: string | null | undefined;
  title?: string;
  onDismiss?: () => void;
  className?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export default function ModalErrorBanner({
  error,
  title,
  onDismiss,
  className = 'mb-3.5',
  iconName = 'alert-circle',
}: ModalErrorBannerProps) {
  const { colors } = useThemeColors();

  if (!error) return null;

  return (
    <View
      className={`p-3 rounded-2xl bg-danger/10 border border-danger/30 flex-row items-start ${className}`}
    >
      <Ionicons
        name={iconName}
        size={18}
        color={colors.danger}
        style={{ marginRight: 8, marginTop: 1 }}
      />
      <View className="flex-1 mr-1">
        {title ? (
          <Text className="text-xs font-bold text-danger dark:text-danger-dark mb-0.5 leading-tight">
            {title}
          </Text>
        ) : null}
        <Text className="text-xs font-semibold text-danger/90 dark:text-danger-dark/90 leading-tight">
          {error}
        </Text>
      </View>
      {onDismiss ? (
        <TouchableOpacity
          onPress={onDismiss}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-5 h-5 rounded-full items-center justify-center bg-danger/20 shrink-0 ml-1"
        >
          <Ionicons name="close" size={12} color={colors.danger} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
