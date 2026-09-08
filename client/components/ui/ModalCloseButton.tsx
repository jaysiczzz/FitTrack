import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

interface ModalCloseButtonProps extends TouchableOpacityProps {
  onClose: () => void;
  className?: string;
}

export default function ModalCloseButton({
  onClose,
  className = '',
  ...props
}: ModalCloseButtonProps) {
  return (
    <TouchableOpacity
      onPress={onClose}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Close"
      className={`w-8 h-8 rounded-full bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark ${className}`}
      {...props}
    >
      <Text className="text-text-primary dark:text-text-primary-dark text-sm font-bold">✕</Text>
    </TouchableOpacity>
  );
}
