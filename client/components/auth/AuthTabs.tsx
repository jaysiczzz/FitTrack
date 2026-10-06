import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';

interface Props {
  active: 'login' | 'register';
  onChange: (s: 'login' | 'register') => void;
}

const AuthTabs: React.FC<Props> = ({ active, onChange }) => {
  const tabs: { id: 'login' | 'register'; label: string }[] = [
    { id: 'login', label: 'Log In' },
    { id: 'register', label: 'Register' },
  ];

  return (
    <View className="flex-row bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-2xl mb-3.5 p-1 w-full">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            onPress={() => onChange(tab.id)}
            className={`flex-1 min-h-[34px] py-1.5 px-2 items-center justify-center rounded-xl ${
              isActive
                ? 'bg-surface dark:bg-surface-dark border border-input-border/70 dark:border-input-border-dark/70'
                : 'border border-transparent'
            }`}
            style={
              isActive
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
          >
            <Text
              className={`text-xs ${
                isActive
                  ? 'text-text-primary dark:text-text-primary-dark font-bold'
                  : 'text-text-muted dark:text-text-muted-dark font-medium'
              }`}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default AuthTabs;