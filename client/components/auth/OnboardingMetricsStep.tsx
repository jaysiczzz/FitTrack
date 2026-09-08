import React, { useRef, useMemo } from 'react';
import { View, Text, TextInput } from 'react-native';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface OnboardingMetricsStepProps {
  height: string;
  onHeightChange: (val: string) => void;
  heightError?: string;

  weight: string;
  onWeightChange: (val: string) => void;
  weightError?: string;

  age: string;
  onAgeChange: (val: string) => void;
  ageError?: string;

  goal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS' | '';
  onNext: () => void;
}

const OnboardingMetricsStep: React.FC<OnboardingMetricsStepProps> = ({
  height,
  onHeightChange,
  heightError,
  weight,
  onWeightChange,
  weightError,
  age,
  onAgeChange,
  ageError,
  goal,
  onNext,
}) => {
  const weightRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);

  // Real-time calculation of estimated health metrics
  const statsPreview = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseInt(age, 10) || 25;

    if (!h || !w || h <= 50 || h > 250 || w <= 20 || w > 350) {
      return null;
    }

    const heightInMeters = h / 100;
    const bmi = w / (heightInMeters * heightInMeters);

    let bmiCategory = 'Healthy Weight';
    let bmiColor = 'text-accent dark:text-accent-dark';
    if (bmi < 18.5) {
      bmiCategory = 'Underweight';
      bmiColor = 'text-amber-500 dark:text-amber-400';
    } else if (bmi >= 25 && bmi < 30) {
      bmiCategory = 'Overweight';
      bmiColor = 'text-amber-500 dark:text-amber-400';
    } else if (bmi >= 30) {
      bmiCategory = 'High BMI';
      bmiColor = 'text-red-500 dark:text-red-400';
    }

    // Mifflin-St Jeor formula baseline estimation
    const bmr = 10 * w + 6.25 * h - 5 * a + 5;
    const tdee = Math.round(bmr * 1.35); // Moderate activity baseline

    let targetCalories = tdee;
    if (goal === 'MUSCLE_GAIN') {
      targetCalories = tdee + 300;
    } else if (goal === 'WEIGHT_LOSS') {
      targetCalories = Math.max(1400, tdee - 450);
    }

    // Macro estimates
    const proteinGrams = Math.round(w * (goal === 'MUSCLE_GAIN' ? 2.0 : 1.8));
    const fatGrams = Math.round((targetCalories * 0.25) / 9);
    const carbGrams = Math.round((targetCalories - (proteinGrams * 4 + fatGrams * 9)) / 4);

    return {
      bmi: bmi.toFixed(1),
      bmiCategory,
      bmiColor,
      targetCalories,
      proteinGrams,
      carbGrams,
      fatGrams,
    };
  }, [height, weight, age, goal]);

  return (
    <View className="w-full">
      {/* 2-column Height & Weight */}
      <View className="flex-row gap-2.5 w-full">
        <View className="flex-1">
          <Input
            className="w-full"
            label="Height"
            placeholder="175"
            unit="cm"
            value={height}
            onChangeText={onHeightChange}
            keyboardType="numeric"
            error={heightError}
            returnKeyType="next"
            onSubmitEditing={() => weightRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>

        <View className="flex-1">
          <Input
            className="w-full"
            ref={weightRef}
            label="Weight"
            placeholder="72"
            unit="kg"
            value={weight}
            onChangeText={onWeightChange}
            keyboardType="decimal-pad"
            error={weightError}
            returnKeyType="next"
            onSubmitEditing={() => ageRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>
      </View>

      {/* Age */}
      <Input
        ref={ageRef}
        label="Age"
        placeholder="25"
        unit="yrs"
        value={age}
        onChangeText={onAgeChange}
        keyboardType="numeric"
        error={ageError}
        returnKeyType="done"
        onSubmitEditing={onNext}
      />

      {/* Live Calculated Metric Insights Card */}
      {statsPreview ? (
        <View className="w-full bg-surface dark:bg-surface-dark border border-accent/30 dark:border-accent-dark/30 rounded-xl p-3 mb-3.5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
              ⚡ Projected Targets
            </Text>
            <View className="bg-accent/15 dark:bg-accent-dark/20 px-2 py-0.5 rounded-full">
              <Text className={`text-[10px] font-bold ${statsPreview.bmiColor}`}>
                BMI {statsPreview.bmi} • {statsPreview.bmiCategory}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between pt-2 border-t border-input-border/30 dark:border-input-border-dark/30">
            <View>
              <Text className="text-[10px] uppercase tracking-wider text-text-muted dark:text-text-muted-dark font-semibold">
                Daily Calorie Target
              </Text>
              <Text className="text-lg font-black text-accent dark:text-accent-dark">
                ~{statsPreview.targetCalories}{' '}
                <Text className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark">
                  kcal/day
                </Text>
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-[10px] uppercase tracking-wider text-text-muted dark:text-text-muted-dark font-semibold">
                Daily Protein
              </Text>
              <Text className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                ~{statsPreview.proteinGrams}g
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="w-full bg-surface/50 dark:bg-surface-dark/50 border border-input-border/50 dark:border-input-border-dark/50 rounded-xl p-2.5 mb-3.5">
          <Text className="text-text-muted dark:text-text-muted-dark text-[11px] text-center">
            💡 Enter height & weight to preview live calorie & macro targets.
          </Text>
        </View>
      )}

      <Button
        title="Generate My AI Plan ⚡"
        onPress={onNext}
      />
    </View>
  );
};

export default OnboardingMetricsStep;
