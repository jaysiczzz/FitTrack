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
  icon?: string;
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

export type BadgeColor = 'green' | 'blue' | 'yellow' | 'purple';

export interface SmartBadgeSource {
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
  category?: string | null;
  brand?: string | null;
  goalBadge?: string | null;
  goalBadgeColor?: BadgeColor | string | null;
  title?: string | null;
  name?: string | null;
  description?: string | null;
}

export interface SmartBadgeResult {
  badge: string;
  color: BadgeColor;
}

const FITNESS_STAPLE_BRANDS: Record<string, SmartBadgeResult> = {
  'High Protein Staple': { badge: 'High Protein Staple', color: 'green' },
  'Post-Workout Fuel': { badge: 'Post-Workout Fuel', color: 'green' },
  'Classic Breakfast': { badge: 'Classic Breakfast', color: 'yellow' },
  'Low Calorie & High Protein': { badge: 'Low Cal & High Protein', color: 'green' },
  'Lean Fat Loss': { badge: 'Lean Fat Loss', color: 'green' },
  'Slow-Digesting Energy': { badge: 'Slow Energy', color: 'blue' },
  'Omega-3 Rich Recovery': { badge: 'Omega-3 Recovery', color: 'purple' },
  'Casein Night Snack': { badge: 'Casein Recovery', color: 'purple' },
};

export const getSmartFoodBadge = (item?: SmartBadgeSource | null): SmartBadgeResult => {
  if (!item) {
    return { badge: '🥗 Balanced', color: 'blue' };
  }

  // 1. If item already has a non-empty goalBadge, preserve it
  if (item.goalBadge && item.goalBadge.trim().length > 0) {
    const validColors: BadgeColor[] = ['green', 'blue', 'yellow', 'purple'];
    const col: BadgeColor =
      item.goalBadgeColor && validColors.includes(item.goalBadgeColor as BadgeColor)
        ? (item.goalBadgeColor as BadgeColor)
        : item.goalBadge.toLowerCase().includes('protein')
        ? 'green'
        : 'blue';
    return { badge: item.goalBadge, color: col };
  }

  // 2. Check if brand matches a predefined fitness staple descriptor
  if (item.brand && FITNESS_STAPLE_BRANDS[item.brand]) {
    return FITNESS_STAPLE_BRANDS[item.brand];
  }

  const cals = Number(item.calories) || 0;
  const p = Number(item.protein) || 0;
  const c = Number(item.carbs) || 0;
  const f = Number(item.fat) || 0;
  const fib = Number(item.fiber) || 0;
  const cat = (item.category || '').toLowerCase();

  // 3. High Protein (20g+ or 30%+ calories from protein)
  if (p >= 20 || (p >= 10 && (p * 4) / Math.max(1, cals) >= 0.30)) {
    if (f <= 3.5 && cals <= 180) {
      return { badge: '🟢 Lean Protein', color: 'green' };
    }
    return { badge: '🟢 High Protein', color: 'green' };
  }

  // 4. High Fiber (5g+)
  if (fib >= 5) {
    return { badge: '🌾 High Fiber', color: 'purple' };
  }

  // 5. Low Calorie (<= 100 kcal, or <= 220 kcal for veg / fruit)
  if (cals > 0 && (cals <= 100 || (cals <= 220 && (cat.includes('veg') || cat.includes('fruit'))))) {
    return { badge: '🌱 Low Calorie', color: 'green' };
  }

  // 6. Healthy Fats / Low Carb
  if (f >= 14 && c <= 15) {
    return { badge: '🥑 Healthy Fats', color: 'yellow' };
  }

  // 7. High Energy / Complex Carbs (25g+ carbs and 50%+ calories from carbs)
  if (c >= 25 && (c * 4) / Math.max(1, cals) >= 0.50) {
    return { badge: '⚡ Energy Carbs', color: 'blue' };
  }

  // 8. Category Fallbacks
  if (cat.includes('protein')) return { badge: '🍗 Protein Source', color: 'green' };
  if (cat.includes('carb')) return { badge: '⚡ Complex Carbs', color: 'blue' };
  if (cat.includes('fat')) return { badge: '🥑 Healthy Fats', color: 'yellow' };
  if (cat.includes('veg')) return { badge: '🥦 Fresh Greens', color: 'green' };
  if (cat.includes('fruit')) return { badge: '🍎 Fresh Fruit', color: 'green' };
  if (cat.includes('dairy')) return { badge: '🥛 Dairy Fuel', color: 'blue' };

  return { badge: '🥗 Balanced', color: 'blue' };
};

export const getBadgeStyles = (color?: BadgeColor) => {
  switch (color) {
    case 'green':
      return {
        container: 'bg-accent/15 border-accent/30 dark:border-accent-dark/30',
        text: 'text-accent dark:text-accent-dark',
      };
    case 'blue':
      return {
        container: 'bg-info/15 border-info/30 dark:border-info-dark/30',
        text: 'text-info dark:text-info-dark',
      };
    case 'purple':
      return {
        container: 'bg-tertiary/15 border-tertiary/30 dark:border-tertiary-dark/30',
        text: 'text-tertiary dark:text-tertiary-dark',
      };
    case 'yellow':
    default:
      return {
        container: 'bg-warning/15 border-warning/30 dark:border-warning-dark/30',
        text: 'text-warning dark:text-warning-dark',
      };
  }
};

export const calculatePersonalizedTargets = (
  user?: { weight?: number | null; height?: number | null; age?: number | null; goal?: string | null } | null,
  fallbackGoal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS' = 'MUSCLE_GAIN'
): MacroTargets => {
  const goal = (user?.goal as any) || fallbackGoal;
  const isMuscleGain = goal === 'MUSCLE_GAIN';

  const w = Number(user?.weight) || 70;
  const h = Number(user?.height) || 175;
  const a = Number(user?.age) || 25;

  const bmr = 10 * w + 6.25 * h - 5 * a + 5;
  const tdee = Math.round(bmr * 1.35);

  let calories = isMuscleGain ? tdee + 300 : Math.max(1400, tdee - 450);
  calories = Math.max(1400, Math.min(4500, calories));

  const protein = Math.round(w * (isMuscleGain ? 2.0 : 1.8));
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(50, Math.round((calories - (protein * 4 + fat * 9)) / 4));

  return {
    calories,
    protein,
    carbs,
    fat,
  };
};

