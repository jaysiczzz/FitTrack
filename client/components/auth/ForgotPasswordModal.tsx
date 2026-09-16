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
import { forgotPasswordApi, resetPasswordWithCodeApi } from '@/api/auth';
import ModalCloseButton from '../ui/ModalCloseButton';
import PasswordRequirements from '../ui/PasswordRequirements';
import { validatePasswordStrength } from '@/utils/passwordValidation';

interface ForgotPasswordModalProps {
  visible: boolean;
  initialEmail?: string;
  onClose: () => void;
  onSuccess?: (email: string) => void;
}

export default function ForgotPasswordModal({
  visible,
  initialEmail = '',
  onClose,
  onSuccess,
}: ForgotPasswordModalProps) {
  const { colors, isDark } = useThemeColors();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initialEmail if prop changes
  React.useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const resetState = () => {
    setStep('email');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirm(false);
    setErrorMsg(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleRequestCode = async () => {
    setErrorMsg(null);
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordApi(trimmed);
      showSuccess('Code Sent', `We sent a 6-digit reset code to ${trimmed}`);
      setStep('reset');
    } catch (err: any) {
      const msg = err?.message || 'Failed to send reset code. Please check the email.';
      setErrorMsg(msg);
      showError('Request Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMsg(null);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (!trimmedCode || trimmedCode.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    if (!newPassword) {
      setErrorMsg('Please enter your new password.');
      return;
    }

    const pwdCheck = validatePasswordStrength(newPassword);
    if (!pwdCheck.valid) {
      setErrorMsg(pwdCheck.error || 'Password does not meet security requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithCodeApi({
        email: trimmedEmail,
        code: trimmedCode,
        newPassword,
      });

      showSuccess('Password Reset', 'Your password has been reset successfully! You can now log in.');
      if (onSuccess) onSuccess(trimmedEmail);
      handleClose();
    } catch (err: any) {
      const msg = err?.message || 'Failed to reset password. Please check your verification code.';
      setErrorMsg(msg);
      showError('Reset Failed', msg);
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

        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl p-5 border-t border-input-border dark:border-input-border-dark max-h-[92%] shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-input-border dark:border-input-border-dark">
            <View>
              <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark">
                {step === 'email' ? 'Forgot Password' : 'Reset Your Password'}
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mt-0.5">
                {step === 'email'
                  ? 'We will send a 6-digit reset code to your email'
                  : `Enter the code sent to ${email}`}
              </Text>
            </View>
            <ModalCloseButton onClose={handleClose} />
          </View>

          <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
            {/* Error Banner */}
            {errorMsg ? (
              <View className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/30 flex-row items-center">
                <Ionicons name="alert-circle" size={18} color={colors.danger} className="mr-2" />
                <Text className="text-xs font-semibold text-danger dark:text-danger-dark flex-1">
                  {errorMsg}
                </Text>
              </View>
            ) : null}

            {step === 'email' ? (
              /* STEP 1: Email Input */
              <View>
                <View className="mb-4">
                  <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark mb-1.5">
                    Account Email
                  </Text>
                  <View className="flex-row items-center bg-input dark:bg-input-dark rounded-xl border border-input-border dark:border-input-border-dark px-3">
                    <Ionicons name="mail-outline" size={18} color={colors.textMuted} className="mr-2" />
                    <TextInput
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      className="flex-1 py-3 text-sm text-text-primary dark:text-text-primary-dark"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleRequestCode}
                  disabled={loading}
                  className="py-3.5 rounded-2xl bg-accent dark:bg-accent-dark items-center justify-center flex-row mt-2 mb-4"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-sm font-bold text-white">
                      Send Verification Code
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* STEP 2: Enter Code & New Password */
              <View>
                {/* 6-Digit Code */}
                <View className="mb-3.5">
                  <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark mb-1.5">
                    6-Digit Verification Code
                  </Text>
                  <View className="flex-row items-center bg-input dark:bg-input-dark rounded-xl border border-input-border dark:border-input-border-dark px-3">
                    <Ionicons name="key-outline" size={18} color={colors.textMuted} className="mr-2" />
                    <TextInput
                      value={code}
                      onChangeText={(val) => {
                        setCode(val);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="123456"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={6}
                      className="flex-1 py-3 text-base font-bold tracking-widest text-text-primary dark:text-text-primary-dark"
                    />
                  </View>
                </View>

                {/* New Password */}
                <View className="mb-3">
                  <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark mb-1.5">
                    New Password
                  </Text>
                  <View className="flex-row items-center bg-input dark:bg-input-dark rounded-xl border border-input-border dark:border-input-border-dark px-3">
                    <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} className="mr-2" />
                    <TextInput
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={(val) => {
                        setNewPassword(val);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="Min 8 chars, uppercase, number, symbol"
                      placeholderTextColor={colors.textMuted}
                      className="flex-1 py-3 text-sm text-text-primary dark:text-text-primary-dark"
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                  <PasswordRequirements password={newPassword} />
                </View>

                {/* Confirm New Password */}
                <View className="mb-4">
                  <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark mb-1.5">
                    Confirm New Password
                  </Text>
                  <View className="flex-row items-center bg-input dark:bg-input-dark rounded-xl border border-input-border dark:border-input-border-dark px-3">
                    <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} className="mr-2" />
                    <TextInput
                      secureTextEntry={!showConfirm}
                      value={confirmPassword}
                      onChangeText={(val) => {
                        setConfirmPassword(val);
                        if (errorMsg) setErrorMsg(null);
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
                <View className="flex-row items-center gap-2 mb-3">
                  <TouchableOpacity
                    onPress={() => setStep('email')}
                    disabled={loading}
                    className="py-3.5 px-4 rounded-xl border border-input-border dark:border-input-border-dark items-center justify-center bg-input dark:bg-input-dark"
                  >
                    <Ionicons name="arrow-back" size={18} color={colors.textMuted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleResetPassword}
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-2xl bg-accent dark:bg-accent-dark items-center justify-center flex-row"
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="text-sm font-bold text-white">
                        Reset Password
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Resend Code Link */}
                <TouchableOpacity
                  onPress={handleRequestCode}
                  disabled={loading}
                  className="items-center py-2"
                >
                  <Text className="text-xs font-semibold text-accent dark:text-accent-dark">
                    Didn't get the code? Resend Code
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
