import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingForm from '@/components/auth/OnboardingForm';
import OnboardingHeader from '@/components/auth/OnboardingHeader';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser } from '@/api/auth';
import { useRegistration } from '../../context/RegistrationContext';

export default function OnboardingScreen() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data, clear } = useRegistration();

  const handleCreate = async (formData: { height: string; weight: string; age: string; goal: string }) => {
    if (!data) {
      router.replace('/(auth)');
      return;
    }

    if (loading) return;

    try {
      setError('');
      setLoading(true);

      let mappedGoal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS' = 'MUSCLE_GAIN';
      if (formData.goal === 'weight' || formData.goal === 'WEIGHT_LOSS') {
        mappedGoal = 'WEIGHT_LOSS';
      } else if (formData.goal === 'muscle' || formData.goal === 'MUSCLE_GAIN') {
        mappedGoal = 'MUSCLE_GAIN';
      }

      const res = await registerUser({
        ...data,
        height: Number(formData.height),
        weight: Number(formData.weight),
        age: Number(formData.age),
        goal: mappedGoal,
      });

      await AsyncStorage.setItem('token', res.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.user));
      clear();
      router.replace('/(screen)/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <OnboardingHeader />
            {error ? (
              <View className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3">
                <Text className="text-red-500 dark:text-red-400 text-xs font-semibold text-center">
                  {error}
                </Text>
              </View>
            ) : null}
            <OnboardingForm onSubmit={handleCreate} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

