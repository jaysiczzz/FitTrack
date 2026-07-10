import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';

const OnboardingHeader: React.FC = () => {
  const router = useRouter();
  const handleBack = () => {
    try {
      // Prefer using canGoBack if available (react-navigation / expo-router)
      // @ts-ignore
      if (typeof router.canGoBack === 'function' && router.canGoBack()) {
        router.back();
        return;
      }
    } catch (e) {
      // ignore and fallback
    }
    // Fallback: navigate to root route instead of attempting a back action
    if (typeof router.replace === 'function') router.replace('/');
  };
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleBack} style={styles.back}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Almost done!</Text>
      <Text style={styles.subtitle}>Just a few details to personalize your plan</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24, position: 'relative', paddingTop: 4 },
  back: { position: 'absolute', left: 0, top: 0, marginBottom: 0 },
  backIcon: { color: colors.textMuted, fontSize: 20 },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
});

export default OnboardingHeader;
