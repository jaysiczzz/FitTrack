import { LibraryExercise, CompletedSession } from './workoutTypes';
import { COMMON_EXERCISES_CATALOG } from '../../data/commonExercises';

export type { LibraryExercise, CompletedSession };

export const MOCK_LIBRARY: LibraryExercise[] = COMMON_EXERCISES_CATALOG;
export const MOCK_COMPLETED_SESSIONS: CompletedSession[] = [];
export const MOCK_HISTORY: CompletedSession[] = [];
