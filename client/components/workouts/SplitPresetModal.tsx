import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { WeeklySplit } from './workoutTypes';
import { SPLIT_PRESETS, DAYS_OF_WEEK } from './plannerPresets';

interface SplitPresetModalProps {
  visible: boolean;
  onSelectPreset: (split: WeeklySplit) => void;
  onClose: () => void;
}

export default function SplitPresetModal({
  visible,
  onSelectPreset,
  onClose,
}: SplitPresetModalProps) {
  const { colors } = useThemeColors();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableWithoutFeedback>
            <View className="bg-background dark:bg-background-dark rounded-t-3xl p-5 max-h-[85%] border-t border-input-border dark:border-input-border-dark">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark tracking-tight">
                    Weekly Split Presets
                  </Text>
                  <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                    Choose a battle-tested training split structure
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-input dark:bg-input-dark items-center justify-center"
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
                {SPLIT_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      onSelectPreset(preset.split);
                      onClose();
                    }}
                    className="p-4 rounded-2xl mb-3 bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark"
                  >
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-base font-black text-text-primary dark:text-text-primary-dark">
                        {preset.name}
                      </Text>
                      <View className="bg-accent/15 dark:bg-accent-dark/25 px-2.5 py-0.5 rounded-full">
                        <Text className="text-[10px] font-bold text-accent dark:text-accent-dark uppercase">
                          Apply
                        </Text>
                      </View>
                    </View>

                    <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-3">
                      {preset.description}
                    </Text>

                    {/* Schedule Preview Bar */}
                    <View className="flex-row gap-1">
                      {DAYS_OF_WEEK.map((d) => {
                        const hasWorkout = Boolean(preset.split[d.key]);
                        return (
                          <View
                            key={d.key}
                            className={`flex-1 py-1.5 rounded-lg items-center border ${
                              hasWorkout
                                ? 'bg-accent/20 border-accent/40'
                                : 'bg-background/60 dark:bg-background-dark/60 border-input-border/40'
                            }`}
                          >
                            <Text
                              className={`text-[9px] font-bold ${
                                hasWorkout ? 'text-accent dark:text-accent-dark font-black' : 'text-text-muted/60'
                              }`}
                            >
                              {d.label}
                            </Text>
                            <View
                              className={`w-1.5 h-1.5 rounded-full mt-1 ${
                                hasWorkout ? 'bg-accent dark:bg-accent-dark' : 'bg-input-border'
                              }`}
                            />
                          </View>
                        );
                      })}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
