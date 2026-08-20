import { apiRequest } from './client';

export interface AnalyzeMealPayload {
  description?: string;
  imageBase64?: string;
  mimeType?: string;
}

export interface MealAnalysisResult {
  foodName: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthNotes?: string;
}

export interface AIInsight {
  title: string;
  lines: string[];
}

export interface AIWorkoutPlan {
  title: string;
  estimatedDurationMinutes: number;
  targetMuscleGroup: string;
  exercises: {
    name: string;
    category: string;
    sets: number;
    reps: number;
    suggestedWeightKg?: number;
  }[];
}

export const analyzeMeal = async (payload: AnalyzeMealPayload): Promise<{ success: boolean; data: MealAnalysisResult }> => {
  return apiRequest('/api/ai/analyze-meal', {
    method: 'POST',
    body: payload,
  });
};

export const getAIInsights = async (): Promise<{ success: boolean; insights: AIInsight[] }> => {
  return apiRequest('/api/ai/insights', {
    method: 'GET',
  });
};

export const generateAIWorkout = async (payload?: { targetArea?: string }): Promise<{ success: boolean; workoutPlan: AIWorkoutPlan }> => {
  return apiRequest('/api/ai/generate-workout', {
    method: 'POST',
    body: payload || {},
  });
};
