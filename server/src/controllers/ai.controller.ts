import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { asyncHandler } from '../utils/asyncHandler.utils'
import * as userModel from '../models/user.model'
import { analyzeMealWithAI, generateAIInsights, generateAIWorkout, generateAIMealSuggestions } from '../services/ai.service'

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

