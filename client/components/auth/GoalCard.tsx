import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

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
      style={
        selected
          ? {
              shadowColor: '#00E5A0',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }
          : undefined
      }
    >
      {selected ? (
        <View className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-accent dark:bg-accent-dark items-center justify-center">
          <Text className="text-black text-[10px] font-bold">✓</Text>
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