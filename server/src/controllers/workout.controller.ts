import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import * as workoutModel from '../models/workout.model'
import { asyncHandler } from '../utils/asyncHandler.utils'

export const getLibrary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, muscleGroup, category, difficulty, equipment, type, bodyPart } = req.query

  const exercises = await workoutModel.getAllExercises({
    search: search ? String(search) : undefined,
    muscleGroup: muscleGroup ? String(muscleGroup) : undefined,
    category: category ? String(category) : undefined,
    difficulty: difficulty ? String(difficulty) : undefined,
    equipment: equipment ? String(equipment) : undefined,
    type: type ? String(type) : undefined,
    bodyPart: bodyPart ? String(bodyPart) : undefined,
  })

  res.json({ exercises })
})

export const getExerciseByIdController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  if (!id) return res.status(400).json({ error: 'Exercise ID is required' })

  const exercise = await workoutModel.getExerciseById(id)
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' })

  res.json({ exercise })
})

export const createExerciseController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, category, type, difficulty, primaryMuscle, instructions } = req.body

  if (!name || !name.trim()) return res.status(400).json({ error: 'Exercise Name is required' })
  if (!category) return res.status(400).json({ error: 'Category is required' })
  if (!type) return res.status(400).json({ error: 'Exercise Type is required' })
  if (!difficulty) return res.status(400).json({ error: 'Difficulty is required' })
  if (!primaryMuscle) return res.status(400).json({ error: 'Primary Muscle Group is required' })
  if (!instructions || (Array.isArray(instructions) && instructions.length === 0)) {
    return res.status(400).json({ error: 'At least one instruction step is required' })
  }

  const exercise = await workoutModel.createExerciseInLibrary(req.body)
  res.status(201).json({ success: true, exercise })
})

export const updateExerciseController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  if (!id) return res.status(400).json({ error: 'Exercise ID is required' })

  const exercise = await workoutModel.updateExerciseInLibrary(id, req.body)
  res.json({ success: true, exercise })
})

export const deleteExerciseFromLibraryController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  if (!id) return res.status(400).json({ error: 'Exercise ID is required' })

  await workoutModel.deleteExerciseFromLibrary(id)
  res.json({ success: true })
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

export const getPersonalRecordsController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const personalRecords = await workoutModel.getPersonalRecords(userId)
  res.json({ personalRecords })
})

export const updateSetController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const setId = Array.isArray(req.params.setId) ? req.params.setId[0] : req.params.setId
  if (!setId) return res.status(400).json({ error: 'Set ID is required' })

  const { weight, reps, done } = req.body
  const updatedSet = await workoutModel.updateExerciseSetValues(setId, {
    weight: weight !== undefined ? Number(weight) : undefined,
    reps: reps !== undefined ? Number(reps) : undefined,
    done: done !== undefined ? Boolean(done) : undefined,
  })

  res.json({ set: updatedSet })
})

export const addSetController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const exerciseId = Array.isArray(req.params.exerciseId) ? req.params.exerciseId[0] : req.params.exerciseId
  if (!exerciseId) return res.status(400).json({ error: 'Exercise ID is required' })

  const { weight, reps, bodyweight } = req.body
  const newSet = await workoutModel.addSetToWorkoutExercise(exerciseId, {
    weight: weight !== undefined ? Number(weight) : undefined,
    reps: reps !== undefined ? Number(reps) : undefined,
    bodyweight: bodyweight !== undefined ? Boolean(bodyweight) : undefined,
  })

  res.status(201).json({ set: newSet })
})

export const deleteSetController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const setId = Array.isArray(req.params.setId) ? req.params.setId[0] : req.params.setId
  if (!setId) return res.status(400).json({ error: 'Set ID is required' })

  await workoutModel.deleteExerciseSet(setId)
  res.json({ success: true })
})
