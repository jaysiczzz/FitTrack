import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

interface Props {
  active: 'login' | 'register';
  onChange: (s: 'login' | 'register') => void;
}

const AuthTabs: React.FC<Props> = ({ active, onChange }) => {
  return (
    <View className="flex-row bg-surface dark:bg-surface-dark rounded-2xl mb-[18px] p-1.5 self-center w-[62%]">
      <TouchableOpacity
        className={`py-3 px-[18px] items-center justify-center rounded-xl ${
          active === 'login' ? 'bg-input dark:bg-input-dark' : ''
        }`}
        style={
          active === 'login'
            ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }
            : undefined
        }
        onPress={() => onChange('login')}
      >
        <Text
          className={`font-semibold ${
            active === 'login'
              ? 'text-text-primary dark:text-text-primary-dark'
              : 'text-text-muted dark:text-text-muted-dark'
          }`}
        >
          Log In
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`py-3 px-[18px] items-center justify-center rounded-xl ${
          active === 'register' ? 'bg-input dark:bg-input-dark' : ''
        }`}
        style={
          active === 'register'
            ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }
            : undefined
        }
        onPress={() => onChange('register')}
      >
        <Text
          className={`font-semibold ${
            active === 'register'
              ? 'text-text-primary dark:text-text-primary-dark'
              : 'text-text-muted dark:text-text-muted-dark'
          }`}
        >
          Register
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AuthTabs;