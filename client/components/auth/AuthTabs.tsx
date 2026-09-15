import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';

interface Props {
  active: 'login' | 'register';
  onChange: (s: 'login' | 'register') => void;
}

const AuthTabs: React.FC<Props> = ({ active, onChange }) => {
  return (
    <View className="flex-row bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-xl mb-4 p-1 w-full">
      <TouchableOpacity
        activeOpacity={0.8}
        accessibilityRole="tab"
        accessibilityState={{ selected: active === 'login' }}
        className={`flex-1 py-2 items-center justify-center rounded-lg ${
          active === 'login'
            ? 'bg-surface dark:bg-surface-dark border border-input-border/70 dark:border-input-border-dark/70'
            : ''
        }`}
        style={
          active === 'login'
            ? Platform.select({
                web: {
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                } as any,
                default: {
                  elevation: 1,
                },
              })
            : undefined
        }
        onPress={() => onChange('login')}
      >
        <Text
          className={`text-xs ${
            active === 'login'
              ? 'text-text-primary dark:text-text-primary-dark font-bold'
              : 'text-text-muted dark:text-text-muted-dark font-medium'
          }`}
        >
          Log In
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        accessibilityRole="tab"
        accessibilityState={{ selected: active === 'register' }}
        className={`flex-1 py-2 items-center justify-center rounded-lg ${
          active === 'register'
            ? 'bg-surface dark:bg-surface-dark border border-input-border/70 dark:border-input-border-dark/70'
            : ''
        }`}
        style={
          active === 'register'
            ? Platform.select({
                web: {
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                } as any,
                default: {
                  elevation: 1,
                },
              })
            : undefined
        }
        onPress={() => onChange('register')}
      >
        <Text
          className={`text-xs ${
            active === 'register'
              ? 'text-text-primary dark:text-text-primary-dark font-bold'
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