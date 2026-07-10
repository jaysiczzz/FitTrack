import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '@/constants/colors';

const AuthHeader: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to FitTrack</Text>
      <Text style={styles.subtitle}>Your intelligent fitness companion powered by AI</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 56,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
});

export default AuthHeader;
