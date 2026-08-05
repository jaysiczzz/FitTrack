import React from 'react';
import { TouchableOpacity, Text, ViewStyle } from 'react-native';

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
      className={`py-[18px] px-3 rounded-xl items-center justify-center w-[48%] border ${
        selected
          ? 'bg-input dark:bg-input-dark border-accent dark:border-accent-dark'
          : 'bg-surface dark:bg-surface-dark border-input-border dark:border-input-border-dark'
      }`}
      style={
        selected
          ? {
              shadowColor: '#00E5A0',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 4,
            }
          : undefined
      }
    >
      <Text className="text-xl mb-2">{icon}</Text>
      <Text className="text-text-primary dark:text-text-primary-dark font-bold">{label}</Text>
    </TouchableOpacity>
  );
};

export default GoalCard;