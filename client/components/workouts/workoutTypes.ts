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
  muscleGroup?: string;
  defaultSets: RoutineExerciseSet[];
}

export interface WorkoutRoutineTemplate {
  id: string;
  title: string;
  description?: string;
  category: string;
  targetMuscleGroup?: string;
  estimatedDurationMinutes: number;
  exercises: RoutineExercise[];
  isCustom?: boolean;
  createdAt?: string;
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type WeeklySplit = Record<DayOfWeek, string | null>;

export type PlannerViewMode = 'daily' | 'weekly' | 'monthly';

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

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDateStringFromTimestamp = (isoString?: string | null): string => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateHeading = (dateStr: string): string => {
  const todayStr = getTodayDateString();
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yYear = yesterdayObj.getFullYear();
  const yMonth = String(yesterdayObj.getMonth() + 1).padStart(2, '0');
  const yDay = String(yesterdayObj.getDate()).padStart(2, '0');
  const calcYesterdayStr = `${yYear}-${yMonth}-${yDay}`;

  if (dateStr === todayStr) {
    return `Today (${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
  }
  if (dateStr === calcYesterdayStr) {
    return `Yesterday (${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
  }

  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};
