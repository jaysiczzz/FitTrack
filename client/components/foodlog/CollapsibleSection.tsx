import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

interface CollapsibleSectionProps {
  title: string;
  badge?: string | number;
  initialExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function CollapsibleSection({
  title,
  badge,
  initialExpanded = true,
  children,
  className = '',
}: CollapsibleSectionProps) {
  const { colors } = useThemeColors();
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  return (
    <View
      className={`rounded-2xl bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark overflow-hidden mb-3 ${className}`}
    >
      <TouchableOpacity
        onPress={() => setIsExpanded((prev) => !prev)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={`${title}, ${isExpanded ? 'collapse' : 'expand'} section`}
        className="flex-row items-center justify-between px-4 py-3 min-h-[44px]"
      >
        <View className="flex-row items-center gap-2 flex-1 pr-2">
          <Text
            numberOfLines={1}
            className="text-xs font-black text-text-primary dark:text-text-primary-dark uppercase tracking-wider"
          >
            {title}
          </Text>
          {badge !== undefined && (
            <View className="px-2 py-0.5 rounded-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark">
              <Text className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark">
                {badge}
              </Text>
            </View>
          )}
        </View>

        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View className="px-4 pb-3.5 pt-1 border-t border-input-border/50 dark:border-input-border-dark/50">
          {children}
        </View>
      )}
    </View>
  );
}
