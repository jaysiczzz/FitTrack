import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import GoalCard from '@/components/auth/GoalCard';

interface Props {
  onSubmit: (data: { height: string; weight: string; age: string; goal: string }) => void;
  loading?: boolean;
}

const OnboardingForm: React.FC<Props> = ({ onSubmit, loading }) => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState<'muscle' | 'weight' | ''>('');

  const [heightError, setHeightError] = useState('');
  const [weightError, setWeightError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [goalError, setGoalError] = useState('');

  const handleSubmit = () => {
    let valid = true;

    const hNum = Number(height);
    if (!height.trim()) {
      setHeightError('Height is required');
      valid = false;
    } else if (isNaN(hNum) || hNum <= 0 || hNum > 300) {
      setHeightError('Enter valid height (1-300)');
      valid = false;
    } else {
      setHeightError('');
    }

    const wNum = Number(weight);
    if (!weight.trim()) {
      setWeightError('Weight is required');
      valid = false;
    } else if (isNaN(wNum) || wNum <= 0 || wNum > 500) {
      setWeightError('Enter valid weight (1-500)');
      valid = false;
    } else {
      setWeightError('');
    }

    const aNum = Number(age);
    if (!age.trim()) {
      setAgeError('Age is required');
      valid = false;
    } else if (isNaN(aNum) || aNum <= 0 || aNum > 120 || !Number.isInteger(aNum)) {
      setAgeError('Enter valid age (1-120)');
      valid = false;
    } else {
      setAgeError('');
    }

    if (!goal) {
      setGoalError('Please select a goal');
      valid = false;
    } else {
      setGoalError('');
    }

    if (valid) {
      onSubmit({ height, weight, age, goal });
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="w-full">
      <View className="flex-row justify-between">
        <View className="w-[48%]">
          <Input
            label="Height"
            placeholder="170"
            unit="cm"
            value={height}
            onChangeText={(text) => {
              setHeight(text);
              if (heightError) setHeightError('');
            }}
            keyboardType="numeric"
            error={heightError}
          />
        </View>
        <View className="w-[48%]">
          <Input
            label="Weight"
            placeholder="70"
            unit="kg"
            value={weight}
            onChangeText={(text) => {
              setWeight(text);
              if (weightError) setWeightError('');
            }}
            keyboardType="numeric"
            error={weightError}
          />
        </View>
      </View>

      <Input
        label="Age"
        placeholder="25"
        value={age}
        onChangeText={(text) => {
          setAge(text);
          if (ageError) setAgeError('');
        }}
        keyboardType="numeric"
        error={ageError}
      />

      <Text className="text-text-muted dark:text-text-muted-dark mt-2 mb-3 text-xs tracking-wide uppercase font-semibold">
        WHAT'S YOUR GOAL?
      </Text>
      <View className="flex-row justify-between mt-2 mb-2">
        <GoalCard
          label="Muscle Gain"
          icon="💪"
          selected={goal === 'muscle'}
          onPress={() => {
            setGoal('muscle');
            if (goalError) setGoalError('');
          }}
        />
        <GoalCard
          label="Weight Loss"
          icon="🔥"
          selected={goal === 'weight'}
          onPress={() => {
            setGoal('weight');
            if (goalError) setGoalError('');
          }}
        />
      </View>
      {goalError ? (
        <Text className="text-red-500 text-xs mb-3 font-medium">{goalError}</Text>
      ) : (
        <View className="mb-2" />
      )}

      <View className="mt-[14px]">
        <Button title="Create My Plan" onPress={handleSubmit} loading={loading} />
      </View>

      <Text className="text-text-muted dark:text-text-muted-dark text-center mt-3 text-xs">
        You can update this anytime
      </Text>
    </KeyboardAvoidingView>
  );
};

export default OnboardingForm;