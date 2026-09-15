import React from 'react';
import { TouchableOpacity, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

interface Props {
  label: string;
  description?: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
}

const GoalCard: React.FC<Props> = ({ label, description, icon, selected, onPress }) => {
  const { colors, isDark } = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`py-5 px-4 rounded-2xl items-center justify-center w-[48%] border relative ${
        selected
          ? 'bg-accent/10 dark:bg-accent-dark/15 border-accent dark:border-accent-dark'
          : 'bg-surface dark:bg-surface-dark border-input-border dark:border-input-border-dark'
      }`}
      style={Platform.select({
        web: {
          boxShadow: selected
            ? '0 2px 8px rgba(13, 122, 87, 0.15)'
            : '0 1px 3px rgba(0, 0, 0, 0.04)',
        } as any,
        default: {
          elevation: selected ? 2 : 1,
        },
      })}
    >
      {selected ? (
        <View className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent dark:bg-accent-dark items-center justify-center">
          <Ionicons name="checkmark" size={12} color={isDark ? colors.background : '#FFFFFF'} />
        </View>
      ) : null}

      {icon ? (
        <View className="w-10 h-10 rounded-xl bg-input dark:bg-input-dark items-center justify-center mb-2.5">
          <Text className="text-lg">{icon}</Text>
        </View>
      ) : null}

      <Text
        className={`font-bold text-sm text-center ${
          selected
            ? 'text-accent dark:text-accent-dark'
            : 'text-text-primary dark:text-text-primary-dark'
        }`}
      >
        {label}
      </Text>
      {description ? (
        <Text className="text-[11px] text-text-muted dark:text-text-muted-dark text-center mt-0.5">
          {description}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

export default GoalCard;