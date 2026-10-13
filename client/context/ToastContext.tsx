import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NotificationToast, { NotificationType } from '../components/ui/NotificationToast';

export interface ToastOptions {
  message: string;
  description?: string;
  type?: NotificationType;
  icon?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
  topOffset?: number;
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
  const router = useRouter();
  const [toastState, setToastState] = useState<{
    visible: boolean;
    message: string;
    description?: string;
    type: NotificationType;
    icon?: string;
    iconName?: keyof typeof Ionicons.glyphMap;
    actionLabel?: string;
    onAction?: () => void;
    duration?: number;
    topOffset?: number;
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
        iconName: options.iconName,
        actionLabel: options.actionLabel,
        onAction: options.onAction,
        duration: options.duration ?? 2000,
        topOffset: options.topOffset,
        bottomOffset: options.bottomOffset ?? 24,
      });
    }
  }, []);

  const hideToast = useCallback(() => {
    setToastState((prev) => ({ ...prev, visible: false }));
  }, []);

  // Listen for global in-app notification toasts (e.g. when app is foregrounded)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('SHOW_NOTIFICATION_TOAST', (payload: any) => {
      if (payload && (payload.title || payload.message)) {
        showToast({
          message: payload.title || payload.message,
          description: payload.title ? payload.message : undefined,
          type: payload.type === 'error' ? 'error' : payload.type === 'warning' ? 'warning' : 'info',
          duration: 3500,
          actionLabel: payload.linkUrl ? 'View' : undefined,
          onAction: payload.linkUrl
            ? () => {
                hideToast();
                try {
                  router.push(payload.linkUrl);
                } catch (err) {
                  console.warn('[ToastContext] Navigation error:', err);
                }
              }
            : undefined,
        });
      }
    });

    return () => {
      sub.remove();
    };
  }, [showToast, hideToast, router]);

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
        iconName={toastState.iconName}
        actionLabel={toastState.actionLabel}
        onAction={toastState.onAction}
        onDismiss={hideToast}
        duration={toastState.duration}
        topOffset={toastState.topOffset}
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
