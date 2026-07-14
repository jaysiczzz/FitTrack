import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import GoalCard from '@/components/auth/GoalCard';
import colors from '@/constants/colors';

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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.row}>
        <View style={styles.half}>
          <Input label="Height" placeholder="170 (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" />
        </View>
        <View style={styles.half}>
          <Input label="Weight" placeholder="70 (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" />
        </View>
      </View>

      <Input label="Age" placeholder="25" value={age} onChangeText={setAge} keyboardType="numeric" />

      <Text style={styles.goalLabel}>WHAT'S YOUR GOAL?</Text>
      <View style={styles.rowBetween}>
        <GoalCard label="Muscle Gain" icon="💪" selected={goal === 'muscle'} onPress={() => setGoal('muscle')} />
        <GoalCard label="Weight Loss" icon="🔥" selected={goal === 'weight'} onPress={() => setGoal('weight')} />
      </View>

      <View style={styles.createButton}>
        <Button title="Create My Plan" onPress={() => onSubmit({ height, weight, age, goal })} />
      </View>

      <Text style={styles.footerText}>You can update this anytime</Text>
      
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  half: {
    width: '48%',
  },
  goalLabel: {
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 12,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  createButton: {
  
    marginTop: 22,

  },
  footerText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    fontSize: 12,
  },
  debugRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  debugText: {
    color: colors.textMuted,
    fontSize: 11,
  },
});

export default OnboardingForm;
