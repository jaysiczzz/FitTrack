import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';

const StatCard: React.FC<{ title: string; value: string; subtitle?: string }> = ({ title, value, subtitle }) => (
  <View style={styles.statCard}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
    {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
  </View>
);

const ProgressBar: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <View style={styles.progressRow}>
    <Text style={styles.progressLabel}>{label}</Text>
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: value, backgroundColor: color }]} />
    </View>
  </View>
);

const BoostCard: React.FC<{ title: string; lines: string[] }> = ({ title, lines }) => (
  <View style={styles.boostCard}>
    <Text style={styles.boostTitle}>{title}</Text>
    {lines.map((l, i) => (
      <Text key={i} style={styles.boostLine}>{l}</Text>
    ))}
  </View>
);

export default function Dashboard() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.greeting}>Good morning, John Doe 👋</Text>
        <Text style={styles.sub}>Here's your health summary for today</Text>

        <View style={styles.statsRow}>
          <StatCard title="Calories Today" value="1,840 / 2,200" subtitle="↑ 83% of daily goal" />
          <StatCard title="Active Minutes" value="42 min" subtitle="↑ 8 from yesterday" />
        </View>

        <View style={styles.statsRow}>
          <StatCard title="Workouts This Week" value="4 / 5" subtitle="On track!" />
          <StatCard title="Current Streak" value="12 days" subtitle="Personal best!" />
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressCardTitle}>Daily Goal Progress</Text>
          <View style={styles.progressCircleRow}>
            <View style={styles.donutPlaceholder}>
              <Text style={styles.donutText}>76%\nComplete</Text>
            </View>
            <View style={styles.macroCols}>
              <ProgressBar label="Protein" value="60%" color="#00E5A0" />
              <ProgressBar label="Carbs" value="76%" color="#4BB4FF" />
              <ProgressBar label="Fats" value="40%" color="#A16BFF" />
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>AI Insights & Predictions</Text>
        <View style={styles.insightsList}>
          <BoostCard
            title="Trend prediction"
            lines={["Based on your trend, you'll reach your weight goal in ~3 weeks.", "Keep up the current activity to stay on track."]}
          />
          <BoostCard
            title="Meal timing"
            lines={["Your meal timing is inconsistent.", "Try having lunch between 12-1PM to optimize metabolism."]}
          />
          <BoostCard
            title="Recovery"
            lines={["You perform 31% better on workout days when you sleep 7+ hours.", "Prioritize rest tonight."]}
          />
        </View>

        <Text style={styles.sectionHeading}>Today's Boost</Text>
        <View style={styles.boostSection}>
          <View style={styles.leftBoost}>
            <Text style={styles.dailyLabel}>DAILY MOTIVATION</Text>
            <Text style={styles.quote}>“The only bad workout is the one that didn't happen.”</Text>
            <Text style={styles.quoteAuthor}>— Unknown</Text>
          </View>

          <View style={styles.rightBoost}>
            <Text style={styles.workoutTitle}>Today's Workout Goals</Text>
            <View style={styles.checkRow}><Text style={styles.check}>✔︎</Text><Text style={styles.checkText}>Morning warmup (10 min)</Text></View>
            <View style={styles.checkRow}><Text style={styles.check}>✔︎</Text><Text style={styles.checkText}>Chest & Triceps workout</Text></View>
            <View style={styles.checkRow}><Text style={styles.check}>✔︎</Text><Text style={styles.checkText}>30 min cardio session</Text></View>
            <View style={styles.checkRow}><Text style={styles.check}>○</Text><Text style={styles.checkText}>Post-workout stretch</Text></View>
            <View style={styles.checkRow}><Text style={styles.check}>○</Text><Text style={styles.checkText}>Log water intake (2L)</Text></View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#070D18' },
  container: { padding: 20, paddingBottom: 80 },
  greeting: { color: '#F7FBFF', fontSize: 24, fontWeight: '700' },
  sub: { color: '#8EA0B6', marginTop: 8, marginBottom: 16, fontSize: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  statCard: { flex: 1, backgroundColor: '#101C2C', padding: 18, borderRadius: 20, marginRight: 12, borderWidth: 1, borderColor: '#11314A' },
  statTitle: { color: '#7F97B0', fontSize: 12, marginBottom: 10 },
  statValue: { color: '#00E5A0', fontSize: 20, fontWeight: '700' },
  statSubtitle: { color: '#7F97B0', marginTop: 8, fontSize: 12 },
  progressCard: { backgroundColor: '#101C2C', borderRadius: 20, padding: 18, marginTop: 18, borderWidth: 1, borderColor: '#0F3150' },
  progressCardTitle: { color: '#E9F9FF', fontWeight: '700', marginBottom: 14, fontSize: 16 },
  progressCircleRow: { flexDirection: 'row', alignItems: 'center' },
  donutPlaceholder: { width: 104, height: 104, borderRadius: 52, backgroundColor: '#0B1626', alignItems: 'center', justifyContent: 'center', marginRight: 18, borderWidth: 1, borderColor: '#0F2B44' },
  donutText: { color: '#00E5A0', textAlign: 'center', fontWeight: '700', lineHeight: 24 },
  macroCols: { flex: 1 },
  progressRow: { marginBottom: 14 },
  progressLabel: { color: '#9BB0CA', marginBottom: 8, fontSize: 12 },
  progressTrack: { height: 8, backgroundColor: '#0C1C2F', borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: 8 },
  sectionHeading: { color: '#E9F9FF', marginTop: 22, marginBottom: 12, fontWeight: '700', fontSize: 16 },
  insightsList: { },
  boostCard: { backgroundColor: '#081219', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#0A2D4A' },
  boostTitle: { color: '#00E5A0', fontWeight: '600', marginBottom: 10, fontSize: 13 },
  boostLine: { color: '#9BB0CA', fontSize: 13, marginBottom: 8, lineHeight: 20 },
  boostSection: { backgroundColor: '#101C2C', borderRadius: 20, padding: 18, marginTop: 12, borderWidth: 1, borderColor: '#0F3355' },
  leftBoost: { marginBottom: 18 },
  dailyLabel: { color: '#00E5A0', fontSize: 12, marginBottom: 8, letterSpacing: 0.8 },
  quote: { color: '#F7FBFF', fontSize: 16, fontWeight: '600', lineHeight: 24 },
  quoteAuthor: { color: '#7F97B0', marginTop: 10 },
  rightBoost: { marginTop: 8 },
  workoutTitle: { color: '#F7FBFF', fontWeight: '700', marginBottom: 12, fontSize: 15 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  check: { color: '#00E5A0', marginRight: 10, fontSize: 14 },
  checkText: { color: '#9BB0CA', fontSize: 13, lineHeight: 20 },
});
