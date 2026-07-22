import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import ScreenHeader from '@/components/layout/ScreenHeader';
import colors from '@/constants/colors';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScreenHeader />

        <Text style={styles.greeting}>
          John Doe <Text style={styles.wave}>👋</Text>
        </Text>

        <View style={styles.streakCard}>
          <Text style={styles.streakLabel}>Current streak</Text>
          <Text style={styles.streakValue}>12 days</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Personal best!</Text>
          </View>
        </View>
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  greeting: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  wave: {
    fontSize: 26,
  },
  streakCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    padding: 20,
  },
  streakLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  streakValue: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 229, 160, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
});
