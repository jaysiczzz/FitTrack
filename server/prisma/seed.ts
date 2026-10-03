import 'dotenv/config'
import { prisma } from '../src/config/db'
import { DEFAULT_LIBRARY } from '../src/models/workout.model'

// Comprehensive verified staple foods
const VERIFIED_FOOD_STAPLES = [
  // ===================== BEGINNER STAPLE MEALS =====================
  {
    name: 'Grilled Chicken & White Rice',
    category: 'Staples',
    servingSize: '1 bowl (350g)',
    servingWeightG: 350,
    servingUnit: 'bowl',
    calories: 410,
    protein: 42,
    carbs: 45,
    fat: 4,
    description: 'High Protein Staple Meal for clean muscle building.',
    ingredients: '150g breast · 1 cup steamed rice · 1/2 cup broccoli',
    icon: '🍗',
    brand: 'High Protein Staple',
  },
  {
    name: 'Whey Protein Shake & Banana',
    category: 'Staples',
    servingSize: '1 shake (400ml)',
    servingWeightG: 400,
    servingUnit: 'shake',
    calories: 225,
    protein: 26,
    carbs: 28,
    fat: 2,
    description: 'Post-Workout Fuel for fast recovery.',
    ingredients: '1 scoop whey protein (25g) · 1 medium banana · water',
    icon: '🥛',
    brand: 'Post-Workout Fuel',
  },
  {
    name: 'Boiled Eggs & Whole Wheat Toast',
    category: 'Staples',
    servingSize: '1 plate (180g)',
    servingWeightG: 180,
    servingUnit: 'plate',
    calories: 290,
    protein: 18,
    carbs: 24,
    fat: 11,
    description: 'Classic Balanced Breakfast with essential fats.',
    ingredients: '2 large whole eggs · 2 slices whole wheat toast',
    icon: '🍳',
    brand: 'Classic Breakfast',
  },
  {
    name: 'Greek Yogurt with Berries & Honey',
    category: 'Staples',
    servingSize: '1 bowl (250g)',
    servingWeightG: 250,
    servingUnit: 'bowl',
    calories: 185,
    protein: 19,
    carbs: 23,
    fat: 1,
    description: 'Low Calorie & High Protein snack for fat loss.',
    ingredients: '170g non-fat Greek yogurt · 1/2 cup berries · 1 tsp honey',
    icon: '🫐',
    brand: 'Low Calorie & High Protein',
  },
  {
    name: 'Tuna & Avocado Mixed Salad',
    category: 'Staples',
    servingSize: '1 bowl (300g)',
    servingWeightG: 300,
    servingUnit: 'bowl',
    calories: 280,
    protein: 34,
    carbs: 8,
    fat: 13,
    description: 'Lean Fat Loss Salad with heart-healthy monounsaturated fats.',
    ingredients: '1 can chunk light tuna · 1/2 avocado · mixed greens & lemon',
    icon: '🥗',
    brand: 'Lean Fat Loss',
  },
  {
    name: 'Oatmeal with Peanut Butter',
    category: 'Staples',
    servingSize: '1 bowl (280g)',
    servingWeightG: 280,
    servingUnit: 'bowl',
    calories: 330,
    protein: 11,
    carbs: 48,
    fat: 12,
    description: 'Slow-Digesting Energy complex carbs breakfast.',
    ingredients: '1 cup cooked oats · 1 tbsp natural peanut butter · cinnamon',
    icon: '🥣',
    brand: 'Slow-Digesting Energy',
  },
  {
    name: 'Salmon Fillet & Roasted Sweet Potato',
    category: 'Staples',
    servingSize: '1 plate (300g)',
    servingWeightG: 300,
    servingUnit: 'plate',
    calories: 420,
    protein: 35,
    carbs: 32,
    fat: 16,
    description: 'Omega-3 Rich Recovery Meal supporting joints and heart.',
    ingredients: '150g baked salmon · 150g baked sweet potato',
    icon: '🐟',
    brand: 'Omega-3 Rich Recovery',
  },
  {
    name: 'Cottage Cheese & Apple Slices',
    category: 'Staples',
    servingSize: '1 bowl (350g)',
    servingWeightG: 350,
    servingUnit: 'bowl',
    calories: 220,
    protein: 24,
    carbs: 26,
    fat: 2,
    description: 'Casein Night Snack for steady overnight muscle protein synthesis.',
    ingredients: '1 cup low-fat cottage cheese · 1 sliced red apple',
    icon: '🍏',
    brand: 'Casein Night Snack',
  },

  // Protein Staples
  {
    name: 'Chicken Breast (Cooked, Skinless)',
    category: 'Protein',
    servingSize: '100g',
    servingWeightG: 100,
    servingUnit: 'g',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    description: 'Lean high-protein staple with minimal saturated fat.',
    ingredients: '100% skinless, boneless chicken breast',
    icon: '🍗',
  },
  {
    name: 'Chicken Thigh (Skinless, Cooked)',
    category: 'Protein',
    servingSize: '100g',
    servingWeightG: 100,
    servingUnit: 'g',
    calories: 209,
    protein: 26,
    carbs: 0,
    fat: 10.9,
    icon: '🍗',
  },
  {
    name: 'Whole Large Egg',
    category: 'Protein',
    servingSize: '1 large egg (50g)',
    servingWeightG: 50,
    servingUnit: 'egg',
    calories: 72,
    protein: 6.3,
    carbs: 0.4,
    fat: 4.8,
    icon: '🥚',
  },
  {
    name: 'Liquid Egg Whites',
    category: 'Protein',
    servingSize: '100g',
    servingWeightG: 100,
    servingUnit: 'g',
    calories: 52,
    protein: 11,
    carbs: 0.7,
    fat: 0.2,
    icon: '🍳',
  },
  {
    name: 'Lean Ground Beef (90/10, Cooked)',
    category: 'Protein',
    servingSize: '100g',
    servingWeightG: 100,
    servingUnit: 'g',
    calories: 217,
    protein: 26.1,
    carbs: 0,
    fat: 11.8,
    icon: '🥩',
  },
  {
    name: 'Atlantic Salmon Fillet (Cooked)',
    category: 'Protein',
    servingSize: '100g',
    servingWeightG: 100,
    servingUnit: 'g',
    calories: 208,
    protein: 22,
    carbs: 0,
    fat: 13,
    icon: '🐟',
  },
  {
    name: 'Canned Tuna (in Spring Water, Drained)',
    category: 'Protein',
    servingSize: '1 can (120g drained)',
    servingWeightG: 120,
    servingUnit: 'can',
    calories: 132,
    protein: 29.5,
    carbs: 0,
    fat: 1.2,
    icon: '🐟',
  },
  {
    name: 'Whey Protein Powder (Vanilla/Chocolate)',
    category: 'Protein',
    servingSize: '1 scoop (30g)',
    servingWeightG: 30,
    servingUnit: 'scoop',
    calories: 120,
    protein: 24,
    carbs: 3,
    fat: 1.5,
    icon: '🥤',
  },
  {
    name: 'Firm Tofu',
    category: 'Protein',
    servingSize: '100g',
    servingWeightG: 100,
    servingUnit: 'g',
    calories: 83,
    protein: 10,
    carbs: 1.2,
    fat: 5.3,
    icon: '🧊',
  },

  // Dairy & High-Protein Dairy
  {
    name: 'Greek Yogurt (0% Fat, Plain)',
    category: 'Dairy',
    servingSize: '150g',
    servingWeightG: 150,
    servingUnit: 'g',
    calories: 88,
    protein: 15.5,
    carbs: 5.4,
    fat: 0.2,
    icon: '🥣',
  },
  {
    name: 'Cottage Cheese (Low Fat 1%)',
    category: 'Dairy',
    servingSize: '100g',
    servingWeightG: 100,
    servingUnit: 'g',
    calories: 72,
    protein: 12.4,
    carbs: 2.7,
    fat: 1,
    icon: '🧀',
  },
  {
    name: 'Whole Milk (3.25%)',
    category: 'Dairy',
    servingSize: '1 cup (240ml)',
    servingWeightG: 240,
    servingUnit: 'cup',
    calories: 149,
    protein: 7.7,
    carbs: 11.7,
    fat: 7.9,
    icon: '🥛',
  },
  {
    name: 'Skim / Non-Fat Milk',
    category: 'Dairy',
    servingSize: '1 cup (240ml)',
    servingWeightG: 240,
    servingUnit: 'cup',
    calories: 83,
    protein: 8.3,
    carbs: 12.2,
    fat: 0.2,
    icon: '🥛',
  },

  // Carbohydrate & Grain Staples
  {
    name: 'White Rice (Cooked, Jasmine)',
    category: 'Carbs',
    servingSize: '1 cup cooked (158g)',
    servingWeightG: 158,
    servingUnit: 'cup',
    calories: 205,
    protein: 4.2,
    carbs: 44.5,
    fat: 0.4,
    icon: '🍚',
  },
  {
    name: 'Brown Rice (Cooked)',
    category: 'Carbs',
    servingSize: '1 cup cooked (195g)',
    servingWeightG: 195,
    servingUnit: 'cup',
    calories: 216,
    protein: 5,
    carbs: 44.8,
    fat: 1.8,
    icon: '🍚',
  },
  {
    name: 'Rolled Oats (Dry)',
    category: 'Carbs',
    servingSize: '1/2 cup dry (40g)',
    servingWeightG: 40,
    servingUnit: 'cup',
    calories: 150,
    protein: 5,
    carbs: 27,
    fat: 2.5,
    fiber: 4,
    icon: '🥣',
  },
  {
    name: 'Sweet Potato (Baked, Flesh & Skin)',
    category: 'Carbs',
    servingSize: '1 medium (130g)',
    servingWeightG: 130,
    servingUnit: 'potato',
    calories: 112,
    protein: 2,
    carbs: 26,
    fat: 0.1,
    fiber: 3.9,
    icon: '🍠',
  },
  {
    name: 'Whole Wheat Bread',
    category: 'Carbs',
    servingSize: '1 slice (38g)',
    servingWeightG: 38,
    servingUnit: 'slice',
    calories: 81,
    protein: 4,
    carbs: 13.8,
    fat: 1.1,
    fiber: 1.9,
    icon: '🍞',
  },
  {
    name: 'Quinoa (Cooked)',
    category: 'Carbs',
    servingSize: '1 cup cooked (185g)',
    servingWeightG: 185,
    servingUnit: 'cup',
    calories: 222,
    protein: 8.1,
    carbs: 39.4,
    fat: 3.6,
    fiber: 5.2,
    icon: '🌾',
  },

  // Healthy Fats & Nuts
  {
    name: 'Natural Peanut Butter',
    category: 'Fats',
    servingSize: '2 tbsp (32g)',
    servingWeightG: 32,
    servingUnit: 'tbsp',
    calories: 188,
    protein: 8,
    carbs: 7,
    fat: 16,
    fiber: 2,
    icon: '🥜',
  },
  {
    name: 'Extra Virgin Olive Oil',
    category: 'Fats',
    servingSize: '1 tbsp (14g)',
    servingWeightG: 14,
    servingUnit: 'tbsp',
    calories: 119,
    protein: 0,
    carbs: 0,
    fat: 13.5,
    icon: '🫒',
  },
  {
    name: 'Avocado (Fresh)',
    category: 'Fats',
    servingSize: '1/2 medium avocado (100g)',
    servingWeightG: 100,
    servingUnit: 'half',
    calories: 160,
    protein: 2,
    carbs: 8.5,
    fat: 14.7,
    fiber: 6.7,
    icon: '🥑',
  },
  {
    name: 'Raw Almonds',
    category: 'Fats',
    servingSize: '1 oz / 28g (approx 23 nuts)',
    servingWeightG: 28,
    servingUnit: 'oz',
    calories: 164,
    protein: 6,
    carbs: 6.1,
    fat: 14.2,
    fiber: 3.5,
    icon: '🥜',
  },

  // Fruits
  {
    name: 'Banana (Fresh, Medium)',
    category: 'Fruits',
    servingSize: '1 medium (118g)',
    servingWeightG: 118,
    servingUnit: 'banana',
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.3,
    fiber: 3.1,
    icon: '🍌',
  },
  {
    name: 'Apple (Medium, with Skin)',
    category: 'Fruits',
    servingSize: '1 medium (182g)',
    servingWeightG: 182,
    servingUnit: 'apple',
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
    fiber: 4.4,
    icon: '🍎',
  },
  {
    name: 'Fresh Blueberries',
    category: 'Fruits',
    servingSize: '1 cup (148g)',
    servingWeightG: 148,
    servingUnit: 'cup',
    calories: 84,
    protein: 1.1,
    carbs: 21.4,
    fat: 0.5,
    fiber: 3.6,
    icon: '🫐',
  },

  // Vegetables
  {
    name: 'Broccoli (Cooked/Steamed)',
    category: 'Vegetables',
    servingSize: '1 cup chopped (156g)',
    servingWeightG: 156,
    servingUnit: 'cup',
    calories: 55,
    protein: 3.7,
    carbs: 11.2,
    fat: 0.6,
    fiber: 5.1,
    icon: '🥦',
  },
  {
    name: 'Raw Baby Spinach',
    category: 'Vegetables',
    servingSize: '2 cups raw (60g)',
    servingWeightG: 60,
    servingUnit: 'cups',
    calories: 14,
    protein: 1.7,
    carbs: 2.2,
    fat: 0.2,
    fiber: 1.3,
    icon: '🥬',
  },
]

