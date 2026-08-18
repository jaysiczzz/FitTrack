import React from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable } from 'react-native';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
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
  icon = '🚪',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
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
          className="w-full max-w-[380px] bg-surface dark:bg-surface-dark border border-input-border/80 dark:border-input-border-dark/80 rounded-3xl p-6 items-center shadow-2xl"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon Badge */}
          <View
            className={`w-14 h-14 rounded-2xl items-center justify-center mb-4 ${
              isDanger
                ? 'bg-red-500/15 border border-red-500/30'
                : 'bg-accent/15 dark:bg-accent-dark/20 border border-accent/30'
            }`}
          >
            <Text className="text-2xl">{icon}</Text>
          </View>

          {/* Title & Message */}
          <Text className="text-xl font-extrabold text-text-primary dark:text-text-primary-dark mb-2 text-center">
            {title}
          </Text>
          <Text className="text-sm text-text-muted dark:text-text-muted-dark text-center mb-6 leading-5">
            {message}
          </Text>

          {/* Buttons Row */}
          <View className="flex-row w-full gap-x-3">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onCancel}
              className="flex-1 py-3.5 rounded-2xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
            >
              <Text className="font-semibold text-text-primary dark:text-text-primary-dark text-sm">
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onConfirm}
              className={`flex-1 py-3.5 rounded-2xl items-center justify-center shadow-md ${
                isDanger
                  ? 'bg-red-500'
                  : 'bg-accent dark:bg-accent-dark'
              }`}
            >
              <Text
                className={`font-bold text-sm ${
                  isDanger ? 'text-white' : 'text-black'
                }`}
              >
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
