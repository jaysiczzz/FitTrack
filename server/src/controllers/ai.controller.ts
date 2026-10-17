import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { asyncHandler } from '../utils/asyncHandler.utils'
import * as userModel from '../models/user.model'
import * as workoutModel from '../models/workout.model'
import { prisma } from '../config/db'
import {
  analyzeMealWithAI,
  generateAIInsights,
  generateAIWorkout,
  generateAIMealSuggestions,
  chatWithAICoach,
  streamAICoach,
  autocompleteExerciseWithAI,
  ChatMessage,
} from '../services/ai.service'
import { getUsage, releaseUsage } from '../utils/usage.utils'


export const analyzeMeal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { description, imageBase64, mimeType } = req.body
  const userId = req.user?.id

  if (!description && !imageBase64) {
    return res.status(400).json({ error: 'Please provide a text description or an image of the meal.' })
  }

  let isAborted = false
  req.on('close', async () => {
    if (!res.writableEnded) {
      isAborted = true
      if (userId) {
        await releaseUsage(userId, 'FOOD_SCAN')
        console.log(`[AI Controller] Client cancelled analyzeMeal for user ${userId}; refunded FOOD_SCAN quota.`)
      }
    }
  })

  const analysis = await analyzeMealWithAI({
    description,
    imageBase64,
    mimeType: mimeType || 'image/jpeg',
  })

  if (isAborted || res.writableEnded) {
    return
  }

  if (analysis.isFood === false) {
    if (userId) {
      await releaseUsage(userId, 'FOOD_SCAN')
    }
    const errorMsg =
      analysis.rejectionReason?.trim() ||
      'The provided image does not appear to contain food. Please take a clear photo of your meal, drink, or nutrition facts label.'
    return res.status(200).json({
      success: false,
      isFood: false,
      error: errorMsg,
      message: errorMsg,
    })
  }

  if (Array.isArray(analysis.dietaryFlags)) {
    const seen = new Set<string>()
    analysis.dietaryFlags = analysis.dietaryFlags.filter((flag) => {
      const trimmed = flag?.trim()
      if (!trimmed) return false
      const lower = trimmed.toLowerCase()
      if (seen.has(lower)) return false
      seen.add(lower)
      return true
    })
  }

  const usage = userId ? await getUsage(userId, 'FOOD_SCAN') : null

  res.json({ success: true, isFood: true, data: analysis, usage })
})

export const getInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  let user = null

  if (userId) {
    user = await userModel.findById(userId)
  }

  const { loggedMeals, targets, loggedMacros, userGoal } = req.body || {}

  const userProfile = {
    firstName: user?.firstName || 'Athlete',
    weight: user?.weight || 70,
    height: user?.height || 175,
    age: user?.age || 25,
    goal: userGoal || user?.goal || 'FITNESS',
    gender: user?.gender || 'MALE',
    loggedMeals,
    targets,
    loggedMacros,
  }

  const insights = await generateAIInsights(userProfile)

  res.json({ success: true, insights })
})

export const generateWorkout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  let user = null
  let personalRecords: any[] = []
  let weeklyWorkoutsCount = 0
  let lastWorkout: any = null

  if (userId) {
    user = await userModel.findById(userId)

    // 1. Fetch user's verified personal records for weight calibration
    personalRecords = await workoutModel.getPersonalRecords(userId).catch(() => [])

    // 2. Fetch workout session count in the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    weeklyWorkoutsCount = await prisma.workoutSession.count({
      where: {
        userId,
        completed: true,
        createdAt: { gte: sevenDaysAgo },
      },
    }).catch(() => 0)

    // 3. Fetch most recent workout to avoid overlapping muscle group fatigue
    lastWorkout = await prisma.workoutSession.findFirst({
      where: { userId, completed: true },
      orderBy: { createdAt: 'desc' },
      include: {
        exercises: {
          select: { name: true },
        },
      },
    }).catch(() => null)
  }

  const { targetArea, activityLevel } = req.body

  let isAborted = false
  req.on('close', async () => {
    if (!res.writableEnded) {
      isAborted = true
      if (userId) {
        await releaseUsage(userId, 'WORKOUT_GENERATOR')
        console.log(`[AI Controller] Client cancelled generateWorkout for user ${userId}; refunded WORKOUT_GENERATOR quota.`)
      }
    }
  })

  const workoutPlan = await generateAIWorkout({
    weight: user?.weight || 70,
    height: user?.height || 175,
    goal: user?.goal || 'FITNESS',
    gender: user?.gender || 'MALE',
    targetArea,
    activityLevel: activityLevel || user?.activityLevel || 'LIGHTLY_ACTIVE',
    personalRecords,
    workoutsCompletedThisWeek: weeklyWorkoutsCount,
    lastWorkoutTitle: lastWorkout?.title,
    lastWorkoutExercises: lastWorkout?.exercises?.map((e: any) => e.name) || [],
  })

  if (isAborted || res.writableEnded) {
    return
  }

  if (!workoutPlan || !workoutPlan.exercises || workoutPlan.exercises.length === 0) {
    if (userId) {
      await releaseUsage(userId, 'WORKOUT_GENERATOR')
    }
    return res.status(500).json({
      success: false,
      error: 'ROUTINE_GENERATION_FAILED',
      message: 'Failed to generate workout routine. Please try again.',
    })
  }

  // Persist routine generation record
  if (userId && workoutPlan) {
    try {
      await prisma.aiRoutineLog.create({
        data: {
          userId,
          targetArea: targetArea || 'Full Body',
          routineTitle: workoutPlan.title,
        },
      })
    } catch (logErr) {
      console.warn('[AI Controller] Could not log AI routine generation:', logErr)
    }
  }

  const usage = userId ? await getUsage(userId, 'WORKOUT_GENERATOR') : null

  res.json({ success: true, workoutPlan, usage })
})

