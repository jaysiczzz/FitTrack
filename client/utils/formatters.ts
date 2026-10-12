/**
 * Capitalizes the first letter of each word in a string (Title Case)
 * e.g. "john doe" -> "John Doe", "ALEX RIVERA" -> "Alex Rivera"
 */
export function capitalizeWords(str?: string | null): string {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats fitness goal keys into human-readable Title Case labels.
 * e.g. "MUSCLE_GAIN" | "muscle" -> "Muscle Gain", "WEIGHT_LOSS" | "loss" -> "Weight Loss"
 */
export function formatGoalLabel(goal?: string | null): string {
  if (!goal) return 'Not set';
  const normalized = goal.toUpperCase().trim();
  if (normalized === 'MUSCLE_GAIN' || normalized === 'MUSCLE') {
    return 'Muscle Gain';
  }
  if (normalized === 'WEIGHT_LOSS' || normalized === 'LOSS') {
    return 'Weight Loss';
  }
  if (normalized === 'MAINTENANCE') {
    return 'Maintenance';
  }
  return capitalizeWords(goal.replace(/_/g, ' '));
}

/**
 * Returns today's date formatted as YYYY-MM-DD.
 */
export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a YYYY-MM-DD date string into a friendly calendar heading ("Today (Oct 12)", "Yesterday (Oct 11)", etc.).
 */
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

/**
 * Calculates BMI value and standard WHO weight classification.
 */
export function calculateBmi(weightKg: number, heightCm: number): {
  bmi: number;
  category: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
  color: string;
} {
  if (!heightCm || heightCm <= 0 || !weightKg || weightKg <= 0) {
    return { bmi: 0, category: 'Normal', color: '#10B981' };
  }
  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  let category: 'Underweight' | 'Normal' | 'Overweight' | 'Obese' = 'Normal';
  let color = '#10B981';
  if (bmi < 18.5) {
    category = 'Underweight';
    color = '#3B82F6';
  } else if (bmi < 25) {
    category = 'Normal';
    color = '#10B981';
  } else if (bmi < 30) {
    category = 'Overweight';
    color = '#F59E0B';
  } else {
    category = 'Obese';
    color = '#EF4444';
  }
  return { bmi, category, color };
}
