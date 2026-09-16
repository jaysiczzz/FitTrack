import React from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  icon,
  iconName,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  const { colors } = useThemeColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 bg-black/60 items-center justify-center p-5"
        onPress={onCancel}
      >
        <Pressable
          className="w-full max-w-[380px] bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark rounded-2xl p-6 items-center shadow-xl"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon Badge (if provided) */}
          {iconName ? (
            <View
              className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${
                isDanger
                  ? 'bg-danger/10 border border-danger/20'
                  : 'bg-accent/10 dark:bg-accent-dark/15 border border-accent/20'
              }`}
            >
              <Ionicons
                name={iconName}
                size={24}
                color={isDanger ? colors.danger : colors.accent}
              />
            </View>
          ) : icon ? (
            <View
              className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${
                isDanger
                  ? 'bg-danger/10 border border-danger/20'
                  : 'bg-accent/10 dark:bg-accent-dark/15 border border-accent/20'
              }`}
            >
              <Text className="text-xl">{icon}</Text>
            </View>
          ) : null}

          {/* Title & Message */}
          <Text className="text-lg font-bold text-text-primary dark:text-text-primary-dark mb-1.5 text-center">
            {title}
          </Text>
          <Text className="text-sm text-text-muted dark:text-text-muted-dark text-center mb-5 leading-5">
            {message}
          </Text>

          {/* Action Buttons */}
          <View className="flex-row w-full gap-x-3">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onCancel}
              className="flex-1 h-11 rounded-xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
            >
              <Text className="font-semibold text-text-primary dark:text-text-primary-dark text-sm">
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onConfirm}
              className={`flex-1 h-11 rounded-2xl items-center justify-center ${
                isDanger
                  ? 'bg-danger'
                  : 'bg-accent dark:bg-accent-dark'
              }`}
            >
              <Text className="font-bold text-sm text-white">
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ConfirmModal;