const generatePresetsForExercise = (ex: any) => {
  const isBodyweight = ex.type === 'Bodyweight' || ex.type === 'Calisthenics'
  const isCardioOrStretch = ex.type === 'Cardio' || ex.type === 'Stretch' || ex.type === 'Mobility'

  if (isCardioOrStretch) {
    return {
      beginner: {
        difficulty: 'Beginner',
        recommendedSets: 1,
        recommendedReps: 1,
        recommendedDuration: 600,
        recommendedRest: 45,
        recommendedTempo: 'Gentle Pace',
        defaultSets: [{ weight: 0, reps: 1, duration: 600 }],
        cue: 'Beginner: Light 10-minute aerobic pace to build baseline stamina.',
      },
      intermediate: {
        difficulty: 'Intermediate',
        recommendedSets: 1,
        recommendedReps: 1,
        recommendedDuration: 1800,
        recommendedRest: 60,
        recommendedTempo: 'Target Pace',
        defaultSets: [{ weight: 0, reps: 1, duration: 1800 }],
        cue: 'Intermediate: Standard 30-minute steady-state endurance threshold.',
      },
      advanced: {
        difficulty: 'Advanced',
        recommendedSets: 1,
        recommendedReps: 1,
        recommendedDuration: 2700,
        recommendedRest: 90,
        recommendedTempo: 'HIIT / High Pace',
        defaultSets: [{ weight: 0, reps: 1, duration: 2700 }],
        cue: 'Advanced: Intense 45-minute interval or high-tempo endurance challenge.',
      },
    }
  }

  if (isBodyweight) {
    return {
      beginner: {
        difficulty: 'Beginner',
        recommendedSets: 3,
        recommendedReps: 8,
        recommendedRest: 60,
        recommendedTempo: '2-0-1-0',
        defaultSets: [{ bodyweight: true, reps: 8 }, { bodyweight: true, reps: 8 }, { bodyweight: true, reps: 8 }],
        cue: 'Beginner: Focus on clean posture, knee modifications, and controlled reps.',
      },
      intermediate: {
        difficulty: 'Intermediate',
        recommendedSets: 3,
        recommendedReps: 12,
        recommendedRest: 75,
        recommendedTempo: '2-0-1-0',
        defaultSets: [{ bodyweight: true, reps: 12 }, { bodyweight: true, reps: 12 }, { bodyweight: true, reps: 10 }],
        cue: 'Intermediate: Strict form with full depth & scapular stabilization.',
      },
      advanced: {
        difficulty: 'Advanced',
        recommendedSets: 4,
        recommendedReps: 18,
        recommendedRest: 90,
        recommendedTempo: '3-1-1-0',
        defaultSets: [{ bodyweight: true, reps: 18 }, { bodyweight: true, reps: 16 }, { bodyweight: true, reps: 15 }, { bodyweight: true, reps: 12 }],
        cue: 'Advanced: Explosive push & 3-second controlled eccentric descent.',
      },
    }
  }

  const baseWeight = ex.defaultSets && ex.defaultSets[0]?.weight ? Number(ex.defaultSets[0].weight) : 30
  const begW = Math.max(10, Math.round(baseWeight * 0.6))
  const intW = baseWeight
  const advW = Math.round(baseWeight * 1.35)

  return {
    beginner: {
      difficulty: 'Beginner',
      recommendedSets: 3,
      recommendedReps: 12,
      recommendedRest: 60,
      recommendedTempo: '2-0-1-0',
      defaultSets: [{ weight: begW, reps: 12 }, { weight: begW, reps: 12 }, { weight: begW, reps: 10 }],
      cue: 'Beginner: Lighter load (12 reps) to master path of motion and joint stability.',
    },
    intermediate: {
      difficulty: 'Intermediate',
      recommendedSets: 3,
      recommendedReps: 10,
      recommendedRest: 90,
      recommendedTempo: '2-0-1-0',
      defaultSets: [{ weight: intW, reps: 10 }, { weight: Math.round(intW * 1.05), reps: 8 }, { weight: Math.round(intW * 1.1), reps: 8 }],
      cue: 'Intermediate: Moderate working load (10 reps) for progressive hypertrophy.',
    },
    advanced: {
      difficulty: 'Advanced',
      recommendedSets: 4,
      recommendedReps: 6,
      recommendedRest: 120,
      recommendedTempo: '3-1-1-0',
      defaultSets: [{ weight: advW, reps: 6 }, { weight: Math.round(advW * 1.05), reps: 5 }, { weight: Math.round(advW * 1.1), reps: 4 }],
      cue: 'Advanced: Heavy working load (6 reps) with 3s slow negative & explosive drive.',
    },
  }
}

