import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Keyboard, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingForm from '@/components/auth/OnboardingForm';
import OnboardingHeader from '@/components/auth/OnboardingHeader';
import { useRouter } from 'expo-router';
import { registerUser } from '@/api/auth';
import { useRegistration } from '../../context/RegistrationContext';
import { useAuth } from '../../context/AuthContext';

export default function OnboardingScreen() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { data, clear } = useRegistration();
  const { login } = useAuth();

  // Listen for keyboard show/hide events
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

      clear();
      await login(res.token, res.user);
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: isKeyboardOpen ? 'flex-start' : 'center',
            paddingBottom: isKeyboardOpen ? (Platform.OS === 'ios' ? 160 : 180) : 32,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Pressable onPress={Keyboard.dismiss} className="flex-1 justify-center">
            <View className="px-6 py-4 w-full max-w-[440px] mx-auto">
              <OnboardingHeader compact={isKeyboardOpen} />
              {error ? (
                <View className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3">
                  <Text className="text-red-500 dark:text-red-400 text-xs font-semibold text-center">
                    {error}
                  </Text>
                </View>
              ) : null}
              <OnboardingForm onSubmit={handleCreate} loading={loading} />
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

