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

export function calculateWorkoutStreak(
  sessions: any[],
  isTodayCompleted: boolean = false
): number {
  if (!sessions || (!Array.isArray(sessions) && !isTodayCompleted)) {
    return 0;
  }

  const formatDateKey = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const completedDays = new Set<string>();

  if (Array.isArray(sessions)) {
    for (const s of sessions) {
      const timestamp = s.completedAt || s.dateStr || (s.completed ? s.createdAt : null);
      if (timestamp) {
        if (typeof timestamp === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(timestamp)) {
          completedDays.add(timestamp);
        } else {
          const d = new Date(timestamp);
          if (!isNaN(d.getTime())) {
            completedDays.add(formatDateKey(d));
          }
        }
      }
    }
  }

  const today = new Date();
  const todayKey = formatDateKey(today);

  if (isTodayCompleted) {
    completedDays.add(todayKey);
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  // If neither today nor yesterday has a completed session, streak is broken
  let anchorDate: Date | null = null;
  if (completedDays.has(todayKey)) {
    anchorDate = new Date(today);
  } else if (completedDays.has(yesterdayKey)) {
    anchorDate = new Date(yesterday);
  } else {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(anchorDate);

  while (completedDays.has(formatDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