export const suggestMeals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  const { goal, remainingCalories, remainingProtein, mealType } = req.body

  let isAborted = false
  req.on('close', async () => {
    if (!res.writableEnded) {
      isAborted = true
      if (userId) {
        await releaseUsage(userId, 'MEAL_SUGGESTION')
        console.log(`[AI Controller] Client cancelled suggestMeals for user ${userId}; refunded MEAL_SUGGESTION quota.`)
      }
    }
  })

  const suggestions = await generateAIMealSuggestions({
    goal: goal || 'FITNESS',
    remainingCalories: remainingCalories !== undefined && remainingCalories !== null ? Number(remainingCalories) : 2000,
    remainingProtein: remainingProtein !== undefined && remainingProtein !== null ? Number(remainingProtein) : 120,
    mealType: mealType || 'all',
  })

  if (isAborted || res.writableEnded) {
    return
  }

  if (!suggestions || suggestions.length === 0) {
    if (userId) {
      await releaseUsage(userId, 'MEAL_SUGGESTION')
    }
    return res.status(500).json({
      success: false,
      error: 'SUGGESTIONS_FAILED',
      message: 'Failed to generate meal suggestions. Please try again.',
    })
  }

  const usage = userId ? await getUsage(userId, 'MEAL_SUGGESTION') : null

  res.json({ success: true, suggestions, usage })
})

