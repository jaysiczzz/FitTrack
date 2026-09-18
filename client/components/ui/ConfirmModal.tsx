import React from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  danger?: boolean; // alias for isDanger
  loading?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
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
  danger = false,
  loading = false,
  children,
  onConfirm,
  onCancel,
}) => {
  const { colors } = useThemeColors();
  const destructive = Boolean(isDanger || danger);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={!loading ? onCancel : undefined}
    >
      <Pressable
        className="flex-1 bg-black/70 justify-end"
        onPress={!loading ? onCancel : undefined}
      >
        <Pressable
          className="w-full max-w-[500px] self-center bg-surface dark:bg-surface-dark border-t border-input-border/70 dark:border-input-border-dark/70 rounded-t-[32px] px-6 pt-3 pb-8 items-center shadow-2xl"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Action Sheet Drag Indicator / Pull Bar */}
          <View className="w-10 h-1.5 rounded-full bg-input-border dark:bg-input-border-dark mb-4" />

          {/* Squircle Icon Badge (if provided) */}
          {iconName ? (
            <View
              className={`w-14 h-14 rounded-2xl items-center justify-center mb-3.5 ${
                destructive
                  ? 'bg-danger/10 border border-danger/25'
                  : 'bg-accent/10 dark:bg-accent-dark/15 border border-accent/25'
              }`}
            >
              <Ionicons
                name={iconName}
                size={26}
                color={destructive ? colors.danger : colors.accent}
              />
            </View>
          ) : icon ? (
            <View
              className={`w-14 h-14 rounded-2xl items-center justify-center mb-3.5 ${
                destructive
                  ? 'bg-danger/10 border border-danger/25'
                  : 'bg-accent/10 dark:bg-accent-dark/15 border border-accent/25'
              }`}
            >
              <Text className="text-2xl">{icon}</Text>
            </View>
          ) : null}

          {/* Title */}
          <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark mb-1.5 text-center tracking-tight">
            {title}
          </Text>

          {/* Description Message (if provided) */}
          {message ? (
            <Text className="text-xs text-text-muted dark:text-text-muted-dark text-center mb-5 leading-5 px-3 max-w-[360px]">
              {message}
            </Text>
          ) : null}

          {/* Custom Content Slot (if any) */}
          {children ? (
            <View className="w-full mb-4">
              {children}
            </View>
          ) : null}

          {/* Action Buttons (Thumb-friendly Stacked Pattern) */}
          <View className="w-full gap-y-2.5">
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={loading}
              onPress={onConfirm}
              className={`w-full h-12 rounded-2xl items-center justify-center shadow-xs ${
                destructive
                  ? 'bg-danger'
                  : 'bg-accent dark:bg-accent-dark'
              } ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="font-bold text-sm text-white">
                  {confirmText}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={loading}
              onPress={onCancel}
              className="w-full h-12 rounded-2xl bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark items-center justify-center"
            >
              <Text className="font-semibold text-text-primary dark:text-text-primary-dark text-sm">
                {cancelText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ConfirmModal;
