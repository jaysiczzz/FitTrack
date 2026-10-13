import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { changePasswordApi } from '@/api/auth';
import ModalCloseButton from '../ui/ModalCloseButton';
import PasswordRequirements from '../ui/PasswordRequirements';
import Input from '../ui/Input';
import { validatePasswordStrength } from '@/utils/passwordValidation';
import { getFriendlyErrorMessage } from '@/utils/errorMapper';

interface ResetPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ResetPasswordModal({ visible, onClose }: ResetPasswordModalProps) {
  const { colors } = useThemeColors();
  const { showSuccess, showError } = useToast();
  const { logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPasswordError(null);
    setNewPasswordError(null);
    setConfirmPasswordError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setCurrentPasswordError(null);
    setNewPasswordError(null);
    setConfirmPasswordError(null);

    let hasError = false;

    if (!currentPassword) {
      setCurrentPasswordError('Please enter your current password.');
      hasError = true;
    }

    if (!newPassword) {
      setNewPasswordError('Please enter your new password.');
      hasError = true;
    } else {
      const pwdCheck = validatePasswordStrength(newPassword);
      if (!pwdCheck.valid) {
        setNewPasswordError(pwdCheck.error || 'New password does not meet security requirements.');
        hasError = true;
      } else if (newPassword === currentPassword) {
        setNewPasswordError('New password must be different from current password.');
        hasError = true;
      }
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your new password.');
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      await changePasswordApi({ currentPassword, newPassword });
      showSuccess(
        'Password Changed',
        'Your password has been changed. You have been logged out from all devices. Please log in with your new password.'
      );
      handleClose();
      await logout();
    } catch (err: any) {
      const errMsg = getFriendlyErrorMessage(err, 'Failed to update password. Please check your current password.');
      if (errMsg.toLowerCase().includes('current password')) {
        setCurrentPasswordError(errMsg);
      } else {
        setNewPasswordError(errMsg);
      }
      showError('Update Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        className="flex-1 justify-end md:justify-center md:items-center bg-black/50 p-0 md:p-4"
      >
        <Pressable className="flex-1" onPress={handleClose} />

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl md:rounded-3xl p-5 border-t md:border border-input-border dark:border-input-border-dark max-h-[90%] w-full md:max-w-md shadow-xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
            <View>
              <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark">
                Reset Password
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                Update account security credentials
              </Text>
            </View>
            <ModalCloseButton onClose={handleClose} />
          </View>

          <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
            {/* Security Notice: Logout from all devices */}
            <View className="mb-3.5 p-3 rounded-xl bg-accent/10 dark:bg-accent-dark/15 border border-accent/25 flex-row items-start gap-2">
              <Ionicons name="shield-checkmark" size={16} color={colors.accent} style={{ marginTop: 1 }} />
              <Text className="text-xs text-text-primary dark:text-text-primary-dark flex-1 leading-4">
                <Text className="font-bold">Security Notice:</Text> Changing your password will immediately log you out of all active devices and sessions.
              </Text>
            </View>
            {/* Current Password */}
            <Input
              label="Current Password"
              placeholder="Enter current password"
              value={currentPassword}
              onChangeText={(val) => {
                setCurrentPassword(val);
                if (currentPasswordError) setCurrentPasswordError(null);
              }}
              isPassword
              error={currentPasswordError || undefined}
              autoCapitalize="none"
            />

            {/* New Password */}
            <View className="mb-1">
              <Input
                label="New Password"
                placeholder="Min 8 chars, uppercase, number, symbol"
                value={newPassword}
                onChangeText={(val) => {
                  setNewPassword(val);
                  if (newPasswordError) setNewPasswordError(null);
                }}
                isPassword
                error={newPasswordError || undefined}
                autoCapitalize="none"
              />
              <PasswordRequirements password={newPassword} />
            </View>

            {/* Confirm New Password */}
            <Input
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChangeText={(val) => {
                setConfirmPassword(val);
                if (confirmPasswordError) setConfirmPasswordError(null);
              }}
              isPassword
              error={confirmPasswordError || undefined}
              autoCapitalize="none"
            />

            {/* Action Buttons */}
            <View className="flex-row items-center gap-2.5 mt-2 mb-4">
              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                className="flex-1 min-h-[48px] py-3.5 rounded-2xl border border-input-border dark:border-input-border-dark items-center justify-center bg-input dark:bg-input-dark"
              >
                <Text className="text-sm font-semibold text-text-muted dark:text-text-muted-dark">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className="flex-1 min-h-[48px] py-3.5 rounded-2xl bg-accent dark:bg-accent-dark items-center justify-center flex-row"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-sm font-bold text-white">
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
