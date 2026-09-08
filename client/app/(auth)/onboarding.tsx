import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingHeader from '@/components/auth/OnboardingHeader';
import OnboardingGoalStep from '@/components/auth/OnboardingGoalStep';
import OnboardingMetricsStep from '@/components/auth/OnboardingMetricsStep';
import OnboardingPlanStep from '@/components/auth/OnboardingPlanStep';
import Button from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { registerUser } from '@/api/auth';
import { useRegistration } from '../../context/RegistrationContext';
import { useAuth } from '../../context/AuthContext';

export default function OnboardingScreen() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [goal, setGoal] = useState<'MUSCLE_GAIN' | 'WEIGHT_LOSS' | ''>('');
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
  const [registeredPayload, setRegisteredPayload] = useState<{ token: string; user: any } | null>(null);

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { data, clear } = useRegistration();
  const { login } = useAuth();

  // Listen for mobile keyboard show/hide events (Android / Web)
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardOpen(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

    try {
      setServerError('');
      setLoading(true);

      const res = await registerUser({
        ...data,
        height: Math.round(hNum),
        weight: Number(wNum.toFixed(1)),
        age: Math.round(aNum),
        goal: selectedGoal,
      });

      setRegisteredPayload({ token: res.token, user: res.user });
      clear();
    } catch (err: any) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Launch Dashboard when user clicks the CTA in Step 3
  const handleLaunchDashboard = async () => {
    if (registeredPayload) {
      await login(registeredPayload.token, registeredPayload.user);
    }
  };

  // Handle Back Navigation
  const handleHeaderBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 1) {
      router.replace('/(auth)');
    }
  };

  // If user navigated directly to /onboarding without registering first
  if (!data && !registeredPayload) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark justify-center px-6">
        <View className="w-full max-w-[440px] mx-auto bg-surface dark:bg-surface-dark border border-input-border/70 dark:border-input-border-dark/70 rounded-3xl p-6 items-center text-center">
          <View className="w-16 h-16 rounded-2xl bg-accent/15 dark:bg-accent-dark/20 items-center justify-center mb-4">
            <Text className="text-3xl">📝</Text>
          </View>
          <Text className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2 text-center">
            Registration Required
          </Text>
          <Text className="text-text-muted dark:text-text-muted-dark text-xs text-center leading-relaxed mb-6">
            To personalize your AI fitness plan, please start by setting up your login credentials.
          </Text>
          <Button
            title="Go to Registration →"
            onPress={() => router.replace('/(auth)')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <KeyboardAvoidingView className="flex-1">
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingVertical: 16,
            paddingBottom: isKeyboardOpen ? 120 : 24,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View className="w-full max-w-[420px] mx-auto px-5">
            <OnboardingHeader
              step={step}
              totalSteps={3}
              compact={isKeyboardOpen}
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
                goal={goal}
                onNext={handleMetricsNext}
              />
            )}

            {step === 3 && (
              <OnboardingPlanStep
                loading={loading}
                error={serverError}
                isRegistered={!!registeredPayload}
                userName={data?.firstName || ''}
                goal={goal}
                height={Number(height)}
                weight={Number(weight)}
                age={Number(age)}
                onRetry={() =>
                  triggerRegistration(
                    Number(height),
                    Number(weight),
                    Number(age),
                    goal as 'MUSCLE_GAIN' | 'WEIGHT_LOSS'
                  )
                }
                onBackToEdit={() => setStep(2)}
                onLaunchDashboard={handleLaunchDashboard}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

