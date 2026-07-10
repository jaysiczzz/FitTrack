import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '@/constants/colors';

interface Props {
  active: 'login' | 'register';
  onChange: (s: 'login' | 'register') => void;
}

const AuthTabs: React.FC<Props> = ({ active, onChange }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, active === 'login' && styles.activeTab]}
        onPress={() => onChange('login')}
      >
        <Text style={[styles.tabText, active === 'login' && styles.activeText]}>Log In</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, active === 'register' && styles.activeTab]}
        onPress={() => onChange('register')}
      >
        <Text style={[styles.tabText, active === 'register' && styles.activeText]}>Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 18,
    padding: 6,
    alignSelf: 'center',
    width: '62%',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: colors.input,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  activeText: {
    color: colors.textPrimary,
  },
});

export default AuthTabs;
