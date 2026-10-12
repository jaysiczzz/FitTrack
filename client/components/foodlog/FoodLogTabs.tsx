import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';

export type FoodLogTabType = 'today' | 'library' | 'history';

interface FoodLogTabsProps {
  activeTab: FoodLogTabType;
  onChange: (tab: FoodLogTabType) => void;
  historyCount?: number;
}

const FoodLogTabs: React.FC<FoodLogTabsProps> = ({ activeTab, onChange, historyCount }) => {
  const tabs: { id: FoodLogTabType; label: string; badge?: number }[] = [
    { id: 'today', label: "Today’s Log" },
    { id: 'library', label: 'Library' },
    { id: 'history', label: 'History', badge: historyCount },
  ];

  return (
    <View className="flex-row bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-2xl mb-3.5 p-1 w-full">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            onPress={() => onChange(tab.id)}
            className={`flex-1 min-h-[44px] py-2 px-2 items-center justify-center rounded-xl border flex-row active:opacity-75 ${
              isActive
                ? 'bg-surface dark:bg-surface-dark border-input-border/80 dark:border-input-border-dark/80'
                : 'bg-transparent border-transparent'
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
                  ? 'text-accent dark:text-accent-dark font-baloo-bold'
                  : 'text-text-muted dark:text-text-muted-dark font-baloo-medium'
              }`}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
            {Boolean(tab.badge && tab.badge > 0) && (
              <View className="ml-1.5 bg-accent/15 dark:bg-accent-dark/20 px-1.5 py-0.5 rounded-full border border-accent/30 dark:border-accent-dark/30">
                <Text className="text-[10px] text-accent dark:text-accent-dark font-baloo-bold">
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
