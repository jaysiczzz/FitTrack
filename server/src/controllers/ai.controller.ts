import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { asyncHandler } from '../utils/asyncHandler.utils'
import * as userModel from '../models/user.model'
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


export const analyzeMeal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { description, imageBase64, mimeType } = req.body

  if (!description && !imageBase64) {
    return res.status(400).json({ error: 'Please provide a text description or an image of the meal.' })
  }

  const analysis = await analyzeMealWithAI({
    description,
    imageBase64,
    mimeType: mimeType || 'image/jpeg',
  })

  if (analysis.isFood === false) {
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

  res.json({ success: true, isFood: true, data: analysis })
})

export const getInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  let user = null

  if (userId) {
    user = await userModel.findById(userId)
  }

  const userProfile = {
    firstName: user?.firstName || 'User',
    weight: user?.weight || 70,
    height: user?.height || 175,
    age: user?.age || 25,
    goal: user?.goal || 'FITNESS',
  }

  const insights = await generateAIInsights(userProfile)

  res.json({ success: true, insights })
})

export const generateWorkout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  let user = null

  if (userId) {
    user = await userModel.findById(userId)
  }

  // Tier check & routine generation quota
  let isPro = false
  if (userId) {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: { tier: true, status: true },
    })
    isPro = !!(sub && sub.tier !== 'FREE' && sub.status === 'ACTIVE')
  }

  const FREE_MONTHLY_ROUTINE_LIMIT = 5
  const PRO_MONTHLY_ROUTINE_LIMIT = 30

  if (userId) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyGeneratedCount = await prisma.aiRoutineLog.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    })

    if (!isPro) {
      if (monthlyGeneratedCount >= FREE_MONTHLY_ROUTINE_LIMIT) {
        return res.status(429).json({
          success: false,
          error: 'MONTHLY_ROUTINE_LIMIT_REACHED',
          message: 'You have reached your limit of 5 free AI-generated workout routines this month. Upgrade to FitTrack Pro for 30 routines per month.',
          isPro: false,
          monthlyLimit: FREE_MONTHLY_ROUTINE_LIMIT,
          remaining: 0,
        })
      }
    } else {
      if (monthlyGeneratedCount >= PRO_MONTHLY_ROUTINE_LIMIT) {
        return res.status(429).json({
          success: false,
          error: 'PRO_MONTHLY_ROUTINE_LIMIT_REACHED',
          message: 'You have reached your monthly Pro limit of 30 AI-generated workout routines. Your quota will reset on the 1st of next month.',
          isPro: true,
          monthlyLimit: PRO_MONTHLY_ROUTINE_LIMIT,
          remaining: 0,
        })
      }
    }
  }

  const { targetArea } = req.body

  const workoutPlan = await generateAIWorkout({
    weight: user?.weight || 70,
    height: user?.height || 175,
    goal: user?.goal || 'FITNESS',
    targetArea,
  })

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

  res.json({ success: true, workoutPlan })
})

export const suggestMeals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { goal, remainingCalories, remainingProtein, mealType } = req.body

  const suggestions = await generateAIMealSuggestions({
    goal: goal || 'FITNESS',
    remainingCalories: remainingCalories !== undefined && remainingCalories !== null ? Number(remainingCalories) : 2000,
    remainingProtein: remainingProtein !== undefined && remainingProtein !== null ? Number(remainingProtein) : 120,
    mealType: mealType || 'all',
  })

  res.json({ success: true, suggestions })
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
      select: { firstName: true, height: true, weight: true, age: true, goal: true },
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

  // Derive target calories and protein based on profile
  const userWeight = user?.weight || 70
  let targetCalories = 2100
  let targetProtein = 140
  if (user?.goal === 'WEIGHT_LOSS') {
    targetCalories = Math.max(1500, Math.round(userWeight * 26))
    targetProtein = Math.round(userWeight * 1.8)
  } else if (user?.goal === 'MUSCLE_GAIN') {
    targetCalories = Math.max(2200, Math.round(userWeight * 33))
    targetProtein = Math.round(userWeight * 2.0)
  }

  // Tier check & daily quota enforcement
  let isPro = false
  if (userId) {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: { tier: true, status: true },
    })
    isPro = !!(sub && sub.tier !== 'FREE' && sub.status === 'ACTIVE')
  }

  const FREE_DAILY_CHAT_LIMIT = 15
  const PRO_DAILY_CHAT_LIMIT = 100 // Fair Use Policy ceiling to prevent token exhaustion & bot abuse
  let todayUserMessagesCount = 0

  if (userId) {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    todayUserMessagesCount = await prisma.aiChatMessage.count({
      where: {
        userId,
        role: 'user',
        createdAt: { gte: startOfDay },
      },
    })

    if (!isPro && todayUserMessagesCount >= FREE_DAILY_CHAT_LIMIT) {
      return res.status(429).json({
        success: false,
        error: 'DAILY_AI_LIMIT_REACHED',
        message: 'You have reached your daily limit of 15 free AI Coach messages. Upgrade to FitTrack Pro for unlimited 24/7 coaching.',
        isPro: false,
        dailyLimit: FREE_DAILY_CHAT_LIMIT,
        remaining: 0,
      })
    }

    if (isPro && todayUserMessagesCount >= PRO_DAILY_CHAT_LIMIT) {
      return res.status(429).json({
        success: false,
        error: 'PRO_FAIR_USE_LIMIT_REACHED',
        message: 'You have reached the daily Fair Use limit of 100 AI Coach messages. Your quota will refresh at midnight.',
        isPro: true,
        dailyLimit: PRO_DAILY_CHAT_LIMIT,
        remaining: 0,
      })
    }
  }

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
    weight: user?.weight,
    height: user?.height,
    age: user?.age,
    goal: user?.goal,
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
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
    })

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

  const remaining = isPro ? null : Math.max(0, FREE_DAILY_CHAT_LIMIT - todayUserMessagesCount - 1)
  res.json({
    success: true,
    message: responseText,
    isPro,
    remainingMessages: remaining,
    dailyLimit: FREE_DAILY_CHAT_LIMIT,
  })
})


export const getChatHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const [messages, sub] = await Promise.all([
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
    prisma.subscription.findUnique({
      where: { userId },
      select: { tier: true, status: true },
    }),
  ])

  const isPro = !!(sub && sub.tier !== 'FREE' && sub.status === 'ACTIVE')
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const todayUserMsgs = await prisma.aiChatMessage.count({
    where: {
      userId,
      role: 'user',
      createdAt: { gte: startOfDay },
    },
  })
  const FREE_DAILY_CHAT_LIMIT = 15
  const PRO_DAILY_CHAT_LIMIT = 100
  const remaining = isPro
    ? Math.max(0, PRO_DAILY_CHAT_LIMIT - todayUserMsgs)
    : Math.max(0, FREE_DAILY_CHAT_LIMIT - todayUserMsgs)

  res.json({
    success: true,
    messages,
    isPro,
    remainingMessages: remaining,
    dailyLimit: isPro ? PRO_DAILY_CHAT_LIMIT : FREE_DAILY_CHAT_LIMIT,
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


