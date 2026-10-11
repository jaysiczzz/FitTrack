import React, { useRef, useMemo } from 'react';
import { View, Text, TextInput } from 'react-native';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { calculateBmi } from '@/utils/formatters';
import { calculatePersonalizedTargets } from '@/components/foodlog/foodLogTypes';

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

    const { bmi: bmiVal, category } = calculateBmi(w, h);
    let bmiCategory = 'Healthy Weight';
    let bmiColor = 'text-accent dark:text-accent-dark';
    if (category === 'Underweight') {
      bmiCategory = 'Underweight';
      bmiColor = 'text-warning dark:text-warning-dark';
    } else if (category === 'Overweight') {
      bmiCategory = 'Overweight';
      bmiColor = 'text-warning dark:text-warning-dark';
    } else if (category === 'Obese') {
      bmiCategory = 'High BMI';
      bmiColor = 'text-danger dark:text-danger-dark';
    }

    const targets = calculatePersonalizedTargets(
      { weight: w, height: h, age: a, goal },
      (goal as any) || 'MUSCLE_GAIN'
    );

    return {
      bmi: bmiVal.toFixed(1),
      bmiCategory,
      bmiColor,
      targetCalories: targets.calories,
      proteinGrams: targets.protein,
      carbGrams: targets.carbs,
      fatGrams: targets.fat,
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
              Projected Targets
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
            Enter height & weight to preview live calorie & macro targets.
          </Text>
        </View>
      )}

      <Button
        title="Generate My Plan"
        onPress={onNext}
      />
    </View>
  );
};

export default OnboardingMetricsStep;
