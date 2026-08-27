import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';

export type WorkoutTabType = 'today' | 'library' | 'history';

interface WorkoutTabsProps {
  activeTab: WorkoutTabType;
  onChange: (tab: WorkoutTabType) => void;
}

const WorkoutTabs: React.FC<WorkoutTabsProps> = ({ activeTab, onChange }) => {
  const tabs: { id: WorkoutTabType; label: string; icon: string }[] = [
    { id: 'today', label: 'Workouts', icon: '🏋️‍♂️' },
    { id: 'library', label: 'Library', icon: '📚' },
    { id: 'history', label: 'History', icon: '📅' },
  ];

  return (
    <View className="flex-row bg-surface dark:bg-surface-dark border border-input-border/60 dark:border-input-border-dark/60 rounded-2xl mb-4 p-1.5 w-full">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            onPress={() => onChange(tab.id)}
            className={`flex-1 py-2.5 px-1 items-center justify-center rounded-xl flex-row ${
              isActive
                ? 'bg-input dark:bg-input-dark border border-input-border/80 dark:border-input-border-dark/80'
                : ''
            }`}
            style={
              isActive
                ? Platform.select({
                    web: {
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    } as any,
                    default: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 3,
                    },
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
