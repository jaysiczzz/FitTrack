import { WorkoutRoutineTemplate, DayOfWeek, WeeklySplit, MesocycleWeekInfo } from './workoutTypes';

export const DAYS_OF_WEEK: { key: DayOfWeek; label: string; full: string }[] = [
  { key: 'mon', label: 'Mon', full: 'Monday' },
  { key: 'tue', label: 'Tue', full: 'Tuesday' },
  { key: 'wed', label: 'Wed', full: 'Wednesday' },
  { key: 'thu', label: 'Thu', full: 'Thursday' },
  { key: 'fri', label: 'Fri', full: 'Friday' },
  { key: 'sat', label: 'Sat', full: 'Saturday' },
  { key: 'sun', label: 'Sun', full: 'Sunday' },
];

export const getDayOfWeekFromDate = (d: Date): DayOfWeek => {
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const map: Record<number, DayOfWeek> = {
    0: 'sun',
    1: 'mon',
    2: 'tue',
    3: 'wed',
    4: 'thu',
    5: 'fri',
    6: 'sat',
  };
  return map[day] || 'mon';
};

export const getTodayDayOfWeek = (): DayOfWeek => {
  return getDayOfWeekFromDate(new Date());
};

export const DEFAULT_ROUTINE_TEMPLATES: WorkoutRoutineTemplate[] = [
  {
    id: 'template-push-1',
    title: 'Push Day (Chest, Shoulders & Triceps)',
    description: 'Targeted upper body pressing muscles with barbell and bodyweight compound movements.',
    category: 'Hypertrophy',
    targetMuscleGroup: 'Chest & Shoulders',
    estimatedDurationMinutes: 45,
    exercises: [
      {
        name: 'Barbell Bench Press',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Chest',
        defaultSets: [
          { weight: 60, reps: 10 },
          { weight: 65, reps: 8 },
          { weight: 70, reps: 6 },
        ],
      },
      {
        name: 'Overhead Shoulder Press',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Shoulders',
        defaultSets: [
          { weight: 35, reps: 10 },
          { weight: 40, reps: 8 },
          { weight: 40, reps: 8 },
        ],
      },
      {
        name: 'Incline Dumbbell Press',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Chest',
        defaultSets: [
          { weight: 20, reps: 10 },
          { weight: 22, reps: 10 },
          { weight: 24, reps: 8 },
        ],
      },
      {
        name: 'Push-ups',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Chest',
        defaultSets: [
          { bodyweight: true, reps: 15 },
          { bodyweight: true, reps: 15 },
          { bodyweight: true, reps: 12 },
        ],
      },
    ],
  },
  {
    id: 'template-pull-1',
    title: 'Pull Day (Back, Biceps & Lats)',
    description: 'Upper body pulling routine designed for a wide V-taper, thick upper back, and strong biceps.',
    category: 'Hypertrophy',
    targetMuscleGroup: 'Back & Biceps',
    estimatedDurationMinutes: 45,
    exercises: [
      {
        name: 'Pull-ups',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Back',
        defaultSets: [
          { bodyweight: true, reps: 10 },
          { bodyweight: true, reps: 8 },
          { bodyweight: true, reps: 8 },
        ],
      },
      {
        name: 'Bent-Over Barbell Row',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Back',
        defaultSets: [
          { weight: 50, reps: 10 },
          { weight: 55, reps: 8 },
          { weight: 60, reps: 8 },
        ],
      },
      {
        name: 'Dumbbell Bicep Curl',
        category: 'Strength',
        type: 'Isolation',
        muscleGroup: 'Biceps',
        defaultSets: [
          { weight: 14, reps: 12 },
          { weight: 14, reps: 10 },
          { weight: 16, reps: 8 },
        ],
      },
      {
        name: 'Lat Pulldown',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Back',
        defaultSets: [
          { weight: 50, reps: 12 },
          { weight: 55, reps: 10 },
          { weight: 60, reps: 8 },
        ],
      },
    ],
  },
  {
    id: 'template-legs-1',
    title: 'Leg Day & Core (Quads, Glutes & Abs)',
    description: 'High-energy lower body session targeting quad drive, hamstring posterior chain, and core stability.',
    category: 'Strength',
    targetMuscleGroup: 'Legs & Core',
    estimatedDurationMinutes: 50,
    exercises: [
      {
        name: 'Barbell Back Squat',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Legs',
        defaultSets: [
          { weight: 70, reps: 10 },
          { weight: 80, reps: 8 },
          { weight: 85, reps: 6 },
        ],
      },
      {
        name: 'Romanian Deadlift',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Legs',
        defaultSets: [
          { weight: 60, reps: 10 },
          { weight: 65, reps: 10 },
          { weight: 70, reps: 8 },
        ],
      },
      {
        name: 'Walking Lunges',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Legs',
        defaultSets: [
          { weight: 14, reps: 12 },
          { weight: 14, reps: 12 },
          { weight: 16, reps: 10 },
        ],
      },
      {
        name: 'Plank',
        category: 'Core',
        type: 'Isometric',
        muscleGroup: 'Abs',
        defaultSets: [
          { bodyweight: true, reps: 60 },
          { bodyweight: true, reps: 60 },
          { bodyweight: true, reps: 45 },
        ],
      },
    ],
  },
  {
    id: 'template-upper-1',
    title: 'Upper Body Power Split',
    description: 'Heavy compound upper body session balancing anterior chest/shoulders and posterior lat pulling.',
    category: 'Strength',
    targetMuscleGroup: 'Upper Body',
    estimatedDurationMinutes: 40,
    exercises: [
      {
        name: 'Barbell Bench Press',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Chest',
        defaultSets: [
          { weight: 65, reps: 8 },
          { weight: 70, reps: 6 },
          { weight: 75, reps: 5 },
        ],
      },
      {
        name: 'Bent-Over Barbell Row',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Back',
        defaultSets: [
          { weight: 55, reps: 8 },
          { weight: 60, reps: 8 },
          { weight: 65, reps: 6 },
        ],
      },
      {
        name: 'Overhead Shoulder Press',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Shoulders',
        defaultSets: [
          { weight: 40, reps: 8 },
          { weight: 45, reps: 6 },
          { weight: 45, reps: 6 },
        ],
      },
    ],
  },
  {
    id: 'template-fullbody-1',
    title: 'Full Body Functional & Conditioning',
    description: 'Fast-paced athletic full body session combining squats, push mechanics, and pull strength.',
    category: 'Conditioning',
    targetMuscleGroup: 'Full Body',
    estimatedDurationMinutes: 35,
    exercises: [
      {
        name: 'Goblet Squats',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Legs',
        defaultSets: [
          { weight: 20, reps: 12 },
          { weight: 24, reps: 10 },
          { weight: 24, reps: 10 },
        ],
      },
      {
        name: 'Push-ups',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Chest',
        defaultSets: [
          { bodyweight: true, reps: 15 },
          { bodyweight: true, reps: 15 },
          { bodyweight: true, reps: 12 },
        ],
      },
      {
        name: 'Pull-ups',
        category: 'Strength',
        type: 'Compound',
        muscleGroup: 'Back',
        defaultSets: [
          { bodyweight: true, reps: 8 },
          { bodyweight: true, reps: 8 },
          { bodyweight: true, reps: 6 },
        ],
      },
    ],
  },
];

export const DEFAULT_WEEKLY_SPLIT: WeeklySplit = {
  mon: 'template-push-1',
  tue: 'template-pull-1',
  wed: null, // Rest
  thu: 'template-legs-1',
  fri: 'template-push-1',
  sat: 'template-pull-1',
  sun: null, // Rest
};

export const SPLIT_PRESETS: {
  id: string;
  name: string;
  description: string;
  split: WeeklySplit;
}[] = [
  {
    id: 'ppl',
    name: 'Push / Pull / Legs (PPL)',
    description: 'Classic 4-5 day split maximizing muscle growth with push, pull, and leg rotations.',
    split: {
      mon: 'template-push-1',
      tue: 'template-pull-1',
      wed: null,
      thu: 'template-legs-1',
      fri: 'template-push-1',
      sat: 'template-pull-1',
      sun: null,
    },
  },
  {
    id: 'upper_lower',
    name: 'Upper / Lower (4-Day)',
    description: 'Ideal balance of power, muscle hypertrophy, and full recovery days.',
    split: {
      mon: 'template-upper-1',
      tue: 'template-legs-1',
      wed: null,
      thu: 'template-upper-1',
      fri: 'template-legs-1',
      sat: null,
      sun: null,
    },
  },
  {
    id: 'full_body_3day',
    name: 'Full Body (3-Day)',
    description: 'High-efficiency 3 days per week routine with alternate recovery days.',
    split: {
      mon: 'template-fullbody-1',
      tue: null,
      wed: 'template-fullbody-1',
      thu: null,
      fri: 'template-fullbody-1',
      sat: null,
      sun: null,
    },
  },
];

export const MESOCYCLE_WEEKS: MesocycleWeekInfo[] = [
  {
    weekNumber: 1,
    phase: 'accumulation',
    title: 'Week 1: Accumulation Phase',
    subtitle: 'Volume Foundation & Movement Quality',
    focus: 'Build baseline work capacity, dial in exercise technique, and establish working weights.',
    intensityLabel: 'Moderate (RPE 6-7)',
    targetRPE: 'RPE 6 - 7 · 3-4 reps in reserve',
    volumeMultiplier: '100% Base Volume',
    tips: 'Focus on crisp form, controlled eccentric tempos, and smooth bar paths.',
  },
  {
    weekNumber: 2,
    phase: 'progression',
    title: 'Week 2: Progression Phase',
    subtitle: 'Overload & Progressive Resistance',
    focus: 'Add 2.5-5kg to main compound lifts or aim for 1-2 additional repetitions on accessories.',
    intensityLabel: 'High-Moderate (RPE 7.5-8.5)',
    targetRPE: 'RPE 7.5 - 8.5 · 2 reps in reserve',
    volumeMultiplier: '+5% to +10% Load / Sets',
    tips: 'Push heavier working sets while maintaining strict range of motion.',
  },
  {
    weekNumber: 3,
    phase: 'peak',
    title: 'Week 3: Peak Volume & Intensity',
    subtitle: 'Maximum Effort & Overreach Threshold',
    focus: 'Reach peak weekly volume and maximum mechanical tension before scheduled recovery.',
    intensityLabel: 'Max Effort (RPE 8.5-9.5)',
    targetRPE: 'RPE 8.5 - 9.5 · 0-1 rep in reserve',
    volumeMultiplier: 'Peak Threshold (Top Sets)',
    tips: 'Give everything to your primary lifts; prioritize quality sleep & 1g protein/lb bodyweight.',
  },
  {
    weekNumber: 4,
    phase: 'deload',
    title: 'Week 4: Deload & Active Recovery',
    subtitle: 'CNS & Joint Supercompensation',
    focus: 'Drop working volume by 40-50% and keep loads submaximal to shed systemic fatigue.',
    intensityLabel: 'Active Recovery (RPE 5-6)',
    targetRPE: 'RPE 5 - 6 · 4-5 reps in reserve',
    volumeMultiplier: '50% - 60% Volume',
    tips: 'Allow connective tissues and nervous system to adapt; you will come back stronger next cycle!',
  },
];
