import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import Button from '@/components/ui/Button';

interface OnboardingGoalStepProps {
  selectedGoal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS' | '';
  onSelectGoal: (goal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS') => void;
  onNext: () => void;
  error?: string;
}

const GOALS = [
  {
    id: 'MUSCLE_GAIN' as const,
    title: 'Muscle Gain',
    badge: 'Hypertrophy & Strength',
    description: 'Optimize progressive overload, muscle synthesis, and high-protein nutrition.',
    tags: ['Progressive Overload', 'High Protein'],
  },
  {
    id: 'WEIGHT_LOSS' as const,
    title: 'Weight Loss',
    badge: 'Fat Loss & Lean Definition',
    description: 'Shed body fat and boost metabolism while preserving lean muscle mass.',
    tags: ['Caloric Deficit', 'Metabolic Split'],
  },
];

const OnboardingGoalStep: React.FC<OnboardingGoalStepProps> = ({
  selectedGoal,
  onSelectGoal,
  onNext,
  error,
}) => {

  return (
    <View className="w-full">
      <View className="mb-4">
        {GOALS.map((item) => {
          const isSelected = selectedGoal === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => onSelectGoal(item.id)}
              className={`p-3.5 mb-2.5 rounded-xl transition-all ${
                isSelected
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-2 border-emerald-500 dark:border-emerald-400'
                  : 'bg-surface dark:bg-surface-dark border border-input-border/70 dark:border-input-border-dark/70'
              }`}
              style={
                isSelected && Platform.OS === 'web'
                  ? ({ boxShadow: '0 2px 10px rgba(16, 185, 129, 0.15)' } as any)
                  : undefined
              }
            >
              <View className="flex-row items-center justify-between mb-1.5">
                <View className="flex-1 pr-2">
                  <Text
                    className={`font-bold text-sm ${
                      isSelected
                        ? 'text-accent dark:text-accent-dark'
                        : 'text-text-primary dark:text-text-primary-dark'
                    }`}
                  >
                    {item.title}
                  </Text>
                  <Text className="text-text-muted dark:text-text-muted-dark text-[10px] font-semibold uppercase tracking-wider">
                    {item.badge}
                  </Text>
                </View>

                <View
                  className={`w-5 h-5 rounded-full items-center justify-center border ${
                    isSelected
                      ? 'bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark'
                      : 'border-input-border dark:border-input-border-dark bg-background dark:bg-background-dark'
                  }`}
                >
                  {isSelected ? (
                    <Text className="text-accent-contrast dark:text-accent-contrast-dark text-[10px] font-extrabold">✓</Text>
                  ) : null}
                </View>
              </View>

              <Text className="text-text-muted dark:text-text-muted-dark text-[11px] leading-tight mb-2">
                {item.description}
              </Text>

              <View className="flex-row flex-wrap gap-1.5">
                {item.tags.map((tag, idx) => (
                  <View
                    key={idx}
                    className={`px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-accent/20 dark:bg-accent-dark/25'
                        : 'bg-background dark:bg-background-dark'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-semibold ${
                        isSelected
                          ? 'text-accent dark:text-accent-dark'
                          : 'text-text-muted dark:text-text-muted-dark'
                      }`}
                    >
                      • {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? (
        <Text className="text-red-500 text-[11px] mb-2.5 text-center font-medium">{error}</Text>
      ) : null}

      <Button
        title="Continue to Body Stats →"
        disabled={!selectedGoal}
        onPress={onNext}
      />
    </View>
  );
};

export default OnboardingGoalStep;
