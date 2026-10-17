import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import OnboardingHeader from '@/components/auth/OnboardingHeader';
import OnboardingGoalStep from '@/components/auth/OnboardingGoalStep';
import OnboardingMetricsStep from '@/components/auth/OnboardingMetricsStep';
import OnboardingPlanStep from '@/components/auth/OnboardingPlanStep';
import Button from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { registerUser } from '@/api/auth';
import { useRegistration } from '@/context/RegistrationContext';
import { useAuth } from '@/context/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { capitalizeWords } from '@/utils/formatters';
import { getFriendlyErrorMessage } from '@/utils/errorMapper';
import { ActivityLevel } from '@/constants/activityLevels';

export default function OnboardingScreen() {
  const { colors } = useThemeColors();
  const { isLandscape } = useResponsive();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [goal, setGoal] = useState<'MUSCLE_GAIN' | 'WEIGHT_LOSS' | ''>('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('LIGHTLY_ACTIVE');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');

  // Validation Errors
  const [goalError, setGoalError] = useState('');
  const [heightError, setHeightError] = useState('');
  const [weightError, setWeightError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [serverError, setServerError] = useState('');

  // Network & Registration State
  const [loading, setLoading] = useState(false);
  const [registeredPayload, setRegisteredPayload] = useState<{ token: string; user: any; refreshToken?: string } | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { data, clear } = useRegistration();
  const { login } = useAuth();

  // Step 1 -> Step 2 transition
  const handleGoalNext = () => {
    if (!goal) {
      setGoalError('Please select your fitness goal to proceed');
      return;
    }
    setGoalError('');
    setStep(2);
  };

  // Step 2 -> Step 3 transition and trigger registration
  const handleMetricsNext = async () => {
    let valid = true;

    const hNum = Number(height);
    if (!height.trim()) {
      setHeightError('Height is required');
      valid = false;
    } else if (isNaN(hNum) || hNum <= 50 || hNum > 250) {
      setHeightError('Enter valid height (50-250 cm)');
      valid = false;
    } else {
      setHeightError('');
    }

    const wNum = Number(weight);
    if (!weight.trim()) {
      setWeightError('Weight is required');
      valid = false;
    } else if (isNaN(wNum) || wNum <= 20 || wNum > 350) {
      setWeightError('Enter valid weight (20-350 kg)');
      valid = false;
    } else {
      setWeightError('');
    }

    const aNum = Number(age);
    if (!age.trim()) {
      setAgeError('Age is required');
      valid = false;
    } else if (isNaN(aNum) || aNum < 12 || aNum > 110 || !Number.isInteger(aNum)) {
      setAgeError('Enter valid age (12-110)');
      valid = false;
    } else {
      setAgeError('');
    }

    if (!valid) return;

    // Proceed to Step 3 (Generating / Reveal)
    Keyboard.dismiss();
    setStep(3);
    await triggerRegistration(hNum, wNum, aNum, goal as 'MUSCLE_GAIN' | 'WEIGHT_LOSS');
  };

  const triggerRegistration = async (
    hNum: number,
    wNum: number,
    aNum: number,
    selectedGoal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS'
  ) => {
    if (!data) {
      setServerError('Registration session expired. Please restart registration.');
      return;
    }

    if (!data.isVerified) {
      setServerError('Please verify your email address before completing onboarding.');
      router.replace('/(auth)/verify');
      return;
    }

    try {
      setServerError('');
      setLoading(true);

      const res = await registerUser({
        ...data,
        gender,
        height: Math.round(hNum),
        weight: Number(wNum.toFixed(1)),
        age: Math.round(aNum),
        goal: selectedGoal,
        activityLevel,
      });

      setRegisteredPayload({ token: res.token, user: res.user, refreshToken: res.refreshToken });
      clear();
    } catch (err: any) {
      setServerError(getFriendlyErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Launch Dashboard when user clicks the CTA in Step 3
  const handleLaunchDashboard = async () => {
    if (registeredPayload) {
      await login(registeredPayload.token, registeredPayload.user, registeredPayload.refreshToken);
    }
  };

  // Handle Back Navigation
  const handleHeaderBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 1) {
      router.replace('/(auth)/verify');
    }
  };

  // If user navigated directly to /onboarding without registering first or without verifying
  if ((!data || !data.isVerified) && !registeredPayload) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
        <View className="flex-1 justify-center items-center px-6">
          <View className="w-full max-w-[400px] bg-surface dark:bg-surface-dark border border-input-border/70 dark:border-input-border-dark/70 rounded-3xl p-6 items-center">
            <View className="w-14 h-14 rounded-2xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mb-4">
              <Ionicons name="mail-unread-outline" size={28} color={colors.accent} />
            </View>
            <Text className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2 text-center">
              {!data ? 'Registration Required' : 'Verification Required'}
            </Text>
            <Text className="text-text-muted dark:text-text-muted-dark text-sm text-center leading-relaxed mb-6">
              {!data
                ? 'To personalize your AI fitness plan, please start by setting up your login credentials.'
                : 'Please verify your email address with the 6-digit confirmation code before proceeding.'}
            </Text>
            <View className="w-full">
              <Button
                className="w-full"
                title={!data ? 'Go to Registration' : 'Verify Email'}
                onPress={() => {
                  if (!data) {
                    router.replace('/(auth)?tab=register' as any);
                  } else {
                    router.replace('/(auth)/verify');
                  }
                }}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: isLandscape ? 12 : 24,
            paddingBottom: 24,
            paddingHorizontal: 20,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View
            style={{ width: '100%', maxWidth: 420, alignSelf: 'center' }}
            className="w-full max-w-[420px] self-center"
          >
            <OnboardingHeader
              step={step}
              totalSteps={3}
              compact={isLandscape}
              showBack={step !== 3}
              onBack={handleHeaderBack}
            />

            {step === 1 && (
              <OnboardingGoalStep
                selectedGoal={goal}
                onSelectGoal={(g) => {
                  setGoal(g);
                  if (goalError) setGoalError('');
                }}
                onNext={handleGoalNext}
                error={goalError}
              />
            )}

            {step === 2 && (
              <OnboardingMetricsStep
                height={height}
                onHeightChange={(val) => {
                  setHeight(val);
                  if (heightError) setHeightError('');
                }}
                heightError={heightError}
                weight={weight}
                onWeightChange={(val) => {
                  setWeight(val);
                  if (weightError) setWeightError('');
                }}
                weightError={weightError}
                age={age}
                onAgeChange={(val) => {
                  setAge(val);
                  if (ageError) setAgeError('');
                }}
                ageError={ageError}
                gender={gender}
                onGenderChange={setGender}
                activityLevel={activityLevel}
                onActivityLevelChange={setActivityLevel}
                goal={goal}
                onNext={handleMetricsNext}
              />
            )}

            {step === 3 && (
              <OnboardingPlanStep
                loading={loading}
                error={serverError}
                isRegistered={!!registeredPayload}
                userName={capitalizeWords(data?.firstName || '')}
                goal={goal}
                gender={gender}
                height={Number(height)}
                weight={Number(weight)}
                age={Number(age)}
                activityLevel={activityLevel}
                onRetry={() =>
                  triggerRegistration(
                    Number(height),
                    Number(weight),
                    Number(age),
                    goal as 'MUSCLE_GAIN' | 'WEIGHT_LOSS'
                  )
                }
                onBackToEdit={() => {
                  if (serverError.toLowerCase().includes('email') || serverError.toLowerCase().includes('account')) {
                    router.replace('/(auth)');
                  } else {
                    setStep(2);
                  }
                }}
                onLaunchDashboard={handleLaunchDashboard}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

