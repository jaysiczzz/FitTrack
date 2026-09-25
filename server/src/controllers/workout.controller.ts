import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import * as workoutModel from '../models/workout.model'
import { prisma } from '../config/db'
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
    userId: req.user?.id,
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

export const createCustomExerciseController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const {
    name,
    description,
    category,
    type,
    difficulty,
    primaryMuscle,
    muscleGroup,
    secondaryMuscles,
    bodyPart,
    equipment,
    equipmentAlternatives,
    startingPosition,
    instructions,
    formTips,
    commonMistakes,
    breathingTechnique,
    recommendedSets,
    recommendedReps,
    recommendedDuration,
    recommendedRest,
    recommendedTempo,
    defaultSets,
    imageUrl,
    thumbnailUrl,
    safetyInstructions,
    injuryPreventionTips,
    beginnerModification,
    advancedVariation,
    easierAlternative,
    harderAlternative,
    equipmentFreeAlternative,
    similarExercises,
    tags,
    difficultyPresets,
  } = req.body

  if (!name || !name.trim()) return res.status(400).json({ error: 'Exercise name is required' })

  const exercise = await workoutModel.createCustomExercise(userId, {
    name: name.trim(),
    description: description || undefined,
    category: category || 'Strength',
    type: type || 'Compound',
    difficulty: difficulty || 'Intermediate',
    primaryMuscle: primaryMuscle || 'Chest',
    muscleGroup: muscleGroup || primaryMuscle || 'Chest',
    secondaryMuscles: Array.isArray(secondaryMuscles) ? secondaryMuscles : undefined,
    bodyPart: bodyPart || 'Full Body',
    equipment: Array.isArray(equipment) ? equipment : undefined,
    equipmentAlternatives: Array.isArray(equipmentAlternatives) ? equipmentAlternatives : undefined,
    startingPosition: startingPosition || undefined,
    instructions: Array.isArray(instructions) ? instructions : (instructions ? [instructions] : []),
    formTips: Array.isArray(formTips) ? formTips : undefined,
    commonMistakes: Array.isArray(commonMistakes) ? commonMistakes : undefined,
    breathingTechnique: breathingTechnique || undefined,
    recommendedSets: recommendedSets ? Number(recommendedSets) : undefined,
    recommendedReps: recommendedReps ? Number(recommendedReps) : undefined,
    recommendedDuration: recommendedDuration ? Number(recommendedDuration) : undefined,
    recommendedRest: recommendedRest ? Number(recommendedRest) : undefined,
    recommendedTempo: recommendedTempo || undefined,
    defaultSets: defaultSets || [{ weight: 20, reps: 10 }, { weight: 20, reps: 10 }, { weight: 20, reps: 10 }],
    imageUrl: imageUrl || undefined,
    thumbnailUrl: thumbnailUrl || undefined,
    safetyInstructions: safetyInstructions || undefined,
    injuryPreventionTips: injuryPreventionTips || undefined,
    beginnerModification: beginnerModification || undefined,
    advancedVariation: advancedVariation || undefined,
    easierAlternative: easierAlternative || undefined,
    harderAlternative: harderAlternative || undefined,
    equipmentFreeAlternative: equipmentFreeAlternative || undefined,
    similarExercises: Array.isArray(similarExercises) ? similarExercises : undefined,
    tags: Array.isArray(tags) ? tags : undefined,
    difficultyPresets: difficultyPresets || undefined,
  })

  res.status(201).json({ success: true, exercise })
})

export const deleteCustomExerciseController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  if (!id) return res.status(400).json({ error: 'Exercise ID is required' })

  const deleted = await workoutModel.deleteCustomExercise(id, userId)
  if (!deleted) {
    return res.status(404).json({ error: 'Custom exercise not found or unauthorized' })
  }

  res.json({ success: true, message: 'Custom exercise removed' })
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

  const updatedSession = await workoutModel.getTodayActiveSession(userId)
  const enrichedExercise = updatedSession.exercises.find((e: any) => e.id === exercise.id) || exercise

  res.json({ exercise: enrichedExercise })
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

export const deleteSessionController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId
  if (!sessionId) return res.status(400).json({ error: 'Session ID is required' })

  await workoutModel.deleteWorkoutSession(sessionId, userId)
  res.json({ success: true })
})

/**
 * GET /api/workouts/plan
 * Fetches user's daily, weekly, and monthly workout plan.
 */
export const getWorkoutPlanController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const plan = await prisma.workoutPlan.findUnique({
    where: { userId },
  })

  res.json({
    success: true,
    plan: plan || null,
  })
})

/**
 * PUT /api/workouts/plan
 * Updates/syncs the user's weekly split, templates, monthly schedule, and mesocycle.
 */
export const updateWorkoutPlanController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const {
    weeklySplit,
    routineTemplates,
    monthlySchedule,
    monthlyTargetDays,
    currentMesocycleWeek,
  } = req.body

  const plan = await prisma.workoutPlan.upsert({
    where: { userId },
    create: {
      userId,
      weeklySplit: weeklySplit || {},
      routineTemplates: routineTemplates || [],
      monthlySchedule: monthlySchedule || {},
      monthlyTargetDays: Number(monthlyTargetDays) || 20,
      currentMesocycleWeek: Number(currentMesocycleWeek) || 1,
    },
    update: {
      weeklySplit: weeklySplit !== undefined ? weeklySplit : undefined,
      routineTemplates: routineTemplates !== undefined ? routineTemplates : undefined,
      monthlySchedule: monthlySchedule !== undefined ? monthlySchedule : undefined,
      monthlyTargetDays: monthlyTargetDays !== undefined ? Number(monthlyTargetDays) : undefined,
      currentMesocycleWeek: currentMesocycleWeek !== undefined ? Number(currentMesocycleWeek) : undefined,
    },
  })

  res.json({
    success: true,
    plan,
    message: 'Workout plan synchronized successfully',
  })
})

/**
 * POST /api/workouts/plan/schedule-date
 * Schedules or modifies a specific date's routine or rest day in the monthly calendar.
 */
export const scheduleMonthlyRoutineController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { dateKey, routineId, isRestDay, customNotes } = req.body
  if (!dateKey) return res.status(400).json({ error: 'dateKey is required (YYYY-MM-DD)' })

  const existing = await prisma.workoutPlan.findUnique({
    where: { userId },
  })

  const currentSchedule: Record<string, any> = (existing?.monthlySchedule as Record<string, any>) || {}
  currentSchedule[dateKey] = {
    routineId: routineId || null,
    isRestDay: Boolean(isRestDay),
    customNotes: customNotes || null,
    updatedAt: new Date().toISOString(),
  }

  const plan = await prisma.workoutPlan.upsert({
    where: { userId },
    create: {
      userId,
      weeklySplit: {},
      routineTemplates: [],
      monthlySchedule: currentSchedule,
    },
    update: {
      monthlySchedule: currentSchedule,
    },
  })

  res.json({
    success: true,
    dateKey,
    scheduled: currentSchedule[dateKey],
    plan,
  })
})

