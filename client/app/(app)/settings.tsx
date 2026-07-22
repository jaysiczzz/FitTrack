import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import ScreenHeader from '@/components/layout/ScreenHeader';
import colors from '@/constants/colors';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScreenHeader />
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your FitTrack experience.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: colors.textMuted, fontSize: 14 },
});
