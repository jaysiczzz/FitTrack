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
  healthNotes?: string
  imageUri?: string
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
          healthNotes: m.healthNotes || null,
          imageUri: m.imageUri || null,
        })),
      })
    }

    // 4. Return the full daily log with fresh meals
    return await tx.dailyFoodLog.findUnique({
      where: { id: dailyLog.id },
      include: {
        meals: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  })
}

export async function getFoodLogHistoryFromDb(userId: string) {
  return await prisma.dailyFoodLog.findMany({
    where: { userId },
    include: {
      meals: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { date: 'desc' },
  })
}

export async function getDailyFoodLogByDateFromDb(userId: string, date: string) {
  return await prisma.dailyFoodLog.findUnique({
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
}

export async function deleteDailyFoodLogFromDb(userId: string, date: string) {
  return await prisma.dailyFoodLog.deleteMany({
    where: {
      userId,
      date,
    },
  })
}
