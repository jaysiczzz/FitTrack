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
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className={`w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-input dark:bg-input-dark items-center justify-center border border-input-border dark:border-input-border-dark active:opacity-60 ${className}`}
      {...props}
    >
      <Text className="text-text-primary dark:text-text-primary-dark text-base font-bold">✕</Text>
    </TouchableOpacity>
  );
}
