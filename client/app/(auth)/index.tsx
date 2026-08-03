import React, { useState } from 'react';
import { View, SafeAreaView, StyleSheet } from 'react-native';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthTabs from '@/components/auth/AuthTabs';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '@/api/auth';
import { useRegistration } from './_registrationContext';

export default function AuthIndex() {
  const [active, setActive] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const router = useRouter();
  const { setData } = useRegistration();

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      setError('');
      const res = await loginUser(data);
      await AsyncStorage.setItem('token', res.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.user));
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRegister = (data: { firstName: string; lastName: string; email: string; password: string }) => {
    setData(data);
    router.push('/(auth)/onboarding');
  };

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
  safe: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 24, paddingTop: 12, flex: 1, alignItems: 'center' },
});