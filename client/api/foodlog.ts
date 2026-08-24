import { apiRequest } from './client';
import { FoodLogItem } from '../components/foodlog/foodLogTypes';

export interface ApiFoodMeal {
  id: string;
  dailyFoodLogId: string;
  mealType: string;
  title: string;
  subtitle?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goalBadge?: string | null;
  healthNotes?: string | null;
  imageUri?: string | null;
  createdAt: string;
}

export interface ApiDailyFoodLog {
  id: string;
  userId: string;
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  waterMl: number;
  meals: ApiFoodMeal[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveDailyFoodLogPayload {
  date: string;
  items: FoodLogItem[];
  waterMl?: number;
}

export interface SaveFoodLogResponse {
  success: boolean;
  message: string;
  data: ApiDailyFoodLog;
}

export interface GetFoodHistoryResponse {
  success: boolean;
  history: ApiDailyFoodLog[];
}

export interface GetDayLogResponse {
  success: boolean;
  data: ApiDailyFoodLog | null;
}

// 1. Save / Archive Day's Meals & Water to PostgreSQL Database
export const saveDailyFoodLogApi = (payload: SaveDailyFoodLogPayload): Promise<SaveFoodLogResponse> => {
  return apiRequest('/api/food-logs/save-day', {
    method: 'POST',
    body: payload,
  });
};

// 2. Fetch User's Complete Food Log History from Database
export const getFoodLogHistoryApi = (): Promise<GetFoodHistoryResponse> => {
  return apiRequest('/api/food-logs/history', {
    method: 'GET',
  });
};

// 3. Fetch Single Day's Food Log from Database
export const getDailyFoodLogApi = (date: string): Promise<GetDayLogResponse> => {
  return apiRequest(`/api/food-logs/${date}`, {
    method: 'GET',
  });
};

// 4. Delete Single Day's Food Log from Database
export const deleteDailyFoodLogApi = (date: string) => {
  return apiRequest(`/api/food-logs/${date}`, {
    method: 'DELETE',
  });
};
