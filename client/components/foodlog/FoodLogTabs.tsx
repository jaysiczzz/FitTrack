import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

export type FoodLogTabType = 'today' | 'history';

interface FoodLogTabsProps {
  activeTab: FoodLogTabType;
  onChange: (tab: FoodLogTabType) => void;
  historyCount?: number;
}

const FoodLogTabs: React.FC<FoodLogTabsProps> = ({ activeTab, onChange, historyCount }) => {
  const tabs: { id: FoodLogTabType; label: string; icon: string; badge?: number }[] = [
    { id: 'today', label: 'Today’s Log', icon: '🥗' },
    { id: 'history', label: 'History & Trends', icon: '📅', badge: historyCount },
  ];

  return (
    <View className="flex-row bg-surface dark:bg-surface-dark border border-input-border/60 dark:border-input-border-dark/60 rounded-2xl mb-4 p-1.5 w-full shadow-xs">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            onPress={() => onChange(tab.id)}
            className={`flex-1 py-2.5 px-2 items-center justify-center rounded-xl flex-row ${
              isActive
                ? 'bg-input dark:bg-input-dark border border-input-border/80 dark:border-input-border-dark/80'
                : ''
            }`}
            style={
              isActive
                ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 3,
                  }
                : undefined
            }
          >
            <Text className="mr-1.5 text-xs">{tab.icon}</Text>
            <Text
              className={`font-bold text-xs ${
                isActive
                  ? 'text-accent dark:text-accent-dark'
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

export default FoodLogTabs;
