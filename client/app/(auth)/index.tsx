import React, { useState } from 'react';
import { View, SafeAreaView } from 'react-native';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthTabs from '@/components/auth/AuthTabs';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { useRouter } from 'expo-router';

export default function AuthIndex() {
  const [active, setActive] = useState<'login' | 'register'>('login');
  const router = useRouter();

  const handleLogin = (data: { email: string; password: string }) => {}

  const handleRegister = (data: { firstName: string; lastName: string; email: string; password: string }) => {
    router.replace('/(auth)/onboarding');
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-6 pt-3 flex-1 items-center">
        <AuthHeader />
        <AuthTabs active={active} onChange={setActive} />

        {active === 'login' ? (
          <LoginForm onSubmit={handleLogin} />
        ) : (
          <RegisterForm onSubmit={handleRegister} />
        )}
      </View>
    </SafeAreaView>
  );
}