import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthTabs from '@/components/auth/AuthTabs';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { loginUser } from '@/api/auth';
import { useRegistration } from '../../context/RegistrationContext';
import { useAuth } from '../../context/AuthContext';

export default function AuthIndex() {
  const { colors } = useThemeColors();
  const [active, setActive] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { setData } = useRegistration();
  const { login, isAuthenticated } = useAuth();

  // Listen for keyboard show/hide events to adapt layout dynamically (Android / Web)
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardOpen(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(screen)/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleTabChange = (tab: 'login' | 'register') => {
    setError('');
    setActive(tab);
  };

  const handleLogin = async (data: { email: string; password: string }) => {
    if (loading) return;
    try {
      setError('');
      setLoading(true);
      const res = await loginUser(data);
      await login(res.token, res.user, res.refreshToken);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (data: { firstName: string; lastName: string; email: string; password: string }) => {
    setError('');
    setData(data);
    router.push('/(auth)/onboarding');
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAvoidingView className="flex-1">
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingVertical: 16,
            paddingBottom: isKeyboardOpen ? 120 : 20,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View className="w-full max-w-[420px] mx-auto px-5">
            <AuthHeader compact={isKeyboardOpen} />
            <AuthTabs active={active} onChange={handleTabChange} />

            {error ? (
              <View className="w-full mb-3.5 p-3 rounded-xl bg-danger/10 border border-danger/30 flex-row items-center">
                <Ionicons name="alert-circle" size={18} color={colors.danger} className="mr-2" />
                <Text className="text-xs font-semibold text-danger dark:text-danger-dark flex-1">
                  {error}
                </Text>
              </View>
            ) : null}

            {active === 'login' ? (
              <LoginForm
                onSubmit={handleLogin}
                loading={loading}
                serverError={error}
                onError={(err) => setError(err)}
                onClearError={() => setError('')}
              />
            ) : (
              <RegisterForm
                onSubmit={handleRegister}
                loading={loading}
                onError={(err) => setError(err)}
                onClearError={() => setError('')}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

