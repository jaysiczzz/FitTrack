import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, Image } from 'react-native';
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

    // Live API fetch for authentic athlete stories submitted by real users
    let isMounted = true;
    getTestimonialsApi(selectedGoal, 'featured', 3)
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

      {/* Verified Athlete Social Proof Card */}
      {selectedGoal && activeStory ? (
        <View className="mb-3.5 p-3.5 rounded-2xl bg-accent/10 dark:bg-accent-dark/15 border border-accent/25">
          {/* Top Row: User Avatar, Name, Verified Badge, Star Rating */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2 flex-1 mr-2">
              {activeStory.avatarUrl && !activeStory.avatarUrl.startsWith('blob:') ? (
                <Image
                  source={{ uri: activeStory.avatarUrl }}
                  className="w-7 h-7 rounded-full border border-accent/40 bg-input dark:bg-input-dark"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-7 h-7 rounded-full bg-accent/20 dark:bg-accent-dark/25 items-center justify-center border border-accent/35 dark:border-accent-dark/50">
                  <Text className="text-xs font-black text-accent dark:text-accent-dark">
                    {activeStory.authorName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View className="flex-1">
                <View className="flex-row items-center gap-1">
                  <Text
                    numberOfLines={1}
                    className="text-xs font-bold text-text-primary dark:text-text-primary-dark"
                  >
                    {activeStory.authorName}
                  </Text>
                  {activeStory.verifiedAthlete !== false ? (
                    <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                  ) : null}
                </View>
                <Text className="text-[10px] text-text-muted dark:text-text-muted-dark">
                  {activeStory.goal === 'MUSCLE_GAIN'
                    ? 'Muscle Gain Athlete'
                    : activeStory.goal === 'WEIGHT_LOSS'
                    ? 'Fat Loss Athlete'
                    : 'FitTrack Athlete'}
                </Text>
              </View>
            </View>

            {/* Star Rating */}
            <View className="flex-row items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons
                  key={s}
                  name={s <= activeStory.rating ? 'star' : 'star-outline'}
                  size={11}
                  color="#F59E0B"
                />
              ))}
            </View>
          </View>

          {/* Transformation Milestones & Metrics Row */}
          <View className="flex-row flex-wrap gap-1.5 mb-2">
            {activeStory.highlightBadge ? (
              <View className="px-2 py-0.5 rounded-md bg-accent/20 dark:bg-accent-dark/25 border border-accent/30 dark:border-accent-dark/40">
                <Text className="text-[10px] font-bold text-accent dark:text-accent-dark">
                  {activeStory.highlightBadge}
                </Text>
              </View>
            ) : null}

            {activeStory.weightChangeKg !== undefined && activeStory.weightChangeKg !== null ? (
              <View className="px-2 py-0.5 rounded-md bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/30 dark:border-emerald-500/40">
                <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  {activeStory.weightChangeKg > 0
                    ? `+${activeStory.weightChangeKg} kg`
                    : `${activeStory.weightChangeKg} kg`}
                </Text>
              </View>
            ) : null}

            {activeStory.durationWeeks ? (
              <View className="px-2 py-0.5 rounded-md bg-purple-500/15 dark:bg-purple-500/25 border border-purple-500/30 dark:border-purple-500/40">
                <Text className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
                  ⏱️ {activeStory.durationWeeks} wks
                </Text>
              </View>
            ) : null}

            {activeStory.helpfulCount ? (
              <View className="px-2 py-0.5 rounded-md bg-input dark:bg-input-dark border border-input-border/60 dark:border-input-border-dark/60 flex-row items-center gap-1">
                <Ionicons name="heart" size={9} color={colors.accent} />
                <Text className="text-[10px] font-semibold text-text-muted dark:text-text-muted-dark">
                  {activeStory.helpfulCount}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Quote Body */}
          <Text className="text-xs italic text-text-primary dark:text-text-primary-dark leading-relaxed">
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
