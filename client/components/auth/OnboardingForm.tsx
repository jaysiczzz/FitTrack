import React, { useState, useMemo } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import GoalCard from '@/components/auth/GoalCard';

interface Props {
  onSubmit: (data: { height: string; weight: string; age: string; goal: string }) => void;
}

const OnboardingForm: React.FC<Props> = ({ onSubmit }) => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState<'muscle' | 'weight' | ''>('');

  const disabled = useMemo(() => {
    return !(height.trim() && weight.trim() && age.trim() && goal);
  }, [height, weight, age, goal]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="w-full">
      <View className="flex-row justify-between">
        <View className="w-[48%]">
          <Input label="Height" placeholder="170 (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" />
        </View>
        <View className="w-[48%]">
          <Input label="Weight" placeholder="70 (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" />
        </View>
      </View>

      <Input label="Age" placeholder="25" value={age} onChangeText={setAge} keyboardType="numeric" />

      <Text className="text-text-muted dark:text-text-muted-dark mt-2 mb-3 text-xs tracking-wide uppercase font-semibold">
        WHAT'S YOUR GOAL?
      </Text>
      <View className="flex-row justify-between mt-2 mb-4">
        <GoalCard label="Muscle Gain" icon="💪" selected={goal === 'muscle'} onPress={() => setGoal('muscle')} />
        <GoalCard label="Weight Loss" icon="🔥" selected={goal === 'weight'} onPress={() => setGoal('weight')} />
      </View>

      <View className="mt-[22px]">
        <Button title="Create My Plan" onPress={() => onSubmit({ height, weight, age, goal })} />
      </View>

      <Text className="text-text-muted dark:text-text-muted-dark text-center mt-3 text-xs">
        You can update this anytime
      </Text>
    </KeyboardAvoidingView>
  );
};

export default OnboardingForm;