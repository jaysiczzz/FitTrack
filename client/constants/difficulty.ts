/**
 * Centralized Difficulty & Intensity Color System
 * Unified cross-app design tokens for Workouts:
 * 🟢 Beginner: Emerald Green (Base intensity, accessible, safe)
 * 🟡 Intermediate: Amber / Warm Gold (Moderate progressive overload)
 * 🔴 Advanced: Red / Danger (Peak intensity, heavy loads, high volume)
 */

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface DifficultyStyle {
  label: DifficultyLevel;
  badgeContainer: string;
  badgeText: string;
  activeButton: string;
  activeText: string;
  icon: 'leaf-outline' | 'flash-outline' | 'flame-outline';
  hexColor: string;
  darkHexColor: string;
  emoji: string;
}

export const getDifficultyStyle = (difficulty?: string | null): DifficultyStyle => {
  const norm = (difficulty || '').toLowerCase().trim();

  if (norm.includes('adv')) {
    return {
      label: 'Advanced',
      badgeContainer: 'bg-danger/15 dark:bg-danger-dark/20 border-danger/35 dark:border-danger-dark/40',
      badgeText: 'text-danger dark:text-danger-dark',
      activeButton: 'bg-danger dark:bg-danger-dark',
      activeText: 'text-white',
      icon: 'flame-outline',
      hexColor: '#DC2626',
      darkHexColor: '#F87171',
      emoji: '🔴',
    };
  }

  if (norm.includes('beg') || norm.includes('found')) {
    return {
      label: 'Beginner',
      badgeContainer: 'bg-accent/15 dark:bg-accent-dark/20 border-accent/35 dark:border-accent-dark/40',
      badgeText: 'text-accent dark:text-accent-dark',
      activeButton: 'bg-accent dark:bg-accent-dark',
      activeText: 'text-white',
      icon: 'leaf-outline',
      hexColor: '#047857',
      darkHexColor: '#10B981',
      emoji: '🟢',
    };
  }

  // Default fallback: Intermediate
  return {
    label: 'Intermediate',
    badgeContainer: 'bg-warning/15 dark:bg-warning-dark/20 border-warning/35 dark:border-warning-dark/40',
    badgeText: 'text-warning dark:text-warning-dark',
    activeButton: 'bg-warning dark:bg-warning-dark',
    activeText: 'text-white',
    icon: 'flash-outline',
    hexColor: '#B45309',
    darkHexColor: '#FBBF24',
    emoji: '🟡',
  };
};
