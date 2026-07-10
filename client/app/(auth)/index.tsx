import React, { useState } from 'react';
import { View, SafeAreaView, StyleSheet } from 'react-native';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthTabs from '@/components/auth/AuthTabs';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router';

export default function AuthIndex() {
  const [active, setActive] = useState<'login' | 'register'>('login');
  const router = useRouter();

  const handleLogin = (data: { email: string; password: string }) => {}

  const handleRegister = (data: { firstName: string; lastName: string; email: string; password: string }) => {
    router.replace('/(auth)/onboarding');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 12,
    flex: 1,
    alignItems: 'center',
  },
});
