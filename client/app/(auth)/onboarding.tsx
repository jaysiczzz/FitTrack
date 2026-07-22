import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import OnboardingForm from '@/components/auth/OnboardingForm';
import OnboardingHeader from '@/components/auth/OnboardingHeader';
import colors from '@/constants/colors';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleCreate = (data: { height: string; weight: string; age: string; goal: string }) => {
    router.replace('/(app)/dashboard');
  }

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
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 24,
    flex: 1,
  },
});
