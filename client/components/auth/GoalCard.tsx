import React from 'react';
import { TouchableOpacity, Text, View, Platform } from 'react-native';

interface Props {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
}

const GoalCard: React.FC<Props> = ({ label, icon, selected, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`py-4 px-3 rounded-2xl items-center justify-center w-[48%] border relative ${
        selected
          ? 'bg-accent/10 dark:bg-accent-dark/15 border-accent dark:border-accent-dark'
          : 'bg-surface dark:bg-surface-dark border-input-border/70 dark:border-input-border-dark/70'
      }`}
      style={Platform.select({
        web: {
          boxShadow: selected ? '0 4px 12px rgba(0, 229, 160, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
        } as any,
        default: {
          elevation: selected ? 2 : 1,
        },
      })}
    >
      {selected ? (
        <View className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-accent dark:bg-accent-dark items-center justify-center">
          <Text className="text-white dark:text-background-dark text-[10px] font-bold">✓</Text>
        </View>
      ) : null}
      <Text className="text-2xl mb-2">{icon}</Text>
      <Text
        className={`font-bold text-sm text-center ${
          selected
            ? 'text-accent dark:text-accent-dark'
            : 'text-text-primary dark:text-text-primary-dark'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default GoalCard;