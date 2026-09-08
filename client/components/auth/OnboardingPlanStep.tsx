import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { COLORS } from '@/constants/colors';

interface OnboardingPlanStepProps {
  loading: boolean;
  error: string;
  onRetry: () => void;
  onBackToEdit: () => void;
  onLaunchDashboard: () => void;
  goal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS' | '';
  userName: string;
  height: number;
  weight: number;
  age: number;
  isRegistered: boolean;
}

const CHECKLIST = [
  'Evaluating biometric profile & baseline BMI...',
  'Calculating Basal Metabolic Rate & caloric targets...',
  'Balancing optimal macronutrient distribution...',
  'Configuring workout routines & recovery split...',
];

const OnboardingPlanStep: React.FC<OnboardingPlanStepProps> = ({
  loading,
  error,
  onRetry,
  onBackToEdit,
  onLaunchDashboard,
  goal,
  userName,
  height,
  weight,
  age,
  isRegistered,
}) => {
  const [activeCheckIndex, setActiveCheckIndex] = useState(0);
  const [animationDone, setAnimationDone] = useState(false);

  // Animated checklist timer progression
  useEffect(() => {
    if (error) return;

    const t1 = setTimeout(() => setActiveCheckIndex(1), 600);
    const t2 = setTimeout(() => setActiveCheckIndex(2), 1300);
    const t3 = setTimeout(() => setActiveCheckIndex(3), 2000);
    const t4 = setTimeout(() => {
      setActiveCheckIndex(4);
      setAnimationDone(true);
    }, 2700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [error]);

  // Derived plan calculations
  const planData = useMemo(() => {
    const w = weight || 70;
    const h = height || 175;
    const a = age || 25;

    const bmr = 10 * w + 6.25 * h - 5 * a + 5;
    const tdee = Math.round(bmr * 1.35);

    let targetCalories = tdee;
    if (goal === 'MUSCLE_GAIN') {
      targetCalories = tdee + 300;
    } else if (goal === 'WEIGHT_LOSS') {
      targetCalories = Math.max(1400, tdee - 450);
    }

    const protein = Math.round(w * (goal === 'MUSCLE_GAIN' ? 2.0 : 1.8));
    const fats = Math.round((targetCalories * 0.25) / 9);
    const carbs = Math.round((targetCalories - (protein * 4 + fats * 9)) / 4);

    return {
      targetCalories,
      protein,
      carbs,
      fats,
      planTitle: goal === 'MUSCLE_GAIN' ? 'Hypertrophy & Strength Protocol' : 'Metabolic Fat Shred Protocol',
      planIcon: goal === 'MUSCLE_GAIN' ? '💪' : '🔥',
      focusSummary:
        goal === 'MUSCLE_GAIN'
          ? 'Optimized for progressive overload, muscle synthesis, and high-protein nutrition.'
          : 'Optimized for a sustainable caloric deficit while preserving lean muscle mass.',
    };
  }, [height, weight, age, goal]);

  // If there's an error from the backend registration
  if (error) {
    return (
      <View className="w-full items-center py-4">
        <View className="w-14 h-14 rounded-full bg-danger/15 dark:bg-danger-dark/20 items-center justify-center mb-3">
          <Text className="text-2xl">⚠️</Text>
        </View>

        <Text className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-1 text-center">
          Setup Incomplete
        </Text>
        <Text className="text-danger dark:text-danger-dark text-xs text-center mb-6 px-4">
          {error}
        </Text>

        <View className="w-full space-y-3">
          <Button title="Try Again" onPress={onRetry} loading={loading} />
          <View className="mt-2" />
          <Button
            title="Edit Registration Info"
            onPress={onBackToEdit}
            style={{ backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.textMuted.light }}
          />
        </View>
      </View>
    );
  }

  // If still generating (or waiting for backend API + animation to finish)
  const isGenerating = !animationDone || loading || !isRegistered;

  if (isGenerating) {
    const progressPercent = Math.min(100, Math.round((activeCheckIndex / 4) * 100));

    return (
      <View className="w-full items-center py-1">
        {/* Animated glowing chip */}
        <View
          className="w-14 h-14 rounded-2xl bg-accent/10 dark:bg-accent-dark/15 border border-accent dark:border-accent-dark items-center justify-center mb-3"
          style={
            Platform.select({
              web: {
                boxShadow: '0 0 16px rgba(0, 229, 160, 0.25)',
              } as any,
              default: {
                elevation: 2,
              },
            })
          }
        >
          <Text className="text-2xl animate-pulse">⚡</Text>
        </View>

        <Text className="text-lg font-black text-text-primary dark:text-text-primary-dark mb-0.5 text-center">
          Crafting Your AI Plan
        </Text>
        <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center mb-3.5">
          Customizing targets based on your physiological profile
        </Text>

        {/* Progress Bar */}
        <ProgressBar
          percentage={Math.max(10, progressPercent)}
          height={6}
          trackClassName="bg-surface dark:bg-surface-dark"
          className="w-full mb-3.5"
        />

        {/* Sequential Step Indicators */}
        <View className="w-full bg-surface dark:bg-surface-dark border border-input-border/60 dark:border-input-border-dark/60 rounded-xl p-3 mb-3">
          {CHECKLIST.map((stepText, index) => {
            const isDone = activeCheckIndex > index;
            const isCurrent = activeCheckIndex === index;

            return (
              <View
                key={index}
                className={`flex-row items-center py-1.5 ${
                  index !== CHECKLIST.length - 1
                    ? 'border-b border-input-border/20 dark:border-input-border-dark/20'
                    : ''
                }`}
              >
                <View
                  className={`w-4 h-4 rounded-full items-center justify-center mr-2.5 ${
                    isDone
                      ? 'bg-accent dark:bg-accent-dark'
                      : isCurrent
                      ? 'bg-accent/20 dark:bg-accent-dark/25'
                      : 'bg-input-border/40 dark:bg-input-border-dark/40'
                  }`}
                >
                  {isDone ? (
                    <Text className="text-white dark:text-background-dark text-[9px] font-bold">✓</Text>
                  ) : isCurrent ? (
                    <ActivityIndicator size={8} color={COLORS.accent.light} />
                  ) : (
                    <View className="w-1 h-1 rounded-full bg-text-muted dark:bg-text-muted-dark" />
                  )}
                </View>

                <Text
                  className={`text-[11px] flex-1 ${
                    isDone
                      ? 'text-text-primary dark:text-text-primary-dark font-medium'
                      : isCurrent
                      ? 'text-accent dark:text-accent-dark font-semibold'
                      : 'text-text-muted/60 dark:text-text-muted-dark/60'
                  }`}
                >
                  {stepText}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  // Plan Reveal State
  return (
    <View className="w-full py-0.5">
      {/* Celebration Header */}
      <View className="items-center mb-3">
        <View className="w-10 h-10 rounded-xl bg-accent/20 dark:bg-accent-dark/25 items-center justify-center mb-1">
          <Text className="text-xl">{planData.planIcon}</Text>
        </View>
        <Text className="text-xl font-black text-text-primary dark:text-text-primary-dark text-center tracking-tight">
          Your Plan is Ready!
        </Text>
        <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center">
          Personalized program for {userName || 'you'}
        </Text>
      </View>

      {/* Primary Plan Summary Card */}
      <View className="w-full bg-surface dark:bg-surface-dark border border-accent/40 dark:border-accent-dark/40 rounded-xl p-3.5 mb-3">
        <View className="flex-row items-center justify-between pb-2 border-b border-input-border/30 dark:border-input-border-dark/30">
          <View>
            <Text className="text-[9px] uppercase tracking-wider text-accent dark:text-accent-dark font-bold">
              PROGRAM BLUEPRINT
            </Text>
            <Text className="text-sm font-extrabold text-text-primary dark:text-text-primary-dark">
              {planData.planTitle}
            </Text>
          </View>
          <View className="bg-accent/15 dark:bg-accent-dark/20 px-2 py-0.5 rounded-full">
            <Text className="text-accent dark:text-accent-dark text-[10px] font-bold">
              AI Configured
            </Text>
          </View>
        </View>

        {/* Calorie Goal Callout */}
        <View className="py-2 items-center">
          <Text className="text-[10px] uppercase tracking-wider text-text-muted dark:text-text-muted-dark font-semibold">
            Daily Target Calories
          </Text>
          <Text className="text-2xl font-black text-accent dark:text-accent-dark my-0.5">
            {planData.targetCalories.toLocaleString()}{' '}
            <Text className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark">
              kcal
            </Text>
          </Text>
          <Text className="text-[11px] text-text-muted dark:text-text-muted-dark text-center px-1">
            {planData.focusSummary}
          </Text>
        </View>

        {/* Macro Distribution Pills */}
        <View className="flex-row gap-2 pt-2 border-t border-input-border/30 dark:border-input-border-dark/30">
          <View className="flex-1 items-center bg-background dark:bg-background-dark py-1.5 rounded-lg">
            <Text className="text-[9px] uppercase font-bold text-text-muted dark:text-text-muted-dark">
              Protein
            </Text>
            <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
              {planData.protein}g
            </Text>
          </View>

          <View className="flex-1 items-center bg-background dark:bg-background-dark py-1.5 rounded-lg">
            <Text className="text-[9px] uppercase font-bold text-text-muted dark:text-text-muted-dark">
              Carbs
            </Text>
            <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
              {planData.carbs}g
            </Text>
          </View>

          <View className="flex-1 items-center bg-background dark:bg-background-dark py-1.5 rounded-lg">
            <Text className="text-[9px] uppercase font-bold text-text-muted dark:text-text-muted-dark">
              Fats
            </Text>
            <Text className="text-xs font-extrabold text-text-primary dark:text-text-primary-dark">
              {planData.fats}g
            </Text>
          </View>
        </View>
      </View>

      {/* Feature Bullet Perks */}
      <View className="w-full bg-surface/50 dark:bg-surface-dark/50 border border-input-border/50 dark:border-input-border-dark/50 rounded-xl p-2.5 mb-3.5 space-y-1">
        <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
          ✨ <Text className="font-semibold text-text-primary dark:text-text-primary-dark">AI Meal Scanner</Text> & Nutrition Tracker activated
        </Text>
        <Text className="text-[11px] text-text-muted dark:text-text-muted-dark">
          🏋️ <Text className="font-semibold text-text-primary dark:text-text-primary-dark">Custom Exercise Library</Text> & split ready
        </Text>
      </View>

      {/* Launch CTA */}
      <Button
        title="Enter My Dashboard 🚀"
        onPress={onLaunchDashboard}
      />
    </View>
  );
};

export default OnboardingPlanStep;
