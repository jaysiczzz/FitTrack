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
  }

  const responseText = await chatWithAICoach(messages as ChatMessage[], {
    firstName: user?.firstName || 'Friend',
    weight: user?.weight,
    height: user?.height,
    age: user?.age,
    goal: user?.goal,
    caloriesLoggedToday: todayLog?.totalCalories,
    waterMl: todayLog?.waterMl,
    workoutDoneToday: !!todayWorkout?.completed,
  })

  res.json({ success: true, message: responseText })
})

