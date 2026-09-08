import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Keyboard, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthTabs from '@/components/auth/AuthTabs';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { useRouter } from 'expo-router';
import { loginUser } from '@/api/auth';
import { useRegistration } from '../../context/RegistrationContext';
import { useAuth } from '../../context/AuthContext';

export default function AuthIndex() {
  const [active, setActive] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { setData } = useRegistration();
  const { login, isAuthenticated } = useAuth();

  // Listen for keyboard show/hide events to adapt layout dynamically
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardOpen(false));

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
      await login(res.token, res.user);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: isKeyboardOpen ? 'flex-start' : 'center',
            paddingBottom: isKeyboardOpen ? (Platform.OS === 'ios' ? 120 : 140) : 24,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Pressable onPress={Keyboard.dismiss} className="flex-1 justify-center">
            <View className="px-6 py-4 w-full max-w-[440px] mx-auto">
              <AuthHeader compact={isKeyboardOpen} />
              <AuthTabs active={active} onChange={handleTabChange} />

              {error ? (
                <View className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                  <Text className="text-red-500 dark:text-red-400 text-xs font-semibold text-center">
                    {error}
                  </Text>
                </View>
              ) : null}

              {active === 'login' ? (
                <LoginForm onSubmit={handleLogin} loading={loading} />
              ) : (
                <RegisterForm onSubmit={handleRegister} loading={loading} />
              )}
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

