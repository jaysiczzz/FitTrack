/**
 * Fitness, nutrition, and biometric default thresholds and multipliers
 */

export const DEFAULT_WATER_TARGET_ML = 2500;
export const MIN_WATER_TARGET_ML = 2000;
export const WATER_INCREMENT_SMALL_ML = 250;
export const WATER_INCREMENT_LARGE_ML = 500;

export const DEFAULT_MACRO_TARGETS = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fat: 65,
} as const;

export const CALORIE_MULTIPLIERS = {
  protein: 4,
  carbs: 4,
  fat: 9,
} as const;
