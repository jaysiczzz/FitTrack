import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import * as workoutModel from '../models/workout.model'
import { asyncHandler } from '../utils/asyncHandler.utils'

export const getLibrary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const exercises = await workoutModel.getAllExercises()
  res.json({ exercises })
})

export const getTodaySession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const session = await workoutModel.getTodayActiveSession(userId)
  res.json({ session })
})

export const addExerciseToToday = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { exerciseId, name, category, type, defaultSets } = req.body
  if (!name) return res.status(400).json({ error: 'Exercise name is required' })

  const session = await workoutModel.getTodayActiveSession(userId)
  const exercise = await workoutModel.addExerciseToActiveSession(session.id, {
    exerciseId,
    name,
    category,
    type,
    defaultSets,
  })

  res.json({ exercise })
})

export const toggleSet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const setId = Array.isArray(req.params.setId) ? req.params.setId[0] : req.params.setId
  const { done } = req.body

  if (!setId) return res.status(400).json({ error: 'Set ID is required' })

  const updatedSet = await workoutModel.toggleExerciseSet(setId, done)
  if (!updatedSet) return res.status(404).json({ error: 'Set not found' })

  res.json({ set: updatedSet })
})

export const deleteExercise = asyncHandler(async (req: AuthRequest, res: Response) => {
  const exerciseId = Array.isArray(req.params.exerciseId) ? req.params.exerciseId[0] : req.params.exerciseId
  if (!exerciseId) return res.status(400).json({ error: 'Exercise ID is required' })

  await workoutModel.removeWorkoutExercise(exerciseId)
  res.json({ success: true })
})

export const completeSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const session = await workoutModel.getTodayActiveSession(userId)
  const completedSession = await workoutModel.finishWorkoutSession(session.id)

  res.json({ session: completedSession })
})

export const getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const sessions = await workoutModel.getCompletedSessions(userId)
  res.json({ sessions })
})
