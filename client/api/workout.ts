import { apiRequest } from './client';

export interface ApiSetRow {
  id: string;
  setNumber: number;
  weight?: number | null;
  reps?: number | null;
  bodyweight?: boolean;
  done: boolean;
}

export interface ApiWorkoutExercise {
  id: string;
  name: string;
  category?: string | null;
  type?: string | null;
  sets: ApiSetRow[];
}

export interface ApiWorkoutSession {
  id: string;
  title: string;
  duration: number;
  caloriesBurned: number;
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
  exercises: ApiWorkoutExercise[];
}

export interface ApiLibraryExercise {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  type: string;
  difficulty: string;
  primaryMuscle: string;
  muscleGroup: string;
  secondaryMuscles?: string[];
  bodyPart: string;
  equipment?: string[];
  equipmentAlternatives?: string[];
  startingPosition?: string | null;
  instructions?: string[];
  formTips?: string[];
  commonMistakes?: string[];
  breathingTechnique?: string | null;
  recommendedSets?: number | null;
  recommendedReps?: number | null;
  recommendedDuration?: number | null;
  recommendedRest?: number | null;
  recommendedTempo?: string | null;
  defaultSets?: { weight?: number; reps?: number; bodyweight?: boolean }[];
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
  similarExercises?: string[];
  tags?: string[];
}

export const getWorkoutLibrary = (filters?: Record<string, string>) => {
  let queryStr = '';
  if (filters && Object.keys(filters).length > 0) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val && val !== 'All') params.append(key, val);
    });
    const queryString = params.toString();
    if (queryString) queryStr = `?${queryString}`;
  }
  return apiRequest(`/api/workouts/library${queryStr}`);
};

export const getExerciseDetails = (id: string) =>
  apiRequest(`/api/workouts/library/${id}`);

export const createLibraryExercise = (data: any) =>
  apiRequest('/api/workouts/library', { method: 'POST', body: data });

export const updateLibraryExercise = (id: string, data: any) =>
  apiRequest(`/api/workouts/library/${id}`, { method: 'PUT', body: data });

export const deleteLibraryExercise = (id: string) =>
  apiRequest(`/api/workouts/library/${id}`, { method: 'DELETE' });

export const getTodayWorkoutSession = () => apiRequest('/api/workouts/today');

export const addExerciseToTodaySession = (payload: {
  exerciseId?: string;
  name: string;
  category?: string;
  type?: string;
  defaultSets?: any[];
}) => apiRequest('/api/workouts/today/add-exercise', { method: 'POST', body: payload });

export const toggleExerciseSetApi = (setId: string, done?: boolean) =>
  apiRequest(`/api/workouts/sets/${setId}/toggle`, {
    method: 'PATCH',
    body: { done },
  });

export const updateExerciseSetValuesApi = (
  setId: string,
  data: { weight?: number; reps?: number; done?: boolean }
) =>
  apiRequest(`/api/workouts/sets/${setId}`, {
    method: 'PATCH',
    body: data,
  });

export const addSetToWorkoutExerciseApi = (
  exerciseId: string,
  data?: { weight?: number; reps?: number; bodyweight?: boolean }
) =>
  apiRequest(`/api/workouts/exercises/${exerciseId}/sets`, {
    method: 'POST',
    body: data,
  });

export const deleteExerciseSetApi = (setId: string) =>
  apiRequest(`/api/workouts/sets/${setId}`, { method: 'DELETE' });

export const deleteWorkoutExerciseApi = (exerciseId: string) =>
  apiRequest(`/api/workouts/exercises/${exerciseId}`, { method: 'DELETE' });

export const completeWorkoutSessionApi = () =>
  apiRequest('/api/workouts/today/complete', { method: 'POST' });

export const getWorkoutHistory = () => apiRequest('/api/workouts/history');

export const getPersonalRecordsApi = () => apiRequest('/api/workouts/personal-records');
