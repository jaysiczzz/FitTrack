import { Ionicons } from '@expo/vector-icons';

export interface QuickStartContext {
  isCheckedIn: boolean;
  hasLoggedMeal: boolean;
  hasLoggedWorkout: boolean;
  step3Completed: boolean;
}

export interface QuickStartHandlers {
  onCheckInPress: () => void;
  onLogMealPress: () => void;
  onWorkoutPress: () => void;
  onAiCoachPress: () => void;
}

export interface QuickStartAction {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'link';
  onPress: (handlers: QuickStartHandlers) => void;
}

export interface QuickStartStepConfig {
  id: string;
  title: string;
  description: string;
  completedDescription: string;
  icon: keyof typeof Ionicons.glyphMap;
  isCompleted: (ctx: QuickStartContext) => boolean;
  actions: QuickStartAction[];
}

export const QUICK_START_STEPS: QuickStartStepConfig[] = [
  {
    id: 'checkin',
    title: '1. Daily Readiness',
    description: 'Log your energy to activate your streak.',
    completedDescription: 'Readiness logged · Streak active',
    icon: 'pulse-outline',
    isCompleted: (ctx) => ctx.isCheckedIn,
    actions: [
      {
        id: 'checkin-btn',
        label: 'Check In',
        variant: 'primary',
        onPress: (h) => h.onCheckInPress(),
      },
    ],
  },
  {
    id: 'meal',
    title: '2. Log a Meal',
    description: 'Track calories with AI scanner or search.',
    completedDescription: 'Logged towards daily targets',
    icon: 'camera-outline',
    isCompleted: (ctx) => ctx.hasLoggedMeal,
    actions: [
      {
        id: 'meal-btn',
        label: 'Log Meal',
        variant: 'primary',
        onPress: (h) => h.onLogMealPress(),
      },
    ],
  },
  {
    id: 'coach-workout',
    title: '3. Meet Your 24/7 AI Coach',
    description: 'Ask fitness questions or get personalized advice.',
    completedDescription: 'Coaching & routines unlocked',
    icon: 'chatbubble-ellipses-outline',
    isCompleted: (ctx) => ctx.step3Completed,
    actions: [
      {
        id: 'ask-coach-btn',
        label: 'Ask AI',
        variant: 'primary',
        onPress: (h) => h.onAiCoachPress(),
      },
      {
        id: 'workout-link',
        label: "or start today's workout",
        variant: 'link',
        onPress: (h) => h.onWorkoutPress(),
      },
    ],
  },
];