export const chatCoach = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  const { messages } = req.body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' })
  }

  let user = null
  let todayLog = null
  let todayWorkout = null
  let weeklyWorkoutsCount = 0
  let todayCheckIn = null
  let checkInCount = 0

  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, height: true, weight: true, age: true, goal: true, gender: true, activityLevel: true },
    })

    const todayStr = new Date().toISOString().split('T')[0]
    todayLog = await prisma.dailyFoodLog.findUnique({
      where: { userId_date: { userId, date: todayStr } },
      select: { totalCalories: true, totalProtein: true, totalCarbs: true, totalFat: true, waterMl: true },
    })

    todayWorkout = await prisma.workoutSession.findFirst({
      where: {
        userId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      select: { title: true, completed: true },
    })

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    weeklyWorkoutsCount = await prisma.workoutSession.count({
      where: {
        userId,
        completed: true,
        createdAt: { gte: sevenDaysAgo },
      },
    })

    todayCheckIn = await prisma.dailyCheckIn.findUnique({
      where: {
        userId_date: { userId, date: todayStr },
      },
      select: { moodLabel: true, notes: true, coachTip: true },
    })

    checkInCount = await prisma.dailyCheckIn.count({
      where: { userId },
    })
  }

  // Derive target calories and protein dynamically based on profile & sex
  const isFemale = user?.gender === 'FEMALE'
  const userWeight = user?.weight || 70
  const userHeight = user?.height || 175
  const userAge = user?.age || 25
  const bmrConstant = isFemale ? -161 : 5
  const bmr = 10 * userWeight + 6.25 * userHeight - 5 * userAge + bmrConstant
  const tdee = Math.round(bmr * 1.35)

  const minFloor = isFemale ? 1200 : 1400
  let targetCalories = user?.goal === 'MUSCLE_GAIN' ? tdee + 300 : Math.max(minFloor, tdee - 450)
  targetCalories = Math.max(minFloor, Math.min(4500, targetCalories))

  let targetProtein = Math.round(userWeight * (user?.goal === 'MUSCLE_GAIN' ? (isFemale ? 1.8 : 2.0) : (isFemale ? 1.6 : 1.8)))

  // Persist user's latest incoming message to cloud database
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  if (userId && lastUserMsg?.content) {
    try {
      await prisma.aiChatMessage.create({
        data: {
          userId,
          role: 'user',
          content: lastUserMsg.content,
        },
      })
    } catch (saveErr) {
      console.warn('[AI Controller] Could not persist user chat message:', saveErr)
    }
  }

  const chatContext = {
    firstName: user?.firstName || 'Friend',
    gender: user?.gender || 'MALE',
    weight: user?.weight,
    height: user?.height,
    age: user?.age,
    goal: user?.goal,
    activityLevel: user?.activityLevel || 'LIGHTLY_ACTIVE',
    caloriesLoggedToday: todayLog?.totalCalories,
    targetCalories,
    proteinLoggedToday: todayLog?.totalProtein,
    targetProtein,
    carbsLoggedToday: todayLog?.totalCarbs,
    fatLoggedToday: todayLog?.totalFat,
    waterMl: todayLog?.waterMl,
    workoutDoneToday: !!todayWorkout?.completed,
    todayWorkoutTitle: todayWorkout?.title,
    workoutsCompletedThisWeek: weeklyWorkoutsCount,
    todayCheckInMood: todayCheckIn?.moodLabel,
    todayCheckInNotes: todayCheckIn?.notes || undefined,
    checkInStreak: checkInCount,
  }

  let isAborted = false
  req.on('close', async () => {
    if (!res.writableEnded) {
      isAborted = true
      if (userId) {
        await releaseUsage(userId, 'COACH')
        console.log(`[AI Controller] Client cancelled chatCoach for user ${userId}; refunded COACH quota.`)
      }
    }
  })

  const isStreaming =
    req.query.stream === 'true' ||
    req.body.stream === true ||
    req.headers.accept?.includes('text/event-stream')

  if (isStreaming) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    if (typeof (res as any).flushHeaders === 'function') {
      ;(res as any).flushHeaders()
    }

    const responseText = await streamAICoach(messages as ChatMessage[], chatContext, (chunk) => {
      if (!isAborted && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
      }
    })

    if (isAborted || res.writableEnded) {
      return
    }

    if (userId && responseText) {
      try {
        await prisma.aiChatMessage.create({
          data: {
            userId,
            role: 'model',
            content: responseText,
          },
        })
      } catch (saveErr) {
        console.warn('[AI Controller] Could not persist AI coach message:', saveErr)
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, message: responseText })}\n\n`)
    return res.end()
  }

  const responseText = await chatWithAICoach(messages as ChatMessage[], chatContext)

  if (isAborted || res.writableEnded) {
    return
  }

  // Persist AI coach reply to cloud database
  if (userId && responseText) {
    try {
      await prisma.aiChatMessage.create({
        data: {
          userId,
          role: 'model',
          content: responseText,
        },
      })
    } catch (saveErr) {
      console.warn('[AI Controller] Could not persist AI coach message:', saveErr)
    }
  }

  const usage = userId ? await getUsage(userId, 'COACH') : null
  res.json({
    success: true,
    message: responseText,
    isPro: usage?.tier === 'PRO',
    remainingMessages: usage?.remaining,
    dailyLimit: usage?.limit,
    resetsAt: usage?.resetsAt,
  })
})


export const getChatHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const [messages, usage] = await Promise.all([
    prisma.aiChatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 60,
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    }),
    getUsage(userId, 'COACH'),
  ])

  res.json({
    success: true,
    messages,
    isPro: usage.tier === 'PRO',
    remainingMessages: usage.remaining,
    dailyLimit: usage.limit,
    resetsAt: usage.resetsAt,
  })
})

export const clearChatHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  await prisma.aiChatMessage.deleteMany({
    where: { userId },
  })

  res.json({ success: true, message: 'Chat history cleared successfully' })
})

export const autocompleteExercise = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name } = req.body
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Exercise name is required' })
  }

  const result = await autocompleteExerciseWithAI(name.trim())
  res.json({ success: true, data: result })
})


