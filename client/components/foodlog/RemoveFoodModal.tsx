import React from 'react';
import { View, Text, Image } from 'react-native';
import { FoodLogItem, MEAL_LABELS, MEAL_ICONS } from './foodLogTypes';
import ConfirmModal from '../ui/ConfirmModal';

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
    <ConfirmModal
      visible={visible}
      title="Remove Food Item?"
      message="Are you sure you want to remove this meal from your daily log?"
      confirmText="Remove Food"
      cancelText="Cancel"
      isDanger
      iconName="trash-outline"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {/* Food Item Preview Card */}
      <View className="w-full bg-input/50 dark:bg-input-dark/50 rounded-2xl p-3 mb-2.5 border border-input-border dark:border-input-border-dark flex-row items-center">
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
      <View className="w-full bg-danger/10 dark:bg-danger-dark/15 rounded-xl py-2 px-3 border border-danger/20 flex-row items-center justify-center">
        <Text className="text-danger dark:text-danger-dark text-[11px] font-bold">
          📉 -{item.calories} kcal will be subtracted from today
        </Text>
      </View>
    </ConfirmModal>
  );
}
