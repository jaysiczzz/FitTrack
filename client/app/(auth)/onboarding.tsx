import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { useRouter } from 'expo-router';
import OnboardingForm from '@/components/auth/OnboardingForm';
import OnboardingHeader from '@/components/auth/OnboardingHeader';

export default function OnboardingScreen() {
  const router = useRouter();
  const handleCreate = (data: { height: string; weight: string; age: string; goal: string }) => {
    console.log('Onboarding submitted:', data);
    router.replace('/dashboard');
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="p-6 flex-1">
        <OnboardingHeader />
        <OnboardingForm onSubmit={handleCreate} />
      </View>
    </SafeAreaView>
  );
}