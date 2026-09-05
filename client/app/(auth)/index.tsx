import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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
  const router = useRouter();
  const { setData } = useRegistration();
  const { login, isAuthenticated } = useAuth();

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
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 py-6 w-full max-w-[440px] mx-auto">
            <AuthHeader />
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

