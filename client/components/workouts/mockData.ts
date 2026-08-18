export interface LibraryExercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';
  type: 'Strength' | 'Cardio' | 'Flexibility' | 'Calisthenics';
  defaultSets: { weight?: string; reps?: string; bodyweight?: boolean }[];
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
    category: 'Chest · Primary',
    muscleGroup: 'Chest',
    type: 'Strength',
    defaultSets: [
      { weight: '60', reps: '10' },
      { weight: '65', reps: '8' },
      { weight: '70', reps: '6' },
    ],
  },
  {
    id: 'lib-2',
    name: 'Incline Dumbbell Press',
    category: 'Chest · Secondary',
    muscleGroup: 'Chest',
    type: 'Strength',
    defaultSets: [
      { weight: '22', reps: '10' },
      { weight: '24', reps: '10' },
      { weight: '24', reps: '8' },
    ],
  },
  {
    id: 'lib-3',
    name: 'Pull-ups',
    category: 'Back · Primary',
    muscleGroup: 'Back',
    type: 'Calisthenics',
    defaultSets: [
      { bodyweight: true, reps: '12' },
      { bodyweight: true, reps: '10' },
      { bodyweight: true, reps: '8' },
    ],
  },
  {
    id: 'lib-4',
    name: 'Bent-Over Barbell Row',
    category: 'Back · Secondary',
    muscleGroup: 'Back',
    type: 'Strength',
    defaultSets: [
      { weight: '50', reps: '10' },
      { weight: '55', reps: '8' },
      { weight: '60', reps: '8' },
    ],
  },
  {
    id: 'lib-5',
    name: 'Barbell Squat',
    category: 'Legs · Primary',
    muscleGroup: 'Legs',
    type: 'Strength',
    defaultSets: [
      { weight: '80', reps: '8' },
      { weight: '90', reps: '6' },
      { weight: '100', reps: '5' },
    ],
  },
  {
    id: 'lib-6',
    name: 'Romanian Deadlift',
    category: 'Legs · Hamstrings',
    muscleGroup: 'Legs',
    type: 'Strength',
    defaultSets: [
      { weight: '70', reps: '10' },
      { weight: '75', reps: '8' },
    ],
  },
  {
    id: 'lib-7',
    name: 'Overhead Shoulder Press',
    category: 'Shoulders · Primary',
    muscleGroup: 'Shoulders',
    type: 'Strength',
    defaultSets: [
      { weight: '40', reps: '10' },
      { weight: '45', reps: '8' },
    ],
  },
  {
    id: 'lib-8',
    name: 'Lateral Dumbbell Raises',
    category: 'Shoulders · Isolation',
    muscleGroup: 'Shoulders',
    type: 'Strength',
    defaultSets: [
      { weight: '10', reps: '15' },
      { weight: '12', reps: '12' },
    ],
  },
  {
    id: 'lib-9',
    name: 'Barbell Bicep Curl',
    category: 'Arms · Biceps',
    muscleGroup: 'Arms',
    type: 'Strength',
    defaultSets: [
      { weight: '25', reps: '12' },
      { weight: '30', reps: '10' },
    ],
  },
  {
    id: 'lib-10',
    name: 'Hanging Leg Raise',
    category: 'Core · Abs',
    muscleGroup: 'Core',
    type: 'Calisthenics',
    defaultSets: [
      { bodyweight: true, reps: '15' },
      { bodyweight: true, reps: '15' },
    ],
  },
];

export const MOCK_HISTORY: CompletedSession[] = [
  {
    id: 'hist-1',
    date: 'Yesterday, Aug 4',
    title: 'Upper Body Power',
    duration: '45 min',
    caloriesBurned: 320,
    exercisesCount: 4,
    exercises: [
      { name: 'Bench Press', setsSummary: '3 sets · Max 70kg' },
      { name: 'Pull-ups', setsSummary: '3 sets · Bodyweight' },
      { name: 'Barbell Bicep Curl', setsSummary: '2 sets · Max 30kg' },
      { name: 'Overhead Shoulder Press', setsSummary: '2 sets · Max 45kg' },
    ],
  },
  {
    id: 'hist-2',
    date: 'Aug 2, 2026',
    title: 'Lower Body & Core',
    duration: '52 min',
    caloriesBurned: 410,
    exercisesCount: 3,
    exercises: [
      { name: 'Barbell Squat', setsSummary: '3 sets · Max 100kg' },
      { name: 'Romanian Deadlift', setsSummary: '2 sets · Max 75kg' },
      { name: 'Hanging Leg Raise', setsSummary: '2 sets · Bodyweight' },
    ],
  },
  {
    id: 'hist-3',
    date: 'Jul 31, 2026',
    title: 'Back & Biceps Focus',
    duration: '40 min',
    caloriesBurned: 280,
    exercisesCount: 3,
    exercises: [
      { name: 'Pull-ups', setsSummary: '3 sets · Bodyweight' },
      { name: 'Bent-Over Barbell Row', setsSummary: '3 sets · Max 60kg' },
      { name: 'Barbell Bicep Curl', setsSummary: '2 sets · Max 25kg' },
    ],
  },
];
