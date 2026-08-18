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
  category: string;
  muscleGroup: 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';
  type: 'Strength' | 'Cardio' | 'Flexibility' | 'Calisthenics';
  defaultSets?: { weight?: number; reps?: number; bodyweight?: boolean }[];
}

export const getWorkoutLibrary = () => apiRequest('/api/workouts/library');

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

export const deleteWorkoutExerciseApi = (exerciseId: string) =>
  apiRequest(`/api/workouts/exercises/${exerciseId}`, { method: 'DELETE' });

export const completeWorkoutSessionApi = () =>
  apiRequest('/api/workouts/today/complete', { method: 'POST' });

export const getWorkoutHistory = () => apiRequest('/api/workouts/history');
