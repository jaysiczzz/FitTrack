export type FeatureKey = 'COACH' | 'FOOD_SCAN' | 'WORKOUT_GENERATOR' | 'MEAL_SUGGESTION';
export type TierKey = 'FREE' | 'PRO';

export interface FeatureLimitConfig {
  max: number;
  period: 'day' | 'month';
  name: string;
  unit: string;
}

export const FEATURE_LIMITS: Record<TierKey, Record<FeatureKey, FeatureLimitConfig>> = {
  FREE: {
    COACH: {
      max: 15,
      period: 'day',
      name: 'AI Fitness Coach',
      unit: 'msgs/day',
    },
    FOOD_SCAN: {
      max: 3,
      period: 'day',
      name: 'AI Camera Food Scanner',
      unit: 'scans/day',
    },
    WORKOUT_GENERATOR: {
      max: 5,
      period: 'month',
      name: 'AI Workout Routine Generator',
      unit: 'routines/month',
    },
    MEAL_SUGGESTION: {
      max: 5,
      period: 'day',
      name: 'AI Smart Meal Suggestions',
      unit: 'suggestions/day',
    },
  },
  PRO: {
    COACH: {
      max: 150,
      period: 'day',
      name: 'AI Fitness Coach',
      unit: 'msgs/day',
    },
    FOOD_SCAN: {
      max: 30,
      period: 'day',
      name: 'AI Camera Food Scanner',
      unit: 'scans/day',
    },
    WORKOUT_GENERATOR: {
      max: 30,
      period: 'month',
      name: 'AI Workout Routine Generator',
      unit: 'routines/month',
    },
    MEAL_SUGGESTION: {
      max: 30,
      period: 'day',
      name: 'AI Smart Meal Suggestions',
      unit: 'suggestions/day',
    },
  },
};
