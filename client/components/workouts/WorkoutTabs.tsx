import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';

export type WorkoutTabType = 'today' | 'library' | 'history';

interface WorkoutTabsProps {
  activeTab: WorkoutTabType;
  onChange: (tab: WorkoutTabType) => void;
}

const WorkoutTabs: React.FC<WorkoutTabsProps> = ({ activeTab, onChange }) => {
  const tabs: { id: WorkoutTabType; label: string }[] = [
    { id: 'today', label: 'Today’s Routine' },
    { id: 'library', label: 'Library' },
    { id: 'history', label: 'History' },
  ];

  return (
    <View className="flex-row bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-xl mb-4 p-1 w-full">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.id)}
            className={`flex-1 py-2 px-1 items-center justify-center rounded-lg ${
              isActive
                ? 'bg-surface dark:bg-surface-dark border border-input-border/70 dark:border-input-border-dark/70'
                : ''
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

export default WorkoutTabs;
