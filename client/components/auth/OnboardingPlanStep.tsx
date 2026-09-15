import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { useThemeColors } from '@/constants/colors';

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
  const { colors } = useThemeColors();
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
      planTitle: goal === 'MUSCLE_GAIN' ? 'Hypertrophy & Strength Protocol' : 'Metabolic Calorie Deficit Protocol',
      focusSummary:
        goal === 'MUSCLE_GAIN'
          ? 'Optimized for progressive overload, muscle synthesis, and high-protein recovery.'
          : 'Optimized for a sustainable caloric deficit while preserving lean muscle mass.',
    };
  }, [height, weight, age, goal]);

  // If there's an error from the backend registration
  if (error) {
    return (
      <View className="w-full items-center py-4">
        <View className="w-12 h-12 rounded-full bg-danger/10 items-center justify-center mb-3">
          <Ionicons name="alert-circle" size={28} color={colors.danger} />
        </View>

        <Text className="text-lg font-bold text-text-primary dark:text-text-primary-dark mb-1 text-center">
          Setup Incomplete
        </Text>
        <Text className="text-danger dark:text-danger-dark text-xs text-center mb-6 px-4">
          {error}
        </Text>

        <View className="w-full gap-2.5">
          <Button title="Try Again" onPress={onRetry} loading={loading} />
          <Button
            title="Edit Registration Info"
            onPress={onBackToEdit}
            variant="outline"
          />
        </View>
      </View>
    );
  }

  // If still generating
  const isGenerating = !animationDone || loading || !isRegistered;

  if (isGenerating) {
    const progressPercent = Math.min(100, Math.round((activeCheckIndex / 4) * 100));

    return (
      <View className="w-full items-center py-2">
        <View
          className="w-12 h-12 rounded-2xl bg-accent/10 dark:bg-accent-dark/15 border border-accent/30 dark:border-accent-dark/30 items-center justify-center mb-3"
        >
          <Ionicons name="sparkles" size={24} color={colors.accent} />
        </View>

        <Text className="text-lg font-bold text-text-primary dark:text-text-primary-dark mb-0.5 text-center">
          Generating Your Plan
        </Text>
        <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center mb-4">
          Customizing targets based on your physiological profile
        </Text>

        {/* Progress Bar */}
        <ProgressBar
          percentage={Math.max(10, progressPercent)}
          height={4}
          className="w-full mb-4"
        />

        {/* Sequential Step Indicators */}
        <View className="w-full bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark rounded-xl p-3.5 mb-3">
          {CHECKLIST.map((stepText, index) => {
            const isDone = activeCheckIndex > index;
            const isCurrent = activeCheckIndex === index;

            return (
              <View
                key={index}
                className={`flex-row items-center py-2 ${
                  index !== CHECKLIST.length - 1
                    ? 'border-b border-input-border/40 dark:border-input-border-dark/40'
                    : ''
                }`}
              >
                <View
                  className={`w-4 h-4 rounded-full items-center justify-center mr-2.5 ${
                    isDone
                      ? 'bg-accent dark:bg-accent-dark'
                      : isCurrent
                      ? 'bg-accent/20 dark:bg-accent-dark/25'
                      : 'bg-input-border dark:bg-input-border-dark'
                  }`}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  ) : isCurrent ? (
                    <ActivityIndicator size={8} color={colors.accent} />
                  ) : (
                    <View className="w-1 h-1 rounded-full bg-text-muted dark:bg-text-muted-dark" />
                  )}
                </View>

                <Text
                  className={`text-xs flex-1 ${
                    isDone
                      ? 'text-text-primary dark:text-text-primary-dark font-medium'
                      : isCurrent
                      ? 'text-accent dark:text-accent-dark font-semibold'
                      : 'text-text-muted dark:text-text-muted-dark'
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
    <View className="w-full py-1">
      {/* Header */}
      <View className="items-center mb-4">
        <View className="w-11 h-11 rounded-2xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mb-2 border border-accent/20 dark:border-accent-dark/30">
          <Ionicons name="checkmark" size={24} color={colors.accent} />
        </View>
        <Text className="text-xl font-extrabold text-text-primary dark:text-text-primary-dark text-center tracking-tight">
          Your Plan is Ready
        </Text>
        <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center mt-0.5">
          Personalized program for {userName || 'you'}
        </Text>
      </View>

      {/* Primary Plan Summary Card */}
      <View className="w-full bg-surface dark:bg-surface-dark border border-input-border dark:border-input-border-dark rounded-2xl p-4 mb-3">
        <View className="flex-row items-center justify-between pb-3 border-b border-input-border/50 dark:border-input-border-dark/50">
          <View>
            <Text className="text-[10px] uppercase tracking-wider text-accent dark:text-accent-dark font-bold">
              PROGRAM BLUEPRINT
            </Text>
            <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark mt-0.5">
              {planData.planTitle}
            </Text>
          </View>
          <View className="bg-accent/10 dark:bg-accent-dark/15 px-2.5 py-1 rounded-full border border-accent/20">
            <Text className="text-accent dark:text-accent-dark text-[10px] font-bold">
              AI Configured
            </Text>
          </View>
        </View>

        {/* Calorie Goal Callout */}
        <View className="py-3 items-center">
          <Text className="text-[10px] uppercase tracking-wider text-text-muted dark:text-text-muted-dark font-semibold">
            Daily Target Calories
          </Text>
          <Text className="text-2xl font-black text-text-primary dark:text-text-primary-dark my-1">
            {planData.targetCalories.toLocaleString()}{' '}
            <Text className="text-xs font-normal text-text-muted dark:text-text-muted-dark">
              kcal
            </Text>
          </Text>
          <Text className="text-xs text-text-muted dark:text-text-muted-dark text-center px-2 leading-4">
            {planData.focusSummary}
          </Text>
        </View>

        {/* Macro Distribution Pills */}
        <View className="flex-row gap-2 pt-3 border-t border-input-border/50 dark:border-input-border-dark/50">
          <View className="flex-1 items-center bg-input dark:bg-input-dark py-2 rounded-xl">
            <Text className="text-[10px] uppercase font-bold text-text-muted dark:text-text-muted-dark">
              Protein
            </Text>
            <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark mt-0.5">
              {planData.protein}g
            </Text>
          </View>

          <View className="flex-1 items-center bg-input dark:bg-input-dark py-2 rounded-xl">
            <Text className="text-[10px] uppercase font-bold text-text-muted dark:text-text-muted-dark">
              Carbs
            </Text>
            <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark mt-0.5">
              {planData.carbs}g
            </Text>
          </View>

          <View className="flex-1 items-center bg-input dark:bg-input-dark py-2 rounded-xl">
            <Text className="text-[10px] uppercase font-bold text-text-muted dark:text-text-muted-dark">
              Fats
            </Text>
            <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark mt-0.5">
              {planData.fats}g
            </Text>
          </View>
        </View>
      </View>

      {/* Feature Bullet Perks */}
      <View className="w-full bg-input dark:bg-input-dark border border-input-border dark:border-input-border-dark rounded-xl p-3 mb-4 space-y-1.5">
        <View className="flex-row items-center">
          <Ionicons name="checkmark-circle" size={17} color={colors.accent} />
          <Text className="text-xs text-text-muted dark:text-text-muted-dark ml-2">
            AI Meal Scanner & Nutrition Tracker activated
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="checkmark-circle" size={17} color={colors.accent} />
          <Text className="text-xs text-text-muted dark:text-text-muted-dark ml-2">
            Custom Exercise Library & split ready
          </Text>
        </View>
      </View>

      {/* Launch CTA */}
      <Button
        title="Enter Dashboard"
        onPress={onLaunchDashboard}
      />
    </View>
  );
};

export default OnboardingPlanStep;
