import React, { useRef, useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { calculateBmi } from '@/utils/formatters';
import { calculatePersonalizedTargets } from '@/components/foodlog/foodLogTypes';
import {
  useHeightUnit,
  useWeightUnit,
  HeightUnit,
  WeightUnit,
  cmToFtIn,
  ftInToCm,
  kgToLbs,
  lbsToKg,
} from '@/constants/units';
import { hapticFeedback } from '@/utils/haptics';

interface OnboardingMetricsStepProps {
  height: string; // Stored/passed in cm
  onHeightChange: (val: string) => void;
  heightError?: string;

  weight: string; // Stored/passed in kg
  onWeightChange: (val: string) => void;
  weightError?: string;

  age: string;
  onAgeChange: (val: string) => void;
  ageError?: string;

  gender: 'MALE' | 'FEMALE';
  onGenderChange: (val: 'MALE' | 'FEMALE') => void;

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
  gender,
  onGenderChange,
  goal,
  onNext,
}) => {
  const [heightUnit, setHeightUnit] = useHeightUnit();
  const [weightUnit, setWeightUnit] = useWeightUnit();

  // Local state for Imperial inputs
  const [feetInput, setFeetInput] = useState('');
  const [inchesInput, setInchesInput] = useState('');
  const [weightLbsInput, setWeightLbsInput] = useState('');

  const weightRef = useRef<TextInput>(null);
  const inchesRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);

  // Sync initial feet/inches if height is provided in cm
  useEffect(() => {
    const cm = parseFloat(height);
    if (cm && cm > 0 && !feetInput && !inchesInput) {
      const { feet, inches } = cmToFtIn(cm);
      setFeetInput(String(feet));
      setInchesInput(String(inches));
    }
  }, [height]);

  // Sync initial weight in lbs if weight is provided in kg
  useEffect(() => {
    const kg = parseFloat(weight);
    if (kg && kg > 0 && !weightLbsInput) {
      setWeightLbsInput(String(kgToLbs(kg)));
    }
  }, [weight]);

  const handleToggleHeightUnit = (newUnit: HeightUnit) => {
    hapticFeedback.light();
    setHeightUnit(newUnit);
    if (newUnit === 'FT_IN') {
      const cm = parseFloat(height);
      if (cm && cm > 0) {
        const { feet, inches } = cmToFtIn(cm);
        setFeetInput(String(feet));
        setInchesInput(String(inches));
      }
    } else {
      const f = parseInt(feetInput, 10) || 0;
      const i = parseInt(inchesInput, 10) || 0;
      if (f > 0 || i > 0) {
        const cm = ftInToCm(f, i);
        onHeightChange(String(cm));
      }
    }
  };

  const handleToggleWeightUnit = (newUnit: WeightUnit) => {
    hapticFeedback.light();
    setWeightUnit(newUnit);
    if (newUnit === 'LBS') {
      const kg = parseFloat(weight);
      if (kg && kg > 0) {
        setWeightLbsInput(String(kgToLbs(kg)));
      }
    } else {
      const lbs = parseFloat(weightLbsInput);
      if (lbs && lbs > 0) {
        onWeightChange(String(lbsToKg(lbs)));
      }
    }
  };

  const handleFeetChange = (val: string) => {
    setFeetInput(val);
    const f = parseInt(val, 10) || 0;
    const i = parseInt(inchesInput, 10) || 0;
    if (f > 0 || i > 0) {
      const cm = ftInToCm(f, i);
      onHeightChange(String(cm));
    } else {
      onHeightChange('');
    }
  };

  const handleInchesChange = (val: string) => {
    setInchesInput(val);
    const f = parseInt(feetInput, 10) || 0;
    const i = parseInt(val, 10) || 0;
    if (f > 0 || i > 0) {
      const cm = ftInToCm(f, i);
      onHeightChange(String(cm));
    } else {
      onHeightChange('');
    }
  };

  const handleWeightLbsChange = (val: string) => {
    setWeightLbsInput(val);
    const lbs = parseFloat(val);
    if (lbs && lbs > 0) {
      const kg = lbsToKg(lbs);
      onWeightChange(String(kg));
    } else {
      onWeightChange('');
    }
  };

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
      { weight: w, height: h, age: a, gender, goal },
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
  }, [height, weight, age, gender, goal]);

  return (
    <View className="w-full">
      {/* Unit Selector Row */}
      <View className="flex-row items-center justify-between mb-2 px-0.5">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark">
            Height:
          </Text>
          <View className="flex-row bg-input dark:bg-input-dark p-0.5 rounded-lg border border-input-border dark:border-input-border-dark">
            <Pressable
              onPress={() => handleToggleHeightUnit('CM')}
              className={`px-2 py-0.5 rounded ${heightUnit === 'CM' ? 'bg-accent dark:bg-accent-dark' : 'bg-transparent'}`}
            >
              <Text className={`text-[10px] font-bold ${heightUnit === 'CM' ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'}`}>
                cm
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleToggleHeightUnit('FT_IN')}
              className={`px-2 py-0.5 rounded ${heightUnit === 'FT_IN' ? 'bg-accent dark:bg-accent-dark' : 'bg-transparent'}`}
            >
              <Text className={`text-[10px] font-bold ${heightUnit === 'FT_IN' ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'}`}>
                ft/in
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Text className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark">
            Weight:
          </Text>
          <View className="flex-row bg-input dark:bg-input-dark p-0.5 rounded-lg border border-input-border dark:border-input-border-dark">
            <Pressable
              onPress={() => handleToggleWeightUnit('KG')}
              className={`px-2 py-0.5 rounded ${weightUnit === 'KG' ? 'bg-accent dark:bg-accent-dark' : 'bg-transparent'}`}
            >
              <Text className={`text-[10px] font-bold ${weightUnit === 'KG' ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'}`}>
                kg
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleToggleWeightUnit('LBS')}
              className={`px-2 py-0.5 rounded ${weightUnit === 'LBS' ? 'bg-accent dark:bg-accent-dark' : 'bg-transparent'}`}
            >
              <Text className={`text-[10px] font-bold ${weightUnit === 'LBS' ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'}`}>
                lbs
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Height & Weight Section */}
      <View className={`${heightUnit === 'FT_IN' ? 'flex-col sm:flex-row' : 'flex-row'} gap-2.5 w-full`}>
        {/* Height Section */}
        <View className="flex-1">
          {heightUnit === 'CM' ? (
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
          ) : (
            <View className="w-full">
              <View className="flex-row gap-1.5">
                <View className="flex-1">
                  <Input
                    className="w-full"
                    label="Height (ft)"
                    placeholder="5"
                    unit="ft"
                    value={feetInput}
                    onChangeText={handleFeetChange}
                    keyboardType="numeric"
                    error={heightError ? ' ' : undefined}
                    returnKeyType="next"
                    onSubmitEditing={() => inchesRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
                <View className="flex-1">
                  <Input
                    ref={inchesRef}
                    className="w-full"
                    label="(in)"
                    placeholder="10"
                    unit="in"
                    value={inchesInput}
                    onChangeText={handleInchesChange}
                    keyboardType="numeric"
                    error={heightError}
                    returnKeyType="next"
                    onSubmitEditing={() => weightRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Weight Section */}
        <View className="flex-1">
          {weightUnit === 'KG' ? (
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
          ) : (
            <Input
              className="w-full"
              ref={weightRef}
              label="Weight"
              placeholder="160"
              unit="lbs"
              value={weightLbsInput}
              onChangeText={handleWeightLbsChange}
              keyboardType="decimal-pad"
              error={weightError}
              returnKeyType="next"
              onSubmitEditing={() => ageRef.current?.focus()}
              blurOnSubmit={false}
            />
          )}
        </View>
      </View>

      {/* Biological Sex Selector */}
      <View className="mb-2.5">
        <View className="flex-row items-center justify-between mb-1 px-0.5">
          <Text className="text-[11px] font-semibold text-text-muted dark:text-text-muted-dark">
            Biological Sex
          </Text>
          <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
            Calibrates BMR & caloric formulas
          </Text>
        </View>
        <View className="flex-row bg-input dark:bg-input-dark p-0.5 rounded-lg border border-input-border dark:border-input-border-dark gap-1">
          {(['MALE', 'FEMALE'] as const).map((g) => {
            const isSelected = gender === g;
            const label = g === 'MALE' ? 'Male' : 'Female';
            return (
              <Pressable
                key={g}
                onPress={() => {
                  hapticFeedback.light();
                  onGenderChange(g);
                }}
                className={`flex-1 py-1.5 rounded-md items-center justify-center ${
                  isSelected ? 'bg-accent dark:bg-accent-dark' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? 'text-white' : 'text-text-muted dark:text-text-muted-dark'
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
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
