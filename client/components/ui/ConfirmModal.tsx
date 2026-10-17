import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/constants/colors';
import ModalErrorBanner from './ModalErrorBanner';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  error?: string | null;
  onErrorDismiss?: () => void;
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
  error,
  onErrorDismiss,
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
  const insets = useSafeAreaInsets();
  const destructive = Boolean(isDanger || danger);

  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Fast swipe down OR dragged down more than 50px
        if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 500,
            duration: 160,
            useNativeDriver: Platform.OS !== 'web',
          }).start(() => {
            if (!loading) {
              onCancel();
            }
          });
        } else if (Math.abs(gestureState.dy) < 5 && Math.abs(gestureState.dx) < 5) {
          // Direct tap on the grab pill also dismisses cleanly
          if (!loading) {
            onCancel();
          }
        } else {
          // Spring back up if threshold not reached
          Animated.spring(translateY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={!loading ? onCancel : undefined}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
        }}
        className="flex-1 justify-end md:justify-center p-0 md:p-6"
      >
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={!loading ? onCancel : undefined}
          accessible={false}
        />

        <Animated.View
          style={[
            { transform: [{ translateY }] },
            {
              width: '100%',
              maxWidth: 500,
              alignSelf: 'center',
              backgroundColor: colors.surface,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              paddingHorizontal: 24,
              paddingTop: 8,
              paddingBottom: Math.max(32, insets.bottom + 16),
              alignItems: 'center',
              maxHeight: '90%',
            },
          ]}
          className="w-full max-w-[500px] self-center bg-surface dark:bg-surface-dark border-t md:border border-input-border/70 dark:border-input-border-dark/70 rounded-t-[32px] md:rounded-[32px] px-6 pt-2 md:pt-6 items-center shadow-2xl max-h-[90%]"
        >
          {/* Action Sheet Drag Indicator / Pull Bar (Phone only) - Interactive Swipe & Tap Area */}
          <View
            {...panResponder.panHandlers}
            className="w-full items-center py-2.5 -mt-1 mb-2 md:hidden cursor-pointer"
            accessibilityRole="button"
            accessibilityLabel="Swipe down to dismiss"
          >
            <View
              style={{
                width: 40,
                height: 5,
                borderRadius: 9999,
                backgroundColor: colors.inputBorder,
              }}
            />
          </View>

          <ScrollView className="w-full" showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
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
          </ScrollView>

          {/* Inline Error Banner */}
          <ModalErrorBanner
            error={error}
            onDismiss={onErrorDismiss}
            className="w-full mb-3"
          />

          {/* Action Buttons (Thumb-friendly Stacked Pattern) */}
          <View className="w-full gap-y-2.5 mt-2">
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
                <ActivityIndicator size="small" color={destructive ? '#FFFFFF' : colors.accentContrast} />
              ) : (
                <Text className={`font-bold text-sm ${destructive ? 'text-white' : 'text-accent-contrast dark:text-accent-contrast-dark'}`}>
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
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ConfirmModal;
