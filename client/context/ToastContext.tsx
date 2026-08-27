import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import NotificationToast, { NotificationType } from '../components/ui/NotificationToast';

export interface ToastOptions {
  message: string;
  description?: string;
  type?: NotificationType;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
  bottomOffset?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions | string) => void;
  hideToast: () => void;
  showSuccess: (message: string, description?: string, actionLabel?: string, onAction?: () => void) => void;
  showError: (message: string, description?: string) => void;
  showInfo: (message: string, description?: string) => void;
  showWarning: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toastState, setToastState] = useState<{
    visible: boolean;
    message: string;
    description?: string;
    type: NotificationType;
    icon?: string;
    actionLabel?: string;
    onAction?: () => void;
    duration?: number;
    bottomOffset?: number;
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = useCallback((options: ToastOptions | string) => {
    if (typeof options === 'string') {
      setToastState({
        visible: true,
        message: options,
        type: 'success',
      });
    } else {
      setToastState({
        visible: true,
        message: options.message,
        description: options.description,
        type: options.type || 'success',
        icon: options.icon,
        actionLabel: options.actionLabel,
        onAction: options.onAction,
        duration: options.duration ?? 4000,
        bottomOffset: options.bottomOffset ?? 24,
      });
    }
  }, []);

  const hideToast = useCallback(() => {
    setToastState((prev) => ({ ...prev, visible: false }));
  }, []);

  const showSuccess = useCallback((message: string, description?: string, actionLabel?: string, onAction?: () => void) => {
    showToast({
      message,
      description,
      type: 'success',
      actionLabel,
      onAction,
    });
  }, [showToast]);

  const showError = useCallback((message: string, description?: string) => {
    showToast({
      message,
      description,
      type: 'error',
    });
  }, [showToast]);

  const showInfo = useCallback((message: string, description?: string) => {
    showToast({
      message,
      description,
      type: 'info',
    });
  }, [showToast]);

  const showWarning = useCallback((message: string, description?: string) => {
    showToast({
      message,
      description,
      type: 'warning',
    });
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        hideToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
    >
      {children}
      <NotificationToast
        visible={toastState.visible}
        message={toastState.message}
        description={toastState.description}
        type={toastState.type}
        icon={toastState.icon}
        actionLabel={toastState.actionLabel}
        onAction={toastState.onAction}
        onDismiss={hideToast}
        duration={toastState.duration}
        bottomOffset={toastState.bottomOffset}
      />
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
