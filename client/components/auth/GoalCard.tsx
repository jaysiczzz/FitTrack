import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import colors from '@/constants/colors';

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
      style={[styles.card, selected && styles.selected]}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  selected: {
    backgroundColor: colors.input,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  icon: {
    fontSize: 20,
    marginBottom: 8,
  },
  label: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});

export default GoalCard;