async function seed() {
  console.log('🌱 Starting FitTrack Database Seeding...')

  // 1. Seed System Exercises
  console.log('🏋️ Seeding System Exercise Catalog...')
  let exercisesSeeded = 0
  for (const ex of DEFAULT_LIBRARY) {
    const presets = generatePresetsForExercise(ex)
    const existing = await prisma.exercise.findFirst({ where: { name: ex.name } })

    const exerciseData = {
      name: ex.name,
      description: ex.description,
      category: ex.category,
      type: ex.type,
      difficulty: ex.difficulty,
      primaryMuscle: ex.primaryMuscle,
      muscleGroup: ex.muscleGroup,
      secondaryMuscles: ex.secondaryMuscles,
      bodyPart: ex.bodyPart,
      equipment: ex.equipment,
      equipmentAlternatives: ex.equipmentAlternatives,
      startingPosition: ex.startingPosition,
      instructions: ex.instructions,
      formTips: ex.formTips,
      commonMistakes: ex.commonMistakes,
      breathingTechnique: ex.breathingTechnique,
      recommendedSets: ex.recommendedSets,
      recommendedReps: ex.recommendedReps,
      recommendedDuration: ex.recommendedDuration,
      recommendedRest: ex.recommendedRest,
      recommendedTempo: ex.recommendedTempo,
      defaultSets: ex.defaultSets,
      imageUrl: ex.imageUrl,
      thumbnailUrl: ex.thumbnailUrl,
      safetyInstructions: ex.safetyInstructions,
      injuryPreventionTips: ex.injuryPreventionTips,
      beginnerModification: ex.beginnerModification,
      advancedVariation: ex.advancedVariation,
      easierAlternative: ex.easierAlternative,
      harderAlternative: ex.harderAlternative,
      equipmentFreeAlternative: ex.equipmentFreeAlternative,
      similarExercises: ex.similarExercises,
      tags: ex.tags,
      difficultyPresets: presets,
      isSystem: true,
      userId: null,
    }

    if (!existing) {
      await prisma.exercise.create({ data: exerciseData })
    } else {
      await prisma.exercise.update({
        where: { id: existing.id },
        data: exerciseData,
      })
    }
    exercisesSeeded++
  }
  console.log(`✅ Seeded ${exercisesSeeded} system exercises.`)

  // 2. Seed Verified Food Staples
  console.log('🥗 Seeding Verified Food Staples Catalog...')
  let foodsSeeded = 0
  for (const food of VERIFIED_FOOD_STAPLES) {
    const existing = await prisma.food.findFirst({
      where: { name: food.name, source: 'SYSTEM' },
    })

    const foodData = {
      name: food.name,
      brand: (food as any).brand ?? null,
      category: food.category,
      servingSize: food.servingSize,
      servingWeightG: food.servingWeightG,
      servingUnit: food.servingUnit,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber ?? null,
      description: (food as any).description ?? null,
      ingredients: (food as any).ingredients ?? null,
      icon: food.icon,
      isVerified: true,
      source: 'SYSTEM' as const,
      userId: null,
    }

    if (!existing) {
      await prisma.food.create({ data: foodData })
    } else {
      await prisma.food.update({
        where: { id: existing.id },
        data: foodData,
      })
    }
    foodsSeeded++
  }
  console.log(`✅ Seeded ${foodsSeeded} verified staple foods.`)

  console.log('🎉 FitTrack Seeding Completed Successfully!')
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
