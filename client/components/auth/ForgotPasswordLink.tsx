import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '@/constants/colors';

interface Props {
  onPress?: () => void;
}

const ForgotPasswordLink: React.FC<Props> = ({ onPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Forgot password? </Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.link}>Reset</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  text: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '400',
  },
  link: {
    color: colors.accent,
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default ForgotPasswordLink;
