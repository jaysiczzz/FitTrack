export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodLogItem {
  id: string;
  mealType: MealType;
  title: string;
  subtitle?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goalBadge?: string;
  goalBadgeColor?: 'green' | 'blue' | 'yellow' | 'purple';
  healthNotes?: string;
  macros?: string[];
  imageUri?: string;
  loggedAt?: string;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface BeginnerStaple {
  id: string;
  title: string;
  subtitle: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recommendedFor: 'MUSCLE_GAIN' | 'WEIGHT_LOSS' | 'BOTH';
  badge: string;
  icon: string;
}

export const getSmartMealType = (): MealType => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snack';
  return 'dinner';
};

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

export const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🥪',
};

export interface DailyFoodHistorySummary {
  date: string;
  formattedDate: string;
  items: FoodLogItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  waterMl: number;
}

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateHeading = (dateStr: string): string => {
  const todayStr = getTodayDateString();
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yYear = yesterdayObj.getFullYear();
  const yMonth = String(yesterdayObj.getMonth() + 1).padStart(2, '0');
  const yDay = String(yesterdayObj.getDate()).padStart(2, '0');
  const calcYesterdayStr = `${yYear}-${yMonth}-${yDay}`;

  if (dateStr === todayStr) {
    return `Today (${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
  }
  if (dateStr === calcYesterdayStr) {
    return `Yesterday (${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
  }

  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

