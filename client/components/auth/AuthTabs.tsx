import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';

interface Props {
  active: 'login' | 'register';
  onChange: (s: 'login' | 'register') => void;
}

const AuthTabs: React.FC<Props> = ({ active, onChange }) => {
  return (
    <View
      className="flex-row bg-surface dark:bg-surface-dark border border-input-border/60 dark:border-input-border-dark/60 rounded-xl mb-4 p-1 w-full"
      style={Platform.select({
        web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' } as any,
        default: { elevation: 1 },
      })}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        className={`flex-1 py-2 items-center justify-center rounded-lg ${
          active === 'login'
            ? 'bg-input dark:bg-input-dark border border-input-border/80 dark:border-input-border-dark/80'
            : ''
        }`}
        style={
          active === 'login'
            ? Platform.select({
                web: {
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                } as any,
                default: {
                  elevation: 2,
                },
              })
            : undefined
        }
        onPress={() => onChange('login')}
      >
        <Text
          className={`font-bold text-xs ${
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
        className={`flex-1 py-2 items-center justify-center rounded-lg ${
          active === 'register'
            ? 'bg-input dark:bg-input-dark border border-input-border/80 dark:border-input-border-dark/80'
            : ''
        }`}
        style={
          active === 'register'
            ? Platform.select({
                web: {
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                } as any,
                default: {
                  elevation: 2,
                },
              })
            : undefined
        }
        onPress={() => onChange('register')}
      >
        <Text
          className={`font-bold text-xs ${
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