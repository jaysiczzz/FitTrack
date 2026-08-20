export interface LibraryExercise {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  type: string;
  difficulty?: string;
  primaryMuscle?: string;
  muscleGroup: string;
  secondaryMuscles?: string[] | any;
  bodyPart?: string;
  equipment?: string[] | any;
  equipmentAlternatives?: string[] | any;
  startingPosition?: string | null;
  instructions?: string[] | any;
  formTips?: string[] | any;
  commonMistakes?: string[] | any;
  breathingTechnique?: string | null;
  recommendedSets?: number;
  recommendedReps?: number;
  recommendedDuration?: number;
  recommendedRest?: number;
  recommendedTempo?: string | null;
  defaultSets: { weight?: string | number; reps?: string | number; bodyweight?: boolean }[];
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  gifUrl?: string | null;
  videoUrl?: string | null;
  safetyInstructions?: string | null;
  injuryPreventionTips?: string | null;
  beginnerModification?: string | null;
  advancedVariation?: string | null;
  easierAlternative?: string | null;
  harderAlternative?: string | null;
  equipmentFreeAlternative?: string | null;
  similarExercises?: string[] | any;
  tags?: string[] | any;
}

export interface CompletedSession {
  id: string;
  date: string;
  title: string;
  duration: string;
  caloriesBurned: number;
  exercisesCount: number;
  exercises: { name: string; setsSummary: string }[];
}

export const MOCK_LIBRARY: LibraryExercise[] = [
  {
    id: 'lib-1',
    name: 'Bench Press',
    description: 'A classic upper-body compound exercise that builds chest strength, shoulder power, and tricep stability.',
    category: 'Strength',
    type: 'Compound',
    difficulty: 'Intermediate',
    primaryMuscle: 'Chest',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Triceps', 'Shoulders'],
    bodyPart: 'Upper Body',
    equipment: ['Barbell', 'Bench'],
    equipmentAlternatives: ['Dumbbells', 'Chest Press Machine'],
    startingPosition: 'Lie flat on the bench with your feet firmly planted on the floor and eyes directly underneath the bar.',
    instructions: [
      'Grip the bar slightly wider than shoulder-width with wrists straight.',
      'Unrack the bar and balance it directly over your mid-chest.',
      'Slowly lower the bar toward your sternum under strict control.',
      'Press the bar upward explosively while driving feet into the ground.',
      'Re-rack safely upon completing the prescribed repetitions.',
    ],
    formTips: ['Keep feet planted flat on the floor.', 'Maintain a slight natural arch in lower back.'],
    commonMistakes: ['Bouncing the bar off the chest.', 'Flaring elbows out to 90 degrees.'],
    breathingTechnique: 'Inhale deeply as you lower the bar; exhale forcefully as you press up.',
    recommendedSets: 3,
    recommendedReps: 10,
    recommendedRest: 90,
    defaultSets: [
      { weight: '60', reps: '10' },
      { weight: '65', reps: '8' },
      { weight: '70', reps: '6' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Always use a spotter or safety pin arms when attempting heavy sets.',
    injuryPreventionTips: 'Warm up shoulders and wrists before pressing heavy loads.',
    beginnerModification: 'Push-ups or Machine Chest Press',
    advancedVariation: 'Incline Barbell Bench Press',
    easierAlternative: 'Machine Chest Press',
    harderAlternative: 'Incline Barbell Bench Press',
    equipmentFreeAlternative: 'Push-ups',
    similarExercises: ['Dumbbell Bench Press', 'Incline Dumbbell Press'],
    tags: ['chest', 'push', 'barbell', 'upper-body', 'strength'],
  },
  {
    id: 'lib-2',
    name: 'Incline Dumbbell Press',
    description: 'Targets the upper clavicular portion of the chest.',
    category: 'Strength',
    type: 'Compound',
    difficulty: 'Intermediate',
    primaryMuscle: 'Chest',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps'],
    bodyPart: 'Upper Body',
    equipment: ['Dumbbells', 'Incline Bench'],
    equipmentAlternatives: ['Incline Barbell Press'],
    startingPosition: 'Sit on an incline bench set to 30-45 degrees holding dumbbells.',
    instructions: [
      'Press the dumbbells straight up directly above your upper chest.',
      'Lower the dumbbells with control until palms are near chest height.',
      'Press back up converging dumbbells slightly at the top.',
    ],
    formTips: ['Keep bench angle at 30-45 degrees.', 'Drive shoulders back.'],
    commonMistakes: ['Setting bench angle too high.'],
    breathingTechnique: 'Inhale on the descent; exhale on the push.',
    recommendedSets: 3,
    recommendedReps: 10,
    recommendedRest: 75,
    defaultSets: [
      { weight: '22', reps: '10' },
      { weight: '24', reps: '10' },
      { weight: '24', reps: '8' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200&auto=format&fit=crop&q=60',
    tags: ['chest', 'incline', 'dumbbells', 'push'],
  },
  {
    id: 'lib-3',
    name: 'Pull-ups',
    description: 'King of upper-body pull exercises targeting latissimus dorsi.',
    category: 'Strength',
    type: 'Bodyweight',
    difficulty: 'Intermediate',
    primaryMuscle: 'Back',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Forearms'],
    bodyPart: 'Upper Body',
    equipment: ['Pull-up Bar'],
    equipmentAlternatives: ['Lat Pulldown Machine'],
    startingPosition: 'Hang from pull-up bar with overhand grip wider than shoulders.',
    instructions: [
      'Pull up until chin clears over top of bar.',
      'Lower smoothly to full arm extension.',
    ],
    formTips: ['Initiate movement by pulling shoulder blades down.'],
    commonMistakes: ['Swinging lower body.'],
    breathingTechnique: 'Exhale while pulling up; inhale lowering down.',
    recommendedSets: 3,
    recommendedReps: 10,
    recommendedRest: 90,
    defaultSets: [
      { bodyweight: true, reps: '12' },
      { bodyweight: true, reps: '10' },
      { bodyweight: true, reps: '8' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=200&auto=format&fit=crop&q=60',
    tags: ['back', 'pull', 'bodyweight', 'upper-body'],
  },
];

export const MOCK_HISTORY: CompletedSession[] = [];
