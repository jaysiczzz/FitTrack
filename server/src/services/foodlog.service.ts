import { prisma } from '../config/db'

export interface FoodMealInput {
  mealType: string
  title: string
  subtitle?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  goalBadge?: string
  goalBadgeColor?: string
  icon?: string
  healthNotes?: string
  imageUri?: string
  loggedAt?: string
  macros?: string[]
}

export interface SaveDailyFoodLogInput {
  date: string
  items: FoodMealInput[]
  waterMl?: number
}

export async function saveDailyFoodLogInDb(userId: string, input: SaveDailyFoodLogInput) {
  const { date, items, waterMl = 0 } = input

  const totalCalories = items.reduce((sum, i) => sum + (Number(i.calories) || 0), 0)
  const totalProtein = items.reduce((sum, i) => sum + (Number(i.protein) || 0), 0)
  const totalCarbs = items.reduce((sum, i) => sum + (Number(i.carbs) || 0), 0)
  const totalFat = items.reduce((sum, i) => sum + (Number(i.fat) || 0), 0)

  // Use a transaction to upsert DailyFoodLog and replace its meals
  return await prisma.$transaction(async (tx) => {
    // 1. Upsert the DailyFoodLog parent record
    const dailyLog = await tx.dailyFoodLog.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      update: {
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        waterMl,
        updatedAt: new Date(),
      },
      create: {
        userId,
        date,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        waterMl,
      },
    })

    // 2. Clear old meals for this day
    await tx.foodLogMeal.deleteMany({
      where: {
        dailyFoodLogId: dailyLog.id,
      },
    })

    // 3. Insert the new meal items
    if (items.length > 0) {
      await tx.foodLogMeal.createMany({
        data: items.map((m) => ({
          dailyFoodLogId: dailyLog.id,
          mealType: m.mealType,
          title: m.title,
          subtitle: m.subtitle || null,
          calories: Math.round(Number(m.calories) || 0),
          protein: Number(m.protein) || 0,
          carbs: Number(m.carbs) || 0,
          fat: Number(m.fat) || 0,
          goalBadge: m.goalBadge || null,
          goalBadgeColor: m.goalBadgeColor || null,
          icon: m.icon || null,
          healthNotes: m.healthNotes || null,
          imageUri: m.imageUri || null,
          loggedAt: m.loggedAt || null,
        })),
      })
    }

    // 4. Return the full daily log with fresh formatted meals
    const saved = await tx.dailyFoodLog.findUnique({
      where: { id: dailyLog.id },
      include: {
        meals: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!saved) return null

    return {
      ...saved,
      meals: saved.meals.map(formatFoodLogMeal),
    }
  })
}

export function formatFoodLogMeal(meal: any) {
  return {
    ...meal,
    goalBadgeColor: meal.goalBadgeColor || (meal.goalBadge?.toLowerCase().includes('protein') ? 'green' : 'blue'),
    icon: meal.icon || '🥗',
    loggedAt: meal.loggedAt || (meal.createdAt ? new Date(meal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined),
    macros: [
      `${meal.protein}g Protein`,
      `${meal.carbs}g Carbs`,
      `${meal.fat}g Fat`,
    ],
  }
}

export async function getFoodLogHistoryFromDb(userId: string) {
  const history = await prisma.dailyFoodLog.findMany({
    where: { userId },
    include: {
      meals: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { date: 'desc' },
  })

  return history.map((log) => ({
    ...log,
    meals: log.meals.map(formatFoodLogMeal),
  }))
}

export async function getDailyFoodLogByDateFromDb(userId: string, date: string) {
  const log = await prisma.dailyFoodLog.findUnique({
    where: {
      userId_date: {
        userId,
        date,
      },
    },
    include: {
      meals: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!log) return null

  return {
    ...log,
    meals: log.meals.map(formatFoodLogMeal),
  }
}

export async function deleteDailyFoodLogFromDb(userId: string, date: string) {
  return await prisma.dailyFoodLog.deleteMany({
    where: {
      userId,
      date,
    },
  })
}

export async function searchFoodCatalogInDb(query: string, userId?: string) {
  const q = query.trim()
  return await prisma.food.findMany({
    where: {
      AND: [
        {
          OR: [
            { isVerified: true },
            { source: 'SYSTEM' },
            { source: 'OPEN_FOOD_FACTS' },
            ...(userId ? [{ userId }] : []),
          ],
        },
        {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
            { barcode: { equals: q } },
          ],
        },
      ],
    },
    take: 20,
    orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function cacheOpenFoodFactsProduct(product: {
  name: string
  brand?: string
  barcode?: string
  category?: string
  servingSize?: string
  servingWeightG?: number
  servingUnit?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  description?: string
  ingredients?: string
  icon?: string
  imageUrl?: string
}) {
  try {
    const existing = await prisma.food.findFirst({
      where: {
        OR: [
          ...(product.barcode ? [{ barcode: product.barcode }] : []),
          { name: product.name },
        ],
      },
    })

    if (!existing) {
      return await prisma.food.create({
        data: {
          name: product.name,
          brand: product.brand,
          barcode: product.barcode,
          category: product.category || 'Staples',
          servingSize: product.servingSize || '100g',
          servingWeightG: product.servingWeightG || 100,
          servingUnit: product.servingUnit || 'g',
          calories: product.calories,
          protein: product.protein,
          carbs: product.carbs,
          fat: product.fat,
          fiber: product.fiber,
          description: product.description,
          ingredients: product.ingredients,
          icon: product.icon || '🛒',
          imageUrl: product.imageUrl,
          isVerified: false,
          source: 'OPEN_FOOD_FACTS',
        },
      })
    }
    return existing
  } catch (err) {
    console.log('Failed to cache Open Food Facts product:', err)
    return null
  }
}

export async function createCustomFoodInDb(userId: string, data: {
  name: string
  brand?: string
  category?: string
  servingSize?: string
  servingWeightG?: number
  servingUnit?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  description?: string
  ingredients?: string
  icon?: string
}) {
  return await prisma.food.create({
    data: {
      name: data.name.trim(),
      brand: data.brand?.trim(),
      category: data.category || 'Custom',
      servingSize: data.servingSize || '1 serving',
      servingWeightG: Number(data.servingWeightG) || 100,
      servingUnit: data.servingUnit || 'serving',
      calories: Math.round(Number(data.calories) || 0),
      protein: Number(data.protein) || 0,
      carbs: Number(data.carbs) || 0,
      fat: Number(data.fat) || 0,
      fiber: data.fiber != null ? Number(data.fiber) : null,
      description: data.description?.trim(),
      ingredients: data.ingredients?.trim(),
      icon: data.icon || '⭐',
      isVerified: false,
      source: 'USER_CUSTOM',
      userId,
    },
  })
}

export async function deleteCustomFoodFromDb(userId: string, foodId: string) {
  const food = await prisma.food.findFirst({
    where: { id: foodId, userId },
  })
  if (!food) return false
  await prisma.food.delete({ where: { id: foodId } })
  return true
}
