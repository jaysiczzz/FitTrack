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

export interface CompletedSession {
  id: string;
  date: string;
  title: string;
  duration: string;
  caloriesBurned: number;
  exercisesCount: number;
  exercises: { name: string; setsSummary: string }[];
}
