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

  res.json({ success: true, data: analysis })
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

  const { targetArea } = req.body

  const workoutPlan = await generateAIWorkout({
    weight: user?.weight || 70,
    height: user?.height || 175,
    goal: user?.goal || 'FITNESS',
    targetArea,
  })

  res.json({ success: true, workoutPlan })
})

export const suggestMeals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { goal, remainingCalories, remainingProtein } = req.body

  const suggestions = await generateAIMealSuggestions({
    goal: goal || 'FITNESS',
    remainingCalories: Number(remainingCalories) || 2000,
    remainingProtein: Number(remainingProtein) || 120,
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

  const responseText = await chatWithAICoach(messages as ChatMessage[], {
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
  })

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

  res.json({ success: true, message: responseText })
})

export const getChatHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const messages = await prisma.aiChatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: 60,
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  })

  res.json({ success: true, messages })
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


