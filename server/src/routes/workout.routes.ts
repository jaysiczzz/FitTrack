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
} from '../controllers/workout.controller'
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware'

const router = Router()

// System-Managed Exercise Library Read Routes (All Authenticated Users)
router.get('/library', authMiddleware, getLibrary)
router.get('/library/:id', authMiddleware, getExerciseByIdController)

// System-Managed Exercise Library Administration Write Routes (ADMIN ONLY)
router.post('/library', authMiddleware, adminMiddleware, createExerciseController)
router.put('/library/:id', authMiddleware, adminMiddleware, updateExerciseController)
router.patch('/library/:id', authMiddleware, adminMiddleware, updateExerciseController)
router.delete('/library/:id', authMiddleware, adminMiddleware, deleteExerciseFromLibraryController)

// User Workout Management Routes (User-Managed Personal Data)
router.get('/today', authMiddleware, getTodaySession)
router.post('/today/add-exercise', authMiddleware, addExerciseToToday)
router.patch('/sets/:setId/toggle', authMiddleware, toggleSet)
router.patch('/sets/:setId', authMiddleware, updateSetController)
router.post('/exercises/:exerciseId/sets', authMiddleware, addSetController)
router.delete('/sets/:setId', authMiddleware, deleteSetController)
router.delete('/exercises/:exerciseId', authMiddleware, deleteExercise)
router.post('/today/complete', authMiddleware, completeSession)
router.get('/history', authMiddleware, getHistory)
router.get('/personal-records', authMiddleware, getPersonalRecordsController)

export default router
