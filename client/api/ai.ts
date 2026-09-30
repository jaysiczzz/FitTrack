import { apiRequest } from './client';

export interface AnalyzeMealPayload {
  description?: string;
  imageBase64?: string;
  mimeType?: string;
}

export interface DetectedFoodItem {
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodiumMg?: number;
  saturatedFat?: number;
}

export interface MealAnalysisResult {
  isFood?: boolean;
  rejectionReason?: string;
  foodName: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodiumMg?: number;
  saturatedFat?: number;
  confidenceScore?: number;
  dietaryFlags?: string[];
  items?: DetectedFoodItem[];
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

export const analyzeMeal = async (
  payload: AnalyzeMealPayload
): Promise<{ success: boolean; data?: MealAnalysisResult; isFood?: boolean; error?: string; message?: string }> => {
  try {
    return await apiRequest('/api/ai/analyze-meal', {
      method: 'POST',
      body: payload,
      timeout: 60000,
    });
  } catch (err: any) {
    const msg = err?.message || '';
    const isNotFood =
      msg.toLowerCase().includes('not food') ||
      msg.toLowerCase().includes('not a food') ||
      msg.toLowerCase().includes('not appear to be food') ||
      msg.toLowerCase().includes('does not appear to be food') ||
      msg.toLowerCase().includes('does not contain any food') ||
      msg.toLowerCase().includes('not edible') ||
      msg.toLowerCase().includes('not an edible');

    if (isNotFood) {
      return {
        success: false,
        isFood: false,
        error: msg,
        message: msg,
      };
    }
    throw err;
  }
};

export const getAIInsights = async (): Promise<{ success: boolean; insights: AIInsight[] }> => {
  return apiRequest('/api/ai/insights', {
    method: 'GET',
    timeout: 30000,
  });
};

export const generateAIWorkout = async (payload?: { targetArea?: string }): Promise<{ success: boolean; workoutPlan: AIWorkoutPlan }> => {
  return apiRequest('/api/ai/generate-workout', {
    method: 'POST',
    body: payload || {},
    timeout: 45000,
  });
};

export interface MealSuggestion {
  title: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: string;
  ingredients: string[];
  reason: string;
  icon: string;
}

export const getAIMealSuggestions = async (payload: {
  goal: string;
  remainingCalories: number;
  remainingProtein: number;
}): Promise<{ success: boolean; suggestions: MealSuggestion[] }> => {
  return apiRequest('/api/ai/suggest-meals', {
    method: 'POST',
    body: payload,
    timeout: 45000,
  });
};

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
  createdAt?: string;
}

export const chatWithCoachApi = async (
  messages: { role: 'user' | 'model'; content: string }[]
): Promise<{ success: boolean; message: string }> => {
  return apiRequest('/api/ai/chat', {
    method: 'POST',
    body: { messages },
    timeout: 60000,
  });
};

export const getChatHistoryApi = async (): Promise<{ success: boolean; messages: ChatMessage[] }> => {
  return apiRequest('/api/ai/chat/history', {
    method: 'GET',
  });
};

export const clearChatHistoryApi = async (): Promise<{ success: boolean; message: string }> => {
  return apiRequest('/api/ai/chat/history', {
    method: 'DELETE',
  });
};

