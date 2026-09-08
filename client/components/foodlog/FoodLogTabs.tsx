import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';

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
    <View className="flex-row bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark rounded-xl mb-3 p-1 w-full">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            onPress={() => onChange(tab.id)}
            className={`flex-1 py-2 px-2 items-center justify-center rounded-lg flex-row ${
              isActive
                ? 'bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark'
                : ''
            }`}
            style={
              isActive
                ? Platform.select({
                    web: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)' } as any,
                    default: { elevation: 1 },
                  })
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
