import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './client';
import { FoodLogItem } from '../components/foodlog/foodLogTypes';
import { FoodCatalogItem } from '../data/commonFoods';
import { authStorage } from '../utils/authStorage';

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
  goalBadgeColor?: 'green' | 'blue' | 'yellow' | 'purple' | null;
  icon?: string | null;
  healthNotes?: string | null;
  imageUri?: string | null;
  loggedAt?: string | null;
  macros?: string[];
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
  isCompleted?: boolean;
  completedAt?: string | null;
  meals: ApiFoodMeal[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveDailyFoodLogPayload {
  date: string;
  items: FoodLogItem[];
  waterMl?: number;
  isCompleted?: boolean;
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

// 1b. Mark Day's Intake as Officially Completed
export const completeDailyFoodLogApi = (date: string): Promise<SaveFoodLogResponse> => {
  return apiRequest('/api/food-logs/complete-day', {
    method: 'POST',
    body: { date },
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

let syncTimer: any = null;
let pendingSyncPayload: { userId: string; date: string; items: FoodLogItem[]; waterMl: number } | null = null;

/**
 * Debounced background auto-sync to PostgreSQL database.
 * Ensures active food items & water are synced to cloud without spamming the API.
 */
export const autoSyncFoodAndWater = (
  userId: string | undefined,
  date: string,
  items: FoodLogItem[],
  waterMl: number
) => {
  if (!userId) return;

  pendingSyncPayload = { userId, date, items, waterMl };

  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  syncTimer = setTimeout(async () => {
    if (!pendingSyncPayload) return;
    const payload = { ...pendingSyncPayload };
    try {
      await saveDailyFoodLogApi({
        date: payload.date,
        items: payload.items,
        waterMl: payload.waterMl,
      });
    } catch (err) {
      console.log('[FoodLog API] Background auto-sync deferred/failed:', err);
    }
  }, 600);
};

export const flushSyncFoodAndWater = async () => {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  if (pendingSyncPayload) {
    const payload = { ...pendingSyncPayload };
    pendingSyncPayload = null;
    try {
      await saveDailyFoodLogApi({
        date: payload.date,
        items: payload.items,
        waterMl: payload.waterMl,
      });
    } catch (err) {
      console.log('[FoodLog API] Flush sync failed:', err);
    }
  }
};


// 5. Search & Browse Foods Online (Open Food Facts Database)
export interface SearchFoodsResponse {
  success: boolean;
  foods: FoodCatalogItem[];
}

export const OPEN_FOOD_FACTS_CATEGORY_TERMS: Record<string, string> = {
  ALL: 'healthy',
  Protein: 'protein',
  Carbs: 'oats',
  Fats: 'peanut butter',
  Fruits: 'apple',
  Vegetables: 'salad',
  Dairy: 'yogurt',
};

export const searchFoodsOnlineApi = async (
  query?: string,
  category?: string
): Promise<SearchFoodsResponse> => {
  try {
    const params = new URLSearchParams();
    if (query) params.append('q', query.trim());
    if (category && category !== 'ALL') params.append('category', category);
    return await apiRequest(`/api/food-logs/search?${params.toString()}`, {
      method: 'GET',
    });
  } catch (err) {
    console.log('[Food Search API] Backend network deferred, using direct Open Food Facts:', err);
    return { success: false, foods: [] };
  }
};

/**
 * Fetches foods directly from Open Food Facts API (via backend proxy or direct OFF CDN fallback)
 * with automatic local AsyncStorage caching for instant 0ms loads and offline resilience.
 */
export const fetchOpenFoodFactsProducts = async (
  query?: string,
  category?: string
): Promise<FoodCatalogItem[]> => {
  const qClean = (query || '').trim();
  const activeCategory = category && category !== 'ALL' && category !== 'RECENT' ? category : 'ALL';
  const searchTerm = qClean || OPEN_FOOD_FACTS_CATEGORY_TERMS[activeCategory] || 'nutrition';
  const cacheKey = `@fittrack_off_cache_${activeCategory}_${qClean.toLowerCase()}`;

  // 1. Try local AsyncStorage cache first for instant responsiveness
  let cachedFoods: FoodCatalogItem[] = [];
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedFoods = parsed;
      }
    }
  } catch {}

  // Helper to map Open Food Facts raw product to FoodCatalogItem
  const mapOffProduct = (p: any): FoodCatalogItem | null => {
    const name = (p.product_name_en || p.product_name || '').trim();
    if (!name || name.length < 2) return null;

    const nutriments = p.nutriments || {};
    const calsRaw =
      nutriments['energy-kcal_100g'] ||
      nutriments['energy-kcal'] ||
      (nutriments['energy_100g'] ? nutriments['energy_100g'] / 4.184 : 0);
    const calories = Math.round(Number(calsRaw) || 0);
    if (calories <= 0) return null;

    const protein = Math.round(Number(nutriments.proteins_100g || nutriments.proteins || 0) * 10) / 10;
    const carbs = Math.round(Number(nutriments.carbohydrates_100g || nutriments.carbohydrates || 0) * 10) / 10;
    const fat = Math.round(Number(nutriments.fat_100g || nutriments.fat || 0) * 10) / 10;
    const fiberRaw = nutriments.fiber_100g || nutriments.fiber;
    const fiber = fiberRaw != null && Number(fiberRaw) > 0 ? Math.round(Number(fiberRaw) * 10) / 10 : undefined;

    let servingWeightG = 100;
    if (p.serving_size) {
      const match = String(p.serving_size).match(/(\d+(?:\.\d+)?)\s*g/i);
      if (match) servingWeightG = Math.round(Number(match[1]));
    }

    const brand = (p.brands || '').split(',')[0]?.trim() || undefined;
    const fullName = brand && !name.toLowerCase().includes(brand.toLowerCase())
      ? `${name} (${brand})`
      : name;

    const imageUri =
      p.image_front_small_url ||
      p.image_small_url ||
      p.image_url ||
      undefined;

    const catName: 'Protein' | 'Carbs' | 'Fats' | 'Fruits' | 'Vegetables' | 'Dairy' =
      activeCategory === 'ALL' ? 'Protein' : (activeCategory as any);

    const categoryIcons: Record<string, string> = {
      Protein: '🍗',
      Carbs: '🍚',
      Fats: '🥑',
      Fruits: '🍎',
      Vegetables: '🥦',
      Dairy: '🥛',
    };

    return {
      id: `off-${p.code || Math.random().toString(36).substring(2, 9)}`,
      name: fullName,
      brand,
      category: catName,
      servingSize: p.serving_size || '100g',
      servingWeightG,
      servingUnit: 'g',
      calories,
      protein,
      carbs,
      fat,
      fiber,
      description: p.generic_name || p.generic_name_en || undefined,
      ingredients: (p.ingredients_text || p.ingredients_text_en || '')
        .replace(/\[.*?\]|\(.*?\)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 150) || undefined,
      icon: categoryIcons[activeCategory] || '🛒',
      isOnlineResult: true,
      isVerified: true,
      imageUri,
      keywords: [name.toLowerCase(), ...(brand ? [brand.toLowerCase()] : [])],
    };
  };

  // 2. Fetch fresh data from backend proxy or direct Open Food Facts CDN
  try {
    // 2a. Try backend proxy
    const backendRes = await searchFoodsOnlineApi(qClean, activeCategory);
    if (backendRes.success && Array.isArray(backendRes.foods) && backendRes.foods.length > 0) {
      AsyncStorage.setItem(cacheKey, JSON.stringify(backendRes.foods)).catch(() => {});
      return backendRes.foods;
    }

    // 2b. Direct Open Food Facts query fallback (openfoodfacts.net)
    const offUrl = `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(
      searchTerm
    )}&search_simple=1&action=process&json=1&page_size=25`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const resp = await fetch(offUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'FitTrackMobileApp/1.0 (Android; contact@fittrack.fitness)',
      },
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      if (data && Array.isArray(data.products)) {
        const parsed = data.products
          .map(mapOffProduct)
          .filter((f: FoodCatalogItem | null): f is FoodCatalogItem => f !== null);

        if (parsed.length > 0) {
          AsyncStorage.setItem(cacheKey, JSON.stringify(parsed)).catch(() => {});
          return parsed;
        }
      }
    }
  } catch (err) {
    console.log('[Open Food Facts] Live query error, returning cached data:', err);
  }

  // If live query failed, return cached data if available
  if (cachedFoods.length > 0) {
    return cachedFoods;
  }

  return [];
};

const getRecentKey = async () => {
  const user = await authStorage.getUser();
  return authStorage.getScopedKey(user?.id, 'fittrack_recent_logged_foods');
};

export const getRecentLoggedFoods = async (): Promise<any[]> => {
  try {
    const key = await getRecentKey();
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveFoodToRecentHistory = async (food: any): Promise<void> => {
  try {
    const key = await getRecentKey();
    const recents = await getRecentLoggedFoods();
    const filtered = recents.filter((f) => f.name.toLowerCase() !== food.name.toLowerCase());
    const updated = [food, ...filtered].slice(0, 25);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.log('Error caching recent food:', err);
  }
};

export const createCustomFoodApi = (data: {
  name: string;
  brand?: string;
  category?: string;
  servingSize?: string;
  servingWeightG?: number;
  servingUnit?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  description?: string;
  ingredients?: string;
  icon?: string;
}) => apiRequest('/api/food-logs/custom', { method: 'POST', body: data });

export const deleteCustomFoodApi = (foodId: string) =>
  apiRequest(`/api/food-logs/custom/${foodId}`, { method: 'DELETE' });
