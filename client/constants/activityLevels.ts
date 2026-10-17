export type ActivityLevel = 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.20,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
};

export interface ActivityLevelOption {
  key: ActivityLevel;
  label: string;
  multiplier: number;
  description: string;
  icon: string;
}

export const ACTIVITY_LEVEL_OPTIONS: ActivityLevelOption[] = [
  {
    key: 'SEDENTARY',
    label: 'Sedentary',
    multiplier: 1.20,
    description: 'Little or no exercise, desk job',
    icon: '🛋️',
  },
  {
    key: 'LIGHTLY_ACTIVE',
    label: 'Lightly Active',
    multiplier: 1.375,
    description: 'Light exercise 1-3 days/week',
    icon: '🚶',
  },
  {
    key: 'MODERATELY_ACTIVE',
    label: 'Moderately Active',
    multiplier: 1.55,
    description: 'Moderate exercise 3-5 days/week',
    icon: '🏃',
  },
  {
    key: 'VERY_ACTIVE',
    label: 'Very Active',
    multiplier: 1.725,
    description: 'Hard training / sports 6-7 days/week',
    icon: '⚡',
  },
];
