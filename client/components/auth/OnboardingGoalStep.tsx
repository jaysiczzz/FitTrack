import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import { useThemeColors } from '@/constants/colors';
import { getTestimonialsApi, TestimonialItem } from '@/api/testimonial';

interface OnboardingGoalStepProps {
  selectedGoal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS' | '';
  onSelectGoal: (goal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS') => void;
  onNext: () => void;
  error?: string;
}


const GOALS = [
  {
    id: 'MUSCLE_GAIN' as const,
    title: 'Build Muscle & Strength',
    badge: 'Hypertrophy & Power',
    description: 'Optimize progressive overload, muscle synthesis, and high-protein nutrition.',
    tags: ['Progressive Overload', 'High Protein'],
  },
  {
    id: 'WEIGHT_LOSS' as const,
    title: 'Burn Fat & Get Lean',
    badge: 'Fat Loss & Recomp',
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
  const { colors } = useThemeColors();
  const [activeStory, setActiveStory] = useState<TestimonialItem | null>(null);

  useEffect(() => {
    if (!selectedGoal) {
      setActiveStory(null);
      return;
    }

    // Live API fetch for verified athlete stories
    let isMounted = true;
    getTestimonialsApi(selectedGoal)
      .then((res) => {
        if (isMounted && res.testimonials && res.testimonials.length > 0) {
          setActiveStory(res.testimonials[0]);
        } else if (isMounted) {
          setActiveStory(null);
        }
      })
      .catch(() => {
        if (isMounted) setActiveStory(null);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedGoal]);

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
              className={`p-3.5 mb-2.5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-accent/10 dark:bg-accent-dark/15 border-accent dark:border-accent-dark'
                  : 'bg-surface dark:bg-surface-dark border-input-border/70 dark:border-input-border-dark/70'
              }`}
              style={
                isSelected
                  ? Platform.select({
                      web: {
                        boxShadow: '0 2px 10px rgba(0, 229, 160, 0.15)',
                      } as any,
                      default: {
                        shadowColor: '#00E5A0',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 6,
                        elevation: 2,
                      },
                    })
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
                    <Text className="text-black text-[10px] font-extrabold">✓</Text>
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

      {/* Verified Athlete Social Proof Card */}
      {selectedGoal && activeStory ? (
        <View className="mb-3.5 p-3 rounded-2xl bg-accent/10 dark:bg-accent-dark/15 border border-accent/25">
          <View className="flex-row items-center justify-between mb-1.5">
            <View className="flex-row items-center space-x-2">
              <View className="w-5 h-5 rounded-full bg-accent/25 items-center justify-center">
                <Text className="text-[10px] font-black text-accent dark:text-accent-mint">
                  {activeStory.authorName.charAt(0)}
                </Text>
              </View>
              <Text className="text-xs font-bold text-text-primary dark:text-text-primary-dark">
                {activeStory.authorName}
              </Text>
              {activeStory.highlightBadge ? (
                <View className="px-1.5 py-0.5 rounded-full bg-accent/20 border border-accent/30">
                  <Text className="text-[9px] font-extrabold text-accent dark:text-accent-mint">
                    {activeStory.highlightBadge}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="flex-row items-center space-x-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons
                  key={s}
                  name={s <= activeStory.rating ? 'star' : 'star-outline'}
                  size={10}
                  color="#F59E0B"
                />
              ))}
            </View>
          </View>
          <Text className="text-[11px] italic text-text-primary dark:text-text-primary-dark leading-snug">
            "{activeStory.content}"
          </Text>
        </View>
      ) : null}

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
