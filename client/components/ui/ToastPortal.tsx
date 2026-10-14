import React, { ReactNode } from 'react';
import { Modal } from 'react-native';

interface ToastPortalProps {
  children: ReactNode;
  visible: boolean;
}

/**
 * Native (iOS & Android) portal wrapping toast inside a transparent Modal
 * so it renders in the top-level native window layer above any other active modals.
 */
export default function ToastPortal({ children, visible }: ToastPortalProps) {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      {children}
    </Modal>
  );
}
