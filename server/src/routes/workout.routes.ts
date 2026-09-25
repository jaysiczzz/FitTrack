import { Router } from 'express'
import {
  getLibrary,
  getExerciseByIdController,
  createExerciseController,
  updateExerciseController,
  deleteExerciseFromLibraryController,
  getTodaySession,
  addExerciseToToday,
  toggleSet,
  deleteExercise,
  completeSession,
  getHistory,
  getPersonalRecordsController,
  updateSetController,
  addSetController,
  deleteSetController,
  createCustomExerciseController,
  deleteCustomExerciseController,
  deleteSessionController,
  getWorkoutPlanController,
  updateWorkoutPlanController,
  scheduleMonthlyRoutineController,
} from '../controllers/workout.controller'
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware'
import { validateSetOwnership, validateWorkoutExerciseOwnership } from '../middleware/ownership.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  updateSetSchema,
  addSetSchema,
  toggleSetSchema,
  addExerciseToTodaySchema,
  createCustomExerciseSchema,
} from '../schemas/workout.schema'

const router = Router()

// All workout routes require authentication
router.use(authMiddleware)

// BOLA Prevention: Parameter ownership guards (executed after authMiddleware has populated req.user)
router.param('setId', validateSetOwnership)
router.param('exerciseId', validateWorkoutExerciseOwnership)

// Custom User-Created Exercises
router.post('/custom', validate(createCustomExerciseSchema), createCustomExerciseController)
router.delete('/custom/:id', deleteCustomExerciseController)

// System-Managed Exercise Library Read Routes (All Authenticated Users)
router.get('/library', getLibrary)
router.get('/library/:id', getExerciseByIdController)

// System-Managed Exercise Library Administration Write Routes (ADMIN ONLY)
router.post('/library', adminMiddleware, createExerciseController)
router.put('/library/:id', adminMiddleware, updateExerciseController)
router.patch('/library/:id', adminMiddleware, updateExerciseController)
router.delete('/library/:id', adminMiddleware, deleteExerciseFromLibraryController)

// User Workout Management Routes (User-Managed Personal Data)
router.get('/today', getTodaySession)
router.post('/today/add-exercise', validate(addExerciseToTodaySchema), addExerciseToToday)
router.patch('/sets/:setId/toggle', validate(toggleSetSchema), toggleSet)
router.patch('/sets/:setId', validate(updateSetSchema), updateSetController)
router.post('/exercises/:exerciseId/sets', validate(addSetSchema), addSetController)
router.delete('/sets/:setId', deleteSetController)
router.delete('/exercises/:exerciseId', deleteExercise)
router.post('/today/complete', completeSession)
router.get('/history', getHistory)
router.get('/personal-records', getPersonalRecordsController)
router.delete('/sessions/:sessionId', deleteSessionController)

// Workout Planner (Daily, Weekly, Monthly) Routes
router.get('/plan', getWorkoutPlanController)
router.put('/plan', updateWorkoutPlanController)
router.post('/plan/schedule-date', scheduleMonthlyRoutineController)

export default router

