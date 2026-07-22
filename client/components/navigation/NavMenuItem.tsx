import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import colors from '@/constants/colors';

interface Props {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  danger?: boolean;
}

const NavMenuItem: React.FC<Props> = ({ label, icon, onPress, danger }) => {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[styles.label, danger && styles.dangerLabel]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 22,
    alignItems: 'center',
    marginRight: 12,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  dangerLabel: {
    color: colors.danger,
  },
});

export default NavMenuItem;
