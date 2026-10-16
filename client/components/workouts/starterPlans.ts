import { WorkoutRoutineTemplate } from './workoutTypes';

export type Goal = 'MUSCLE_GAIN' | 'WEIGHT_LOSS';

export type StarterPlan = WorkoutRoutineTemplate;

export const STARTER_PLANS: Record<Goal, StarterPlan> = {
  MUSCLE_GAIN: {
    id: 'starter-plan-muscle-gain',
    title: 'Day 1: Upper Body Strength & Foundations',
    description: 'Safe, guided dumbbell and machine movements (Chest, Back, Arms) with light starter weights to build form and confidence.',
    category: 'Hypertrophy',
    targetMuscleGroup: 'Chest, Back & Arms',
    estimatedDurationMinutes: 30,
    exercises: [
      {
        exerciseId: 'ex-dumbbell-bench-press',
        name: 'Flat Dumbbell Bench Press',
        category: 'Strength',
        type: 'Compound',
        primaryMuscle: 'Chest',
        muscleGroup: 'Chest',
        defaultSets: [
          { reps: 10 },
          { reps: 10 },
          { reps: 8 },
        ],
      },
      {
        exerciseId: 'ex-lat-pulldown',
        name: 'Lat Pulldown',
        category: 'Strength',
        type: 'Compound',
        primaryMuscle: 'Back',
        muscleGroup: 'Back',
        defaultSets: [
          { reps: 10 },
          { reps: 10 },
          { reps: 8 },
        ],
      },
      {
        exerciseId: 'ex-barbell-bicep-curl',
        name: 'Barbell Bicep Curl',
        category: 'Strength',
        type: 'Isolation',
        primaryMuscle: 'Arms',
        muscleGroup: 'Arms',
        defaultSets: [
          { reps: 10 },
          { reps: 10 },
          { reps: 10 },
        ],
      },
      {
        exerciseId: 'ex-tricep-rope-pushdown',
        name: 'Tricep Rope Pushdown',
        category: 'Strength',
        type: 'Isolation',
        primaryMuscle: 'Arms',
        muscleGroup: 'Arms',
        defaultSets: [
          { reps: 12 },
          { reps: 10 },
          { reps: 10 },
        ],
      },
    ],
  },
  WEIGHT_LOSS: {
    id: 'starter-plan-weight-loss',
    title: 'Day 1: Full-Body Calorie Burn Circuit',
    description: 'Beginner-friendly bodyweight & light dumbbell movements engineered to elevate heart rate, build core stability, and burn calories.',
    category: 'Circuit',
    targetMuscleGroup: 'Full Body',
    estimatedDurationMinutes: 25,
    exercises: [
      {
        exerciseId: 'ex-goblet-squat',
        name: 'Dumbbell Goblet Squat',
        category: 'Strength',
        type: 'Compound',
        primaryMuscle: 'Legs',
        muscleGroup: 'Legs',
        defaultSets: [
          { reps: 10 },
          { reps: 10 },
          { reps: 10 },
        ],
      },
      {
        exerciseId: 'ex-push-ups',
        name: 'Push-ups (or Knee Push-ups)',
        category: 'Strength',
        type: 'Compound',
        primaryMuscle: 'Chest',
        muscleGroup: 'Chest',
        defaultSets: [
          { bodyweight: true, reps: 8 },
          { bodyweight: true, reps: 8 },
          { bodyweight: true, reps: 6 },
        ],
      },
      {
        exerciseId: 'ex-one-arm-dumbbell-row',
        name: 'One-Arm Dumbbell Row',
        category: 'Strength',
        type: 'Compound',
        primaryMuscle: 'Back',
        muscleGroup: 'Back',
        defaultSets: [
          { reps: 10 },
          { reps: 10 },
          { reps: 10 },
        ],
      },
      {
        exerciseId: 'ex-plank',
        name: 'Plank',
        category: 'Core',
        type: 'Isometric',
        primaryMuscle: 'Core',
        muscleGroup: 'Core',
        defaultSets: [
          { bodyweight: true, reps: 20 },
          { bodyweight: true, reps: 20 },
          { bodyweight: true, reps: 20 },
        ],
      },
    ],
  },
};
