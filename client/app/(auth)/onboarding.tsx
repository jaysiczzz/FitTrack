import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import OnboardingForm from '@/components/auth/OnboardingForm';
import OnboardingHeader from '@/components/auth/OnboardingHeader';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser } from '@/api/auth';
import { useRegistration } from './_registrationContext';

export default function OnboardingScreen() {
  const router = useRouter();
  const { data, clear } = useRegistration();

  const handleCreate = async (formData: { height: string; weight: string; age: string; goal: string }) => {
    if (!data) {
      router.replace('/(auth)');
      return;
    }

    try {
      const res = await registerUser({
        ...data,
        height: Number(formData.height),
        weight: Number(formData.weight),
        age: Number(formData.age),
        goal: formData.goal as 'MUSCLE_GAIN' | 'WEIGHT_LOSS',
      });

      await AsyncStorage.setItem('token', res.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.user));
      clear();
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error(err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <OnboardingHeader />
        <OnboardingForm onSubmit={handleCreate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, flex: 1 },
});