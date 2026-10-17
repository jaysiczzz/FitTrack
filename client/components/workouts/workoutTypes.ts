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
  defaultSets: { weight?: string | number; reps?: string | number; duration?: string | number; distance?: string | number; bodyweight?: boolean }[];
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
  difficultyPresets?: Record<string, any> | null;
  isSystem?: boolean;
}

export interface RoutineExerciseSet {
  weight?: string | number;
  reps?: string | number;
  bodyweight?: boolean;
}

export interface RoutineExercise {
  exerciseId?: string;
  name: string;
  category?: string;
  type?: string;
  primaryMuscle?: string;
  muscleGroup?: string;
  defaultSets: RoutineExerciseSet[];
}

export interface WorkoutRoutineTemplate {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  targetMuscleGroup?: string;
  estimatedDurationMinutes: number;
  exercises: RoutineExercise[];
  isCustom?: boolean;
  createdAt?: string;
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type WeeklySplit = Record<DayOfWeek, string | null>;

export type PlannerViewMode = 'weekly' | 'monthly' | 'daily';

export interface MonthlyScheduleDay {
  routineId: string | null;
  isRestDay: boolean;
  customNotes?: string | null;
  updatedAt?: string;
}

export type MonthlySchedule = Record<string, MonthlyScheduleDay>;

export type MesocyclePhase = 'accumulation' | 'progression' | 'peak' | 'deload';

export interface MesocycleWeekInfo {
  weekNumber: number; // 1 to 4
  phase: MesocyclePhase;
  title: string;
  subtitle: string;
  focus: string;
  intensityLabel: string;
  targetRPE: string;
  volumeMultiplier: string;
  tips: string;
}

export interface CompletedSessionExerciseSet {
  id?: string;
  setNumber: number;
  weight?: string | number;
  reps?: string | number;
  bodyweight?: boolean;
  done?: boolean;
}

export interface CompletedSessionExercise {
  id?: string;
  exerciseId?: string;
  name: string;
  category?: string;
  setsSummary: string;
  sets?: CompletedSessionExerciseSet[];
}

export interface CompletedSession {
  id: string;
  date: string;
  dateStr?: string;
  completedAt?: string;
  title: string;
  duration: string;
  durationMinutes?: number;
  caloriesBurned: number;
  exercisesCount: number;
  totalSetsCount?: number;
  exercises: CompletedSessionExercise[];
}

export type WorkoutHistoryRange = '7days' | '15days' | 'all';

export interface WorkoutCalendarSlot {
  dateStr: string;
  dayLabel: string;
  dateNum: number;
  isToday: boolean;
  hasWorkout: boolean;
  sessionCount: number;
  caloriesBurned: number;
  durationMinutes: number;
}

export interface MonthCalendarDay {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasWorkout: boolean;
  sessionCount: number;
  totalCalories: number;
  totalDurationMinutes: number;
  sessions: CompletedSession[];
  isPartOfStreak?: boolean;
}

import { getTodayDateString, formatDateHeading } from '@/utils/formatters';
export { getTodayDateString, formatDateHeading };

export const getDateStringFromTimestamp = (isoString?: string | null): string => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatRawWorkoutSession = (s: any): CompletedSession => {
  const rawDuration = s.duration;
  const durationMinutes =
    typeof rawDuration === 'number'
      ? rawDuration
      : parseInt(rawDuration, 10) || 35;

  const dateStr =
    s.dateStr ||
    (s.completedAt ? getDateStringFromTimestamp(s.completedAt) : '') ||
    (s.createdAt ? getDateStringFromTimestamp(s.createdAt) : '') ||
    (s.startedAt ? getDateStringFromTimestamp(s.startedAt) : '') ||
    getTodayDateString();

  const displayDate = s.date || (dateStr ? formatDateHeading(dateStr) : 'Completed');

  const exercises = (s.exercises || []).map((e: any) => {
    const sets = (e.sets || []).map((set: any, idx: number) => ({
      id: set.id,
      setNumber: set.setNumber || idx + 1,
      weight: set.weight !== undefined && set.weight !== null ? set.weight : undefined,
      reps: set.reps !== undefined && set.reps !== null ? set.reps : undefined,
      bodyweight: Boolean(set.bodyweight),
      done: Boolean(set.done),
    }));

    return {
      id: e.id,
      exerciseId: e.exerciseId || e.id,
      name: e.name,
      category: e.category,
      setsSummary: `${sets.length} sets`,
      sets,
    };
  });

  const totalSetsCount = exercises.reduce(
    (acc: number, e: any) => acc + (e.sets?.length || 0),
    0
  );

  return {
    id: s.id,
    date: displayDate,
    dateStr,
    completedAt: s.completedAt,
    title: s.title || 'Workout Session',
    duration:
      typeof s.duration === 'string' && s.duration.includes('min')
        ? s.duration
        : `${durationMinutes} min`,
    durationMinutes,
    caloriesBurned: s.caloriesBurned || 240,
    exercisesCount: exercises.length,
    totalSetsCount,
    exercises,
  };
};
