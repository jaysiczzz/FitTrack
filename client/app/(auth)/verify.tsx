import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useRegistration } from '@/context/RegistrationContext';
import { sendVerificationCodeApi, verifyEmailCodeApi } from '@/api/auth';
import Button from '@/components/ui/Button';
import { useResponsive } from '@/hooks/useResponsive';

export default function VerifyEmailScreen() {
  const { colors } = useThemeColors();
  const { isLandscape } = useResponsive();
  const router = useRouter();
  const { data, setVerified } = useRegistration();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [devCode, setDevCode] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);

  // If user lands here without registration data in context, redirect back to register
  useEffect(() => {
    if (!data?.email) {
      router.replace('/(auth)');
    }
  }, [data?.email, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-focus code input on mount
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(focusTimer);
  }, []);

  const handleVerify = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      setError('Verification code must be 6 numeric digits');
      return;
    }

    if (!data?.email) {
      setError('Session expired. Please restart registration.');
      return;
    }

    try {
      setError('');
      setSuccessMsg('');
      setLoading(true);

      await verifyEmailCodeApi({ email: data.email, code: trimmed });

      // Mark registration context as verified and proceed to Onboarding
      setVerified(true);
      router.replace('/(auth)/onboarding');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !data?.email) return;

    try {
      setError('');
      setSuccessMsg('');
      setResending(true);

      const res = await sendVerificationCodeApi({
        email: data.email,
        firstName: data.firstName,
      });

      if (res.devCode) {
        setDevCode(res.devCode);
      }

      setSuccessMsg('New verification code sent! Check your inbox.');
      setCooldown(60);
      setCode('');
      inputRef.current?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again in a moment.');
    } finally {
      setResending(false);
    }
  };

  const handleChangeEmail = () => {
    router.replace('/(auth)');
  };

  const codeDigits = code.padEnd(6, ' ').split('').slice(0, 6);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: isLandscape ? 'flex-start' : 'center',
            paddingVertical: 24,
            paddingHorizontal: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[420px] mx-auto">
            {/* Back to register link */}
            <TouchableOpacity
              onPress={handleChangeEmail}
              className="flex-row items-center mb-6 self-start px-2 py-1 -ml-2"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
              <Text className="text-sm font-semibold text-text-primary dark:text-text-primary-dark ml-1.5">
                Back
              </Text>
            </TouchableOpacity>

            {/* Email Icon Badge */}
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-3xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mb-4 border border-accent/20">
                <Ionicons name="mail-unread-outline" size={32} color={colors.accent} />
              </View>
              <Text className="text-2xl font-black text-text-primary dark:text-text-primary-dark text-center tracking-tight">
                Verify Your Email
              </Text>
              <Text className="text-xs text-text-muted dark:text-text-muted-dark text-center mt-1.5 max-w-[300px] leading-relaxed">
                We sent a 6-digit confirmation code to:
              </Text>

              {/* Target Email Chip with Change Action */}
              <View className="flex-row items-center bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-full px-3.5 py-1.5 mt-2.5">
                <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                  {data?.email || 'your email'}
                </Text>
                <TouchableOpacity
                  onPress={handleChangeEmail}
                  className="ml-2 pl-2 border-l border-input-border dark:border-input-border-dark"
                >
                  <Text className="text-[11px] font-bold text-accent dark:text-accent-dark">
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Hidden Underlying TextInput */}
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={(val) => {
                const clean = val.replace(/[^0-9]/g, '').slice(0, 6);
                setCode(clean);
                if (error) setError('');
                if (clean.length === 6) {
                  // Optional auto-submit when all 6 digits are typed
                  setError('');
                }
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
            />

            {/* 6-Digit Visual Display Boxes */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => inputRef.current?.focus()}
              className="flex-row justify-between mb-4 w-full"
            >
              {codeDigits.map((digit, index) => {
                const isCurrent = code.length === index;
                const isFilled = digit.trim().length > 0;
                const hasError = !!error;

                let borderClass = 'border-input-border dark:border-input-border-dark';
                let bgClass = 'bg-input dark:bg-input-dark';

                if (hasError) {
                  borderClass = 'border-danger dark:border-danger-dark';
                  bgClass = 'bg-danger/5 dark:bg-danger-dark/10';
                } else if (isCurrent) {
                  borderClass = 'border-accent dark:border-accent-dark';
                  bgClass = 'bg-accent/5 dark:bg-accent-dark/10';
                } else if (isFilled) {
                  borderClass = 'border-accent/40 dark:border-accent-dark/40';
                }

                return (
                  <View
                    key={index}
                    className={`w-[48px] h-[56px] rounded-2xl border-2 items-center justify-center ${borderClass} ${bgClass}`}
                  >
                    <Text className="text-2xl font-black text-text-primary dark:text-text-primary-dark">
                      {digit.trim()}
                    </Text>
                  </View>
                );
              })}
            </TouchableOpacity>

            {/* Inline Error Feedback */}
            {error ? (
              <View className="flex-row items-center bg-danger/10 dark:bg-danger-dark/15 border border-danger/30 rounded-xl px-3 py-2.5 mb-4">
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text className="text-xs font-semibold text-danger dark:text-danger-dark ml-2 flex-1">
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Success Feedback for Resend */}
            {successMsg ? (
              <View className="flex-row items-center bg-success/10 dark:bg-success-dark/15 border border-success/30 rounded-xl px-3 py-2.5 mb-4">
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text className="text-xs font-semibold text-success dark:text-success-dark ml-2 flex-1">
                  {successMsg}
                </Text>
              </View>
            ) : null}

            {/* Dev Mode Code Helper (visible in non-production environments) */}
            {devCode ? (
              <View className="bg-surface dark:bg-surface-dark border border-dashed border-accent/40 rounded-xl p-3 mb-4 items-center">
                <Text className="text-[11px] font-bold text-accent dark:text-accent-dark">
                  [DEV CODE]: {devCode}
                </Text>
              </View>
            ) : null}

            {/* Verify CTA Button */}
            <Button
              title="Verify & Continue"
              onPress={handleVerify}
              loading={loading}
              disabled={code.length !== 6 || loading}
              className="mb-4"
            />

            {/* Resend Code Section */}
            <View className="items-center mt-2">
              <Text className="text-xs text-text-muted dark:text-text-muted-dark mb-1">
                Didn't receive the email?
              </Text>
              {cooldown > 0 ? (
                <Text className="text-xs font-bold text-text-muted dark:text-text-muted-dark">
                  Resend code in {Math.floor(cooldown / 60)}:
                  {(cooldown % 60).toString().padStart(2, '0')}
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resending}
                  className="py-1 px-3"
                  activeOpacity={0.7}
                >
                  {resending ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Text className="text-xs font-bold text-accent dark:text-accent-dark">
                      Resend Code
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
