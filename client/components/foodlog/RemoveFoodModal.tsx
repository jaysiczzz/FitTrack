import React from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, Image, Platform } from 'react-native';
import { FoodLogItem, MEAL_LABELS, MEAL_ICONS } from './foodLogTypes';

interface RemoveFoodModalProps {
  visible: boolean;
  item: FoodLogItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RemoveFoodModal({
  visible,
  item,
  onConfirm,
  onCancel,
}: RemoveFoodModalProps) {
  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 bg-black/65 items-center justify-center p-5"
        onPress={onCancel}
      >
        <Pressable
          className="w-full max-w-[360px] bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark rounded-3xl p-6 items-center shadow-2xl"
          onPress={(e) => e.stopPropagation()}
          style={Platform.select({
            web: { boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)' } as any,
            default: { elevation: 16 },
          })}
        >
          {/* Danger Icon Badge */}
          <View className="w-14 h-14 rounded-2xl bg-danger/15 dark:bg-danger-dark/20 border border-danger/30 items-center justify-center mb-3.5">
            <Text className="text-2xl">🗑️</Text>
          </View>

          {/* Title & Explanation */}
          <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark mb-1 text-center">
            Remove Food Item?
          </Text>
          <Text className="text-xs text-text-muted dark:text-text-muted-dark text-center mb-4 leading-4">
            Are you sure you want to remove this meal from your daily log?
          </Text>

          {/* Food Item Preview Card */}
          <View className="w-full bg-input/50 dark:bg-input-dark/50 rounded-2xl p-3 mb-3 border border-input-border dark:border-input-border-dark flex-row items-center">
            {item.imageUri ? (
              <Image
                source={{ uri: item.imageUri }}
                className="w-11 h-11 rounded-xl mr-3 bg-black/10"
                resizeMode="cover"
              />
            ) : (
              <View className="w-11 h-11 rounded-xl mr-3 bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark items-center justify-center">
                <Text className="text-xl">{item.icon || '🥗'}</Text>
              </View>
            )}

            <View className="flex-1 mr-1">
              <Text
                className="text-text-primary dark:text-text-primary-dark font-extrabold text-xs"
                numberOfLines={1}
              >
                {item.title}
              </Text>

              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] mt-0.5">
                {item.calories} kcal · {item.protein}g Protein
              </Text>

              <View className="flex-row items-center gap-1 mt-1">
                <View className="bg-surface dark:bg-surface-dark px-1.5 py-0.5 rounded border border-input-border dark:border-input-border-dark">
                  <Text className="text-[9px] font-bold text-accent dark:text-accent-dark">
                    {MEAL_ICONS[item.mealType]} {MEAL_LABELS[item.mealType] || item.mealType}
                  </Text>
                </View>

                {Boolean(item.goalBadge) && (
                  <View className="bg-accent/15 dark:bg-accent-dark/20 px-1.5 py-0.5 rounded border border-accent/30">
                    <Text className="text-[8.5px] font-extrabold text-accent dark:text-accent-dark">
                      {item.goalBadge}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Calorie Deduction Notice */}
          <View
            className="w-full bg-danger/10 dark:bg-danger-dark/15 rounded-xl py-2.5 px-3 mb-4 border border-danger/20 flex-row items-center justify-center"
            style={{ marginBottom: 16 }}
          >
            <Text className="text-danger dark:text-danger-dark text-[11px] font-bold">
              📉 -{item.calories} kcal will be subtracted from today
            </Text>
          </View>

          {/* Action Buttons Row */}
          <View className="flex-row w-full gap-2.5 mt-0.5">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onCancel}
              className="flex-1 py-3 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
            >
              <Text className="font-bold text-text-primary dark:text-text-primary-dark text-xs">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onConfirm}
              className="flex-1 py-3 rounded-xl bg-danger dark:bg-danger-dark items-center justify-center shadow-xs"
            >
              <Text className="font-black text-white text-xs">
                Remove Food
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
