import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

interface DifficultySelectorPillProps {
  selectedDifficulty: string;
  onSelectDifficulty: (difficulty: string) => void;
  compact?: boolean;
}

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function DifficultySelectorPill({
  selectedDifficulty,
  onSelectDifficulty,
  compact = false,
}: DifficultySelectorPillProps) {
  const { colors } = useThemeColors();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const buttonRef = useRef<View>(null);
  const [buttonLayout, setButtonLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleOpen = () => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setButtonLayout({ x, y, width, height });
      setDropdownOpen(true);
    });
  };

  const handleSelect = (diff: string) => {
    onSelectDifficulty(diff);
    setDropdownOpen(false);
  };

  const windowWidth = Dimensions.get('window').width;

  const displayLabel = selectedDifficulty === 'All' ? 'All Levels' : selectedDifficulty;

  return (
    <>
      <TouchableOpacity
        ref={buttonRef}
        onPress={handleOpen}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        className={`flex-row items-center justify-center gap-1.5 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark min-h-[34px] ${
          compact ? 'px-2.5 py-1.5' : 'px-3.5 py-1.5'
        }`}
      >
        <Text
          numberOfLines={1}
          className="text-xs font-bold text-text-primary dark:text-text-primary-dark"
        >
          {displayLabel}
        </Text>
        <Ionicons
          name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
          size={12}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/30"
          onPress={() => setDropdownOpen(false)}
        >
          <Pressable
            style={{
              position: 'absolute',
              top: (buttonLayout?.y || 100) + (buttonLayout?.height || 34) + 6,
              right: Math.max(16, windowWidth - ((buttonLayout?.x || 0) + (buttonLayout?.width || 120))),
              width: 165,
            }}
            className="bg-surface dark:bg-surface-dark rounded-2xl p-2 border border-input-border dark:border-input-border-dark shadow-2xl"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between px-2 py-1 mb-1 border-b border-input-border/50 dark:border-input-border-dark/50">
              <Text className="text-[10px] font-black text-text-muted dark:text-text-muted-dark uppercase tracking-wider">
                Difficulty Level
              </Text>
              <Ionicons name="speedometer-outline" size={12} color={colors.textMuted} />
            </View>

            <View className="gap-1">
              {DIFFICULTIES.map((diff) => {
                const isSelected = selectedDifficulty === diff;
                return (
                  <TouchableOpacity
                    key={diff}
                    onPress={() => handleSelect(diff)}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    className={`flex-row items-center justify-between px-2.5 py-2 rounded-xl border ${
                      isSelected
                        ? 'bg-accent/15 dark:bg-accent-dark/20 border-accent/40 dark:border-accent-dark/40'
                        : 'bg-transparent border-transparent'
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        isSelected
                          ? 'text-accent dark:text-accent-dark font-extrabold'
                          : 'text-text-primary dark:text-text-primary-dark font-medium'
                      }`}
                    >
                      {diff}
                    </Text>

                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={colors.accent}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
