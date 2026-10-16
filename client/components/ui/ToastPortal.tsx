import React, { ReactNode } from 'react';
import { Modal } from 'react-native';

interface ToastPortalProps {
  children: ReactNode;
  visible: boolean;
}

/**
 * Native (iOS & Android) pass-through portal container.
 * Avoids wrapping in a native Modal window so that screen touches beneath
 * the toast pass cleanly through to the underlying app without blocking user interaction.
 */
export default function ToastPortal({ children, visible }: ToastPortalProps) {
  if (!visible) return null;
  return <>{children}</>;
}
