/**
 * Utility functions for calculating active consistency streaks based on "Today's Goals".
 * A day qualifies as an active streak day if at least one daily goal was completed:
 * - Daily Workout Session completed
 * - Daily Readiness Check-In completed
 * - Nutrition & Daily Intake logged/completed
 * - Hydration Target achieved
 */

export function formatDateKey(d: Date): string {
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function extractActiveDatesFromHistory(
  workoutSessions?: any[],
  checkIns?: any[],
  foodLogs?: any[],
  targetWaterMl: number = 2500
): Set<string> {
  const dates = new Set<string>();

  // 1. Workouts
  if (Array.isArray(workoutSessions)) {
    for (const s of workoutSessions) {
      const timestamp = s.completedAt || s.dateStr || (s.completed ? s.createdAt : null);
      if (timestamp) {
        if (typeof timestamp === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(timestamp)) {
          dates.add(timestamp);
        } else {
          const d = new Date(timestamp);
          const key = formatDateKey(d);
          if (key) dates.add(key);
        }
      }
    }
  }

  // 2. Check-Ins
  if (Array.isArray(checkIns)) {
    for (const c of checkIns) {
      if (c.date && /^\d{4}-\d{2}-\d{2}$/.test(c.date)) {
        dates.add(c.date);
      } else if (c.createdAt) {
        const d = new Date(c.createdAt);
        const key = formatDateKey(d);
        if (key) dates.add(key);
      }
    }
  }

  // 3. Nutrition & Hydration
  if (Array.isArray(foodLogs)) {
    for (const f of foodLogs) {
      const hasFood = Boolean(f.isCompleted || (f.totalCalories > 0 && f.meals && f.meals.length > 0));
      const hasWater = Boolean(typeof f.waterMl === 'number' && f.waterMl >= targetWaterMl);
      if (hasFood || hasWater) {
        if (f.date && /^\d{4}-\d{2}-\d{2}$/.test(f.date)) {
          dates.add(f.date);
        } else if (f.createdAt) {
          const key = formatDateKey(new Date(f.createdAt));
          if (key) dates.add(key);
        }
      }
    }
  }

  return dates;
}

export function calculateActiveStreak(
  activeDates: Set<string> | string[],
  isTodayActive: boolean = false
): number {
  const dateSet = new Set<string>(activeDates);

  const today = new Date();
  const todayKey = formatDateKey(today);

  if (isTodayActive) {
    dateSet.add(todayKey);
  } else {
    dateSet.delete(todayKey);
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  // If neither today nor yesterday has a completed goal, streak is 0
  let anchorDate: Date | null = null;
  if (dateSet.has(todayKey)) {
    anchorDate = new Date(today);
  } else if (dateSet.has(yesterdayKey)) {
    anchorDate = new Date(yesterday);
  } else {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(anchorDate);

  while (dateSet.has(formatDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
