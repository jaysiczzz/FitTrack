import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';

export type FoodLogTabType = 'today' | 'history';

interface FoodLogTabsProps {
  activeTab: FoodLogTabType;
  onChange: (tab: FoodLogTabType) => void;
  historyCount?: number;
}

const FoodLogTabs: React.FC<FoodLogTabsProps> = ({ activeTab, onChange, historyCount }) => {
  const tabs: { id: FoodLogTabType; label: string; badge?: number }[] = [
    { id: 'today', label: 'Today’s Log' },
    { id: 'history', label: 'History & Trends', badge: historyCount },
  ];

  return (
    <View className="flex-row bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-xl mb-3.5 p-1 w-full">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.id)}
            className={`flex-1 py-2 px-2 items-center justify-center rounded-lg flex-row ${
              isActive
                ? 'bg-surface dark:bg-surface-dark border border-input-border/70 dark:border-input-border-dark/70'
                : ''
            }`}
            style={
              isActive
                ? Platform.select({
                    web: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' } as any,
                    default: { elevation: 1 },
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
            >
              {tab.label}
            </Text>
            {Boolean(tab.badge && tab.badge > 0) && (
              <View className="ml-1.5 bg-input dark:bg-input-dark px-1.5 py-0.2 rounded-full">
                <Text className="text-[10px] text-text-muted dark:text-text-muted-dark font-bold">
                  {tab.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default FoodLogTabs;
