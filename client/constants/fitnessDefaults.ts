/**
 * Fitness, nutrition, and biometric default thresholds and multipliers
 */

export const DEFAULT_WATER_TARGET_ML = 2500;
export const DEFAULT_WATER_TARGET_MALE_ML = 3000;
export const DEFAULT_WATER_TARGET_FEMALE_ML = 2200;
export const MIN_WATER_TARGET_ML = 2000;
export const WATER_INCREMENT_SMALL_ML = 250;
export const WATER_INCREMENT_LARGE_ML = 500;

// Mifflin-St Jeor clinical constants (American Dietetic Association validated)
export const BMR_OFFSET = {
  MALE: 5,
  FEMALE: -161,
} as const;

// Safe minimum daily caloric thresholds (ACSM clinical guidelines)
export const MIN_CALORIE_FLOOR = {
  MALE: 1400,
  FEMALE: 1200,
} as const;

// Minimum dietary fat ratio for endocrine health & hormone synthesis
export const DIETARY_FAT_RATIO = {
  MALE: 0.25,
  FEMALE: 0.28,
} as const;

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
