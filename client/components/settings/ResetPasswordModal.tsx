import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { changePasswordApi } from '@/api/auth';
import ModalCloseButton from '../ui/ModalCloseButton';
import PasswordRequirements from '../ui/PasswordRequirements';
import { validatePasswordStrength } from '@/utils/passwordValidation';

interface ResetPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ResetPasswordModal({ visible, onClose }: ResetPasswordModalProps) {
  const { colors, isDark } = useThemeColors();
  const { showSuccess, showError } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setValidationError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setValidationError(null);

    if (!currentPassword) {
      setValidationError('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      setValidationError('Please enter your new password.');
      return;
    }
    const pwdCheck = validatePasswordStrength(newPassword);
    if (!pwdCheck.valid) {
      setValidationError(pwdCheck.error || 'New password does not meet security requirements.');
      return;
    }
    if (newPassword === currentPassword) {
      setValidationError('New password must be different from current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await changePasswordApi({ currentPassword, newPassword });
      showSuccess('Password Updated', 'Your password has been changed successfully.');
      handleClose();
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to update password. Please check your current password.';
      setValidationError(errMsg);
      showError('Update Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <Pressable className="flex-1" onPress={handleClose} />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl p-5 border-t border-input-border dark:border-input-border-dark max-h-[90%] shadow-xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
            <View>
              <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark">
                Reset Password
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Update your account password
              </Text>
            </View>
            <ModalCloseButton onClose={handleClose} />
          </View>

          <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
            {/* Validation Error Banner */}
            {validationError ? (
              <View className="mb-3.5 p-3 rounded-xl bg-danger/10 border border-danger/30 flex-row items-center">
                <Ionicons name="alert-circle" size={18} color={colors.danger} className="mr-2" />
                <Text className="text-xs font-semibold text-danger dark:text-danger-dark flex-1">
                  {validationError}
                </Text>
              </View>
            ) : null}

            {/* Current Password */}
            <View className="mb-3">
              <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark mb-1">
                Current Password
              </Text>
              <View className="flex-row items-center bg-input dark:bg-input-dark rounded-xl border border-input-border dark:border-input-border-dark px-3">
                <TextInput
                  secureTextEntry={!showCurrent}
                  value={currentPassword}
                  onChangeText={(val) => {
                    setCurrentPassword(val);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.textMuted}
                  className="flex-1 py-3 text-sm text-text-primary dark:text-text-primary-dark"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrent(!showCurrent)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View className="mb-3">
              <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark mb-1">
                New Password
              </Text>
              <View className="flex-row items-center bg-input dark:bg-input-dark rounded-xl border border-input-border dark:border-input-border-dark px-3">
                <TextInput
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={(val) => {
                    setNewPassword(val);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Min 8 chars, uppercase, number, symbol"
                  placeholderTextColor={colors.textMuted}
                  className="flex-1 py-3 text-sm text-text-primary dark:text-text-primary-dark"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowNew(!showNew)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showNew ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              <PasswordRequirements password={newPassword} />
            </View>

            {/* Confirm New Password */}
            <View className="mb-5">
              <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark mb-1">
                Confirm New Password
              </Text>
              <View className="flex-row items-center bg-input dark:bg-input-dark rounded-xl border border-input-border dark:border-input-border-dark px-3">
                <TextInput
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.textMuted}
                  className="flex-1 py-3 text-sm text-text-primary dark:text-text-primary-dark"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row items-center gap-2 mb-4">
              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                className="flex-1 py-3.5 rounded-xl border border-input-border dark:border-input-border-dark items-center justify-center bg-input dark:bg-input-dark"
              >
                <Text className="text-sm font-semibold text-text-muted dark:text-text-muted-dark">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className="flex-1 py-3.5 rounded-xl bg-accent dark:bg-accent-dark items-center justify-center flex-row shadow-sm"
              >
                {loading ? (
                  <ActivityIndicator size="small" color={isDark ? colors.background : '#FFFFFF'} />
                ) : (
                  <Text className="text-sm font-black text-background dark:text-background-dark">
                    Update Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
