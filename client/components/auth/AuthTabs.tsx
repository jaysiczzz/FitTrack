import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

interface Props {
  active: 'login' | 'register';
  onChange: (s: 'login' | 'register') => void;
}

const AuthTabs: React.FC<Props> = ({ active, onChange }) => {
  return (
    <View className="flex-row bg-surface dark:bg-surface-dark border border-input-border/60 dark:border-input-border-dark/60 rounded-2xl mb-6 p-1.5 w-full">
      <TouchableOpacity
        activeOpacity={0.8}
        className={`flex-1 py-3 items-center justify-center rounded-xl ${
          active === 'login'
            ? 'bg-input dark:bg-input-dark border border-input-border/80 dark:border-input-border-dark/80'
            : ''
        }`}
        style={
          active === 'login'
            ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              }
            : undefined
        }
        onPress={() => onChange('login')}
      >
        <Text
          className={`font-bold text-sm ${
            active === 'login'
              ? 'text-text-primary dark:text-text-primary-dark'
              : 'text-text-muted dark:text-text-muted-dark font-medium'
          }`}
        >
          Log In
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        className={`flex-1 py-3 items-center justify-center rounded-xl ${
          active === 'register'
            ? 'bg-input dark:bg-input-dark border border-input-border/80 dark:border-input-border-dark/80'
            : ''
        }`}
        style={
          active === 'register'
            ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              }
            : undefined
        }
        onPress={() => onChange('register')}
      >
        <Text
          className={`font-bold text-sm ${
            active === 'register'
              ? 'text-text-primary dark:text-text-primary-dark'
              : 'text-text-muted dark:text-text-muted-dark font-medium'
          }`}
        >
          Register
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AuthTabs;