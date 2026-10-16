import { apiRequest } from './client';
import { authStorage } from '../utils/authStorage';
import { API_URL } from '../config';


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

export interface NutritionInsightsPayload {
  loggedMeals?: Array<{
    title: string;
    mealType?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  targets?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    waterMl?: number;
  };
  loggedMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    waterMl?: number;
  };
  userGoal?: string;
}

export const getAIInsights = async (
  payload?: NutritionInsightsPayload
): Promise<{ success: boolean; insights: AIInsight[] }> => {
  if (payload) {
    return apiRequest('/api/ai/insights', {
      method: 'POST',
      body: payload,
      timeout: 30000,
    });
  }
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
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'all';
}): Promise<{
  success: boolean;
  suggestions: MealSuggestion[];
  usage?: {
    used: number;
    limit: number;
    remaining: number;
    resetsAt: string;
    tier?: string;
  };
}> => {
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
  messages: { role: 'user' | 'model'; content: string }[],
  options?: { signal?: AbortSignal; timeout?: number }
): Promise<{
  success: boolean;
  message: string;
  isPro?: boolean;
  remainingMessages?: number | null;
  dailyLimit?: number;
  resetsAt?: string;
  error?: string;
}> => {
  return apiRequest('/api/ai/chat', {
    method: 'POST',
    body: { messages },
    timeout: options?.timeout ?? 25000,
    signal: options?.signal,
  });
};

export const streamChatWithCoachApi = async (
  messages: { role: 'user' | 'model'; content: string }[],
  onChunk: (chunk: string) => void,
  onXhrCreated?: (xhr: XMLHttpRequest) => void,
  timeoutMs: number = 25000
): Promise<{ success: boolean; message: string }> => {
  const token = await authStorage.getToken();
  const url = `${API_URL}/api/ai/chat?stream=true`;

  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      if (onXhrCreated) {
        onXhrCreated(xhr);
      }
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'text/event-stream');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      let seenIndex = 0;
      let accumulatedText = '';

      xhr.onprogress = () => {
        const raw = xhr.responseText.substring(seenIndex);
        seenIndex = xhr.responseText.length;

        const lines = raw.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            try {
              const jsonStr = trimmed.replace(/^data:\s*/, '');
              const parsed = JSON.parse(jsonStr);
              if (parsed.chunk) {
                accumulatedText += parsed.chunk;
                onChunk(parsed.chunk);
              } else if (parsed.done && parsed.message) {
                accumulatedText = parsed.message;
              }
            } catch {}
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true, message: accumulatedText.trim() });
        } else {
          try {
            const errJson = JSON.parse(xhr.responseText);
            if (errJson?.error === 'LIMIT_REACHED' || xhr.status === 429) {
              const limitErr: any = new Error(errJson?.message || errJson?.error || 'LIMIT_REACHED');
              limitErr.status = 429;
              limitErr.resetsAt = errJson?.resetsAt;
              reject(limitErr);
              return;
            }
          } catch {}
          const error: any = new Error(`Chat error status: ${xhr.status}`);
          error.status = xhr.status;
          reject(error);
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during streaming chat.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('AI stream timed out.'));
      };

      xhr.onabort = () => {
        reject(new Error('Request aborted'));
      };

      xhr.timeout = timeoutMs;
      xhr.send(JSON.stringify({ messages, stream: true }));
    } catch (e) {
      reject(e);
    }
  });
};


export const getChatHistoryApi = async (): Promise<{
  success: boolean;
  messages: ChatMessage[];
  isPro?: boolean;
  remainingMessages?: number | null;
  dailyLimit?: number;
  resetsAt?: string;
}> => {
  return apiRequest('/api/ai/chat/history', {
    method: 'GET',
  });
};

export const clearChatHistoryApi = async (): Promise<{ success: boolean; message: string }> => {
  return apiRequest('/api/ai/chat/history', {
    method: 'DELETE',
  });
};

export interface AutocompleteExerciseResult {
  primaryMuscle: string;
  secondaryMuscles: string[];
  category: string;
  type: string;
  difficulty: string;
  equipment: string[];
  instructions: string[];
  formTips: string[];
  commonMistakes: string[];
  breathingTechnique: string;
}

export const autocompleteExerciseApi = async (
  name: string
): Promise<{ success: boolean; data: AutocompleteExerciseResult }> => {
  return apiRequest('/api/ai/autocomplete-exercise', {
    method: 'POST',
    body: { name },
  });
};

