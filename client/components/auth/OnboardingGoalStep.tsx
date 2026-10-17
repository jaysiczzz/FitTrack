import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useThemeColors } from '@/constants/colors';
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
  const { colors, isDark } = useThemeColors();

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
              className="p-3.5 mb-2.5 rounded-2xl"
              style={[
                {
                  backgroundColor: isSelected
                    ? isDark
                      ? '#082820'
                      : '#ECFDF5'
                    : isDark
                    ? '#151E2E'
                    : '#FFFFFF',
                  borderColor: isSelected
                    ? isDark
                      ? '#10B981'
                      : '#059669'
                    : isDark
                    ? '#334155'
                    : '#E2E8F0',
                  borderWidth: isSelected ? 2 : 1,
                },
                isSelected && Platform.OS === 'web'
                  ? ({ boxShadow: '0 2px 10px rgba(16, 185, 129, 0.15)' } as any)
                  : undefined,
              ]}
            >
              <View className="flex-row items-center justify-between mb-1.5">
                <View className="flex-1 pr-2">
                  <Text
                    className="font-bold text-sm"
                    style={{
                      color: isSelected
                        ? isDark
                          ? '#6EE7B7'
                          : '#065F46'
                        : colors.textPrimary,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    className="text-[10px] font-semibold uppercase tracking-wider mt-0.5"
                    style={{
                      color: isSelected
                        ? isDark
                          ? '#34D399'
                          : '#059669'
                        : colors.textMuted,
                    }}
                  >
                    {item.badge}
                  </Text>
                </View>

                <View
                  className="w-5 h-5 rounded-full items-center justify-center border"
                  style={{
                    backgroundColor: isSelected
                      ? isDark
                        ? '#10B981'
                        : '#059669'
                      : isDark
                      ? '#1A2333'
                      : '#F1F5F9',
                    borderColor: isSelected
                      ? isDark
                        ? '#10B981'
                        : '#059669'
                      : isDark
                      ? '#334155'
                      : '#CBD5E1',
                  }}
                >
                  {isSelected ? (
                    <Text className="text-white text-[10px] font-extrabold">✓</Text>
                  ) : null}
                </View>
              </View>

              <Text
                className="text-[11px] leading-relaxed mb-2"
                style={{
                  color: isSelected
                    ? isDark
                      ? '#D1D5DB'
                      : '#374151'
                    : colors.textMuted,
                }}
              >
                {item.description}
              </Text>

              <View className="flex-row flex-wrap gap-1.5">
                {item.tags.map((tag, idx) => (
                  <View
                    key={idx}
                    className="px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: isSelected
                        ? isDark
                          ? '#0E3A2F'
                          : '#D1FAE5'
                        : isDark
                        ? '#1A2333'
                        : '#F1F5F9',
                    }}
                  >
                    <Text
                      className="text-[10px] font-semibold"
                      style={{
                        color: isSelected
                          ? isDark
                            ? '#34D399'
                            : '#047857'
                          : colors.textMuted,
                      }}
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
