import { Router } from 'express'
import {
  getLibrary,
  getTodaySession,
  addExerciseToToday,
  toggleSet,
  deleteExercise,
  completeSession,
  getHistory,
} from '../controllers/workout.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.get('/library', authMiddleware, getLibrary)
router.get('/today', authMiddleware, getTodaySession)
router.post('/today/add-exercise', authMiddleware, addExerciseToToday)
router.patch('/sets/:setId/toggle', authMiddleware, toggleSet)
router.delete('/exercises/:exerciseId', authMiddleware, deleteExercise)
router.post('/today/complete', authMiddleware, completeSession)
router.get('/history', authMiddleware, getHistory)

export default router
