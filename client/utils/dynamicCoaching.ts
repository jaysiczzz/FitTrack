import { AIInsight } from '@/api/ai';
import { DashboardWorkoutExercise } from '@/components/dashboard/TodayWorkoutCard';

export interface DynamicCoachingContext {
  caloriesLogged: number;
  proteinLogged: number;
  carbsLogged: number;
  fatLogged: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  waterMl: number;
  targetWater: number;
  userGoal: 'MUSCLE_GAIN' | 'WEIGHT_LOSS';
  todayExercises: DashboardWorkoutExercise[];
  workoutSessionDone: boolean;
  todayCompletedWorkoutStats?: { duration: number; caloriesBurned: number } | null;
  currentStreak: number;
  userName?: string;
  gender?: string;
}

/**
 * Calculates instant, dynamic coaching tips on the dashboard
 * in real-time based on today's logged macros, workout completion, and water intake.
 */
export function generateDynamicCoachingInsights(ctx: DynamicCoachingContext): AIInsight[] {
  const completedExCount = ctx.todayExercises.filter((e) => e.isCompleted).length;
  const totalExCount = ctx.todayExercises.length;
  const streakText = ctx.currentStreak > 0 ? `${ctx.currentStreak}-day streak` : 'daily streak';

  // 1. Training & Workout State
  let workoutInsight: AIInsight;

  if (ctx.workoutSessionDone) {
    const duration = ctx.todayCompletedWorkoutStats?.duration || 35;
    const caloriesBurned = ctx.todayCompletedWorkoutStats?.caloriesBurned || 240;
    const recProtein = ctx.gender === 'FEMALE' ? '20-25g' : '25-35g';
    const hasLoggedProtein = typeof ctx.proteinLogged === 'number' && ctx.proteinLogged > 0;
    const targetProt = ctx.targetProtein || 140;
    const protDiff = targetProt - (ctx.proteinLogged || 0);

    let recoveryProteinLine: string;
    if (hasLoggedProtein) {
      if (protDiff > 0) {
        recoveryProteinLine = `Consume ${recProtein} of protein in your post-workout window to initiate muscle protein synthesis (${protDiff}g remaining today).`;
      } else {
        recoveryProteinLine = `Daily protein target achieved! Focus on cellular rehydration and restful recovery.`;
      }
    } else {
      recoveryProteinLine = `Consume ${recProtein} of high-quality protein in your post-workout window to initiate muscle protein synthesis and recovery.`;
    }

    workoutInsight = {
      title: 'Workout Completed · Anabolic Recovery',
      lines: [
        `Finished ${duration} min session (${caloriesBurned} kcal burned). Your ${streakText} is officially locked in!`,
        recoveryProteinLine,
      ],
    };
  } else if (totalExCount > 0) {
    if (completedExCount > 0) {
      workoutInsight = {
        title: 'Mid-Session Training Focus',
        lines: [
          `${completedExCount} of ${totalExCount} exercises completed. Keep rest periods disciplined (60-90s) to sustain muscular density.`,
          `Quality over quantity on each repetition: control the eccentric phase on remaining sets.`,
        ],
      };
    } else {
      workoutInsight = {
        title: "Today's Session Ready",
        lines: [
          `${totalExCount} exercises planned for today. Complete a 5-minute dynamic warmup to prime your joints and central nervous system.`,
          `Target progressive overload by focusing on clean technique and full range of motion.`,
        ],
      };
    }
  } else {
    workoutInsight = {
      title: 'Training Consistency & Readiness',
      lines: [
        `No workout recorded yet today. Even a 25-minute workout keeps your ${streakText} and momentum going.`,
        `Explore pre-designed routines or select custom exercises to get started.`,
      ],
    };
  }

  // 2. Macronutrient & Energy Balance
  let nutritionInsight: AIInsight;
  const calLogged = ctx.caloriesLogged || 0;
  const calTarget = Math.max(1, ctx.targetCalories || 2000);
  const protLogged = ctx.proteinLogged || 0;
  const protTarget = Math.max(1, ctx.targetProtein || 140);
  const calRemaining = Math.max(0, calTarget - calLogged);
  const protRemaining = Math.max(0, protTarget - protLogged);
  const calPct = Math.round((calLogged / calTarget) * 100);

  if (calLogged === 0) {
    nutritionInsight = {
      title: 'Daily Nutrition Pacing',
      lines: [
        `No meals logged yet today. Logging your first meal sets a structured metabolic baseline.`,
        `Today's targets: ${calTarget} kcal with ${protTarget}g protein tailored for ${
          ctx.userGoal === 'MUSCLE_GAIN' ? 'lean hypertrophy' : 'sustainable fat loss'
        }.`,
      ],
    };
  } else if (ctx.userGoal === 'WEIGHT_LOSS') {
    if (calLogged > calTarget) {
      nutritionInsight = {
        title: 'Calorie Budget Advisory',
        lines: [
          `Logged ${calLogged} / ${calTarget} kcal (+${calLogged - calTarget} kcal over target).`,
          `Keep any remaining intake strictly focused on lean proteins and water to maintain satiety without excess calories.`,
        ],
      };
    } else {
      nutritionInsight = {
        title: 'Fat Loss Calorie Deficit Pacing',
        lines: [
          `${calRemaining} kcal remaining (${calPct}% consumed). Pacing is right on track to maintain a consistent fat-loss deficit.`,
          protRemaining > 0
            ? `Prioritize lean protein for your remaining intake (${protRemaining}g to go) to protect lean muscle mass.`
            : `Protein target achieved (${protLogged}g)! Phenomenal dietary adherence today.`,
        ],
      };
    }
  } else {
    // MUSCLE_GAIN
    if (calLogged > calTarget + 300) {
      nutritionInsight = {
        title: 'Caloric Surplus Advisory',
        lines: [
          `Logged ${calLogged} / ${calTarget} kcal (+${calLogged - calTarget} kcal above target).`,
          `You've exceeded your planned surplus. Cap further intake today to minimize excess fat accumulation.`,
        ],
      };
    } else if (calRemaining > 600) {
      nutritionInsight = {
        title: 'Hypertrophy Caloric Surplus',
        lines: [
          `Logged ${calLogged} / ${calTarget} kcal (${calRemaining} kcal remaining). Muscle synthesis requires a consistent caloric surplus.`,
          protRemaining > 0
            ? `Still need ${protRemaining}g protein today. Aim for quality amino acid sources (eggs, chicken, beef, or whey).`
            : `Protein target reached! Fill remaining calories with complex carbohydrates for glycogen storage.`,
        ],
      };
    } else {
      nutritionInsight = {
        title: 'Muscle Building Macros on Track',
        lines: [
          `Logged ${calLogged} / ${calTarget} kcal (${calPct}% of target). Solid energy pacing supporting tissue growth and repair.`,
          protRemaining > 0
            ? `Only ${protRemaining}g protein left to reach your ${protTarget}g daily threshold.`
            : `Macronutrient targets fully satisfied! Your body has the fuel it needs to build muscle.`,
        ],
      };
    }
  }

  // 3. Hydration & Daily Habit Synergy
  let hydrationInsight: AIInsight;
  const targetWater = Math.max(1, ctx.targetWater || 2000);
  const waterLogged = ctx.waterMl || 0;
  const waterPct = Math.round((waterLogged / targetWater) * 100);

  if (waterLogged < targetWater * 0.5) {
    hydrationInsight = {
      title: 'Hydration Optimization',
      lines: [
        `Logged ${waterLogged.toLocaleString()}ml of water (${waterPct}% of ${targetWater.toLocaleString()}ml target). Even 2% dehydration impairs muscular power.`,
        `Use the quick +250ml water buttons above to consistently rehydrate throughout your day.`,
      ],
    };
  } else if (waterLogged >= targetWater) {
    hydrationInsight = {
      title: 'Optimal Hydration Achieved',
      lines: [
        `Daily hydration goal completed (${waterLogged.toLocaleString()}ml)! Full cellular hydration enhances nutrient transport and joint resilience.`,
        `Maintain steady sipping if completing additional cardio or high-temperature training.`,
      ],
    };
  } else {
    hydrationInsight = {
      title: 'Hydration Steady Progress',
      lines: [
        `Currently at ${waterLogged.toLocaleString()} / ${targetWater.toLocaleString()}ml (${waterPct}%). On pace for optimal cellular recovery.`,
        `Drinking water consistently between meals also aids digestive efficiency and nutrient absorption.`,
      ],
    };
  }

  return [workoutInsight, nutritionInsight, hydrationInsight];
}
