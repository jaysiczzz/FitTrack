import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';

export type WorkoutTabType = 'today' | 'planner' | 'library' | 'history';

interface WorkoutTabsProps {
  activeTab: WorkoutTabType;
  onChange: (tab: WorkoutTabType) => void;
  historyCount?: number;
}

const WorkoutTabs: React.FC<WorkoutTabsProps> = ({ activeTab, onChange }) => {
  const tabs: { id: WorkoutTabType; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'planner', label: 'Planner' },
    { id: 'library', label: 'Library' },
    { id: 'history', label: 'History' },
  ];

  return (
    <View className="flex-row bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-2xl mb-4 p-1 w-full">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.id)}
            className={`flex-1 py-2 px-1 items-center justify-center rounded-xl border flex-row ${
              isActive
                ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent/40 dark:border-accent-dark/40'
                : 'bg-transparent border-transparent'
            }`}
          >
            <Text
              className={`text-xs ${
                isActive
                  ? 'text-accent dark:text-accent-dark font-bold'
                  : 'text-text-muted dark:text-text-muted-dark font-semibold'
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

export default WorkoutTabs;
