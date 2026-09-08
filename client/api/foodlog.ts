import AsyncStorage from '@react-native-async-storage/async-storage';
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

// 5. Search Foods Online (Open Food Facts Proxy)
export interface SearchFoodsResponse {
  success: boolean;
  foods: any[];
}

export const searchFoodsOnlineApi = async (query: string): Promise<SearchFoodsResponse> => {
  try {
    return await apiRequest(`/api/food-logs/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
    });
  } catch (err) {
    console.log('[Food Search API] Network error, using local fallback:', err);
    return { success: false, foods: [] };
  }
};

const RECENT_FOODS_STORAGE_KEY = 'fittrack_recent_logged_foods';

export const getRecentLoggedFoods = async (): Promise<any[]> => {
  try {
    const raw = await AsyncStorage.getItem(RECENT_FOODS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveFoodToRecentHistory = async (food: any): Promise<void> => {
  try {
    const recents = await getRecentLoggedFoods();
    const filtered = recents.filter((f) => f.name.toLowerCase() !== food.name.toLowerCase());
    const updated = [food, ...filtered].slice(0, 25);
    await AsyncStorage.setItem(RECENT_FOODS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.log('Error caching recent food:', err);
  }
};
