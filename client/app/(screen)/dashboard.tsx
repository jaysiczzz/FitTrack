import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
};

const StatCard = ({ title, value, subtitle }: StatCardProps) => (
  <View className="flex-1 bg-surface dark:bg-surface-dark p-[18px] rounded-[20px] mr-3 border border-input-border dark:border-input-border-dark">
    <Text className="text-text-muted dark:text-text-muted-dark text-xs mb-2.5">{title}</Text>
    <Text className="text-accent dark:text-accent-dark text-xl font-bold">{value}</Text>
    {subtitle ? (
      <Text className="text-text-muted dark:text-text-muted-dark mt-2 text-xs">{subtitle}</Text>
    ) : null}
  </View>
);

type ProgressBarProps = {
  label: string;
  value: string | number;
  color: string;
};

const ProgressBar = ({ label, value, color }: ProgressBarProps) => {
  const fillStyle = {
    width: value as import('react-native').DimensionValue,
    backgroundColor: color,
  };

  return (
    <View className="mb-3.5">
      <Text className="text-text-muted dark:text-text-muted-dark mb-2 text-xs">{label}</Text>
      <View className="h-2 bg-input dark:bg-input-dark rounded-lg overflow-hidden">
        <View className="h-2" style={fillStyle} />
      </View>
    </View>
  );
};

type BoostCardProps = {
  title: string;
  lines: string[];
};

const BoostCard = ({ title, lines }: BoostCardProps) => (
  <View className="bg-surface dark:bg-surface-dark rounded-[18px] p-4 mb-3 border border-input-border dark:border-input-border-dark">
    <Text className="text-accent dark:text-accent-dark font-semibold mb-2.5 text-[13px]">{title}</Text>
    {lines.map((line, index) => (
      <Text key={index} className="text-text-muted dark:text-text-muted-dark text-[13px] mb-2 leading-5">
        {line}
      </Text>
    ))}
  </View>
);

export default function Dashboard() {
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-20">
        <Text className="text-text-primary dark:text-text-primary-dark text-2xl font-bold">
          Good morning, John Doe 👋
        </Text>
        <Text className="text-text-muted dark:text-text-muted-dark mt-2 mb-4 text-sm">
          Here's your health summary for today
        </Text>

        <View className="flex-row justify-between mt-3">
          <StatCard title="Calories Today" value="1,840 / 2,200" subtitle="↑ 83% of daily goal" />
          <StatCard title="Active Minutes" value="42 min" subtitle="↑ 8 from yesterday" />
        </View>

        <View className="flex-row justify-between mt-3">
          <StatCard title="Workouts This Week" value="4 / 5" subtitle="On track!" />
          <StatCard title="Current Streak" value="12 days" subtitle="Personal best!" />
        </View>

        <View className="bg-surface dark:bg-surface-dark rounded-[20px] p-[18px] mt-[18px] border border-input-border dark:border-input-border-dark">
          <Text className="text-text-primary dark:text-text-primary-dark font-bold mb-3.5 text-base">
            Daily Goal Progress
          </Text>
          <View className="flex-row items-center">
            <View className="w-[104px] h-[104px] rounded-full bg-input dark:bg-input-dark items-center justify-center mr-[18px] border border-input-border dark:border-input-border-dark">
              <Text className="text-accent dark:text-accent-dark text-center font-bold leading-6">76%</Text>
              <Text className="text-accent dark:text-accent-dark text-center font-bold leading-6">Complete</Text>
            </View>
            <View className="flex-1">
              <ProgressBar label="Protein" value="60%" color="#00E5A0" />
              <ProgressBar label="Carbs" value="76%" color="#4BB4FF" />
              <ProgressBar label="Fats" value="40%" color="#A16BFF" />
            </View>
          </View>
        </View>

        <Text className="text-text-primary dark:text-text-primary-dark mt-[22px] mb-3 font-bold text-base">
          AI Insights & Predictions
        </Text>
        <View>
          <BoostCard
            title="Trend prediction"
            lines={[
              "Based on your trend, you'll reach your weight goal in ~3 weeks.",
              'Keep up the current activity to stay on track.',
            ]}
          />
          <BoostCard
            title="Meal timing"
            lines={[
              'Your meal timing is inconsistent.',
              'Try having lunch between 12-1PM to optimize metabolism.',
            ]}
          />
          <BoostCard
            title="Recovery"
            lines={[
              'You perform 31% better on workout days when you sleep 7+ hours.',
              'Prioritize rest tonight.',
            ]}
          />
        </View>

        <Text className="text-text-primary dark:text-text-primary-dark mt-[22px] mb-3 font-bold text-base">
          Today's Boost
        </Text>
        <View className="bg-surface dark:bg-surface-dark rounded-[20px] p-[18px] mt-3 border border-input-border dark:border-input-border-dark">
          <View className="mb-[18px]">
            <Text className="text-accent dark:text-accent-dark text-xs mb-2 tracking-wide">
              DAILY MOTIVATION
            </Text>
            <Text className="text-text-primary dark:text-text-primary-dark text-base font-semibold leading-6">
              “The only bad workout is the one that didn't happen.”
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark mt-2.5">— Unknown</Text>
          </View>

          <View className="mt-2">
            <Text className="text-text-primary dark:text-text-primary-dark font-bold mb-3 text-[15px]">
              Today's Workout Goals
            </Text>
            <View className="flex-row items-center mb-2.5">
              <Text className="text-accent dark:text-accent-dark mr-2.5 text-sm">✔︎</Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-[13px] leading-5">
                Morning warmup (10 min)
              </Text>
            </View>
            <View className="flex-row items-center mb-2.5">
              <Text className="text-accent dark:text-accent-dark mr-2.5 text-sm">✔︎</Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-[13px] leading-5">
                Chest & Triceps workout
              </Text>
            </View>
            <View className="flex-row items-center mb-2.5">
              <Text className="text-accent dark:text-accent-dark mr-2.5 text-sm">✔︎</Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-[13px] leading-5">
                30 min cardio session
              </Text>
            </View>
            <View className="flex-row items-center mb-2.5">
              <Text className="text-text-muted dark:text-text-muted-dark mr-2.5 text-sm">○</Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-[13px] leading-5">
                Post-workout stretch
              </Text>
            </View>
            <View className="flex-row items-center mb-2.5">
              <Text className="text-text-muted dark:text-text-muted-dark mr-2.5 text-sm">○</Text>
              <Text className="text-text-muted dark:text-text-muted-dark text-[13px] leading-5">
                Log water intake (2L)
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}