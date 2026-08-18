import { Router } from 'express'
import { analyzeMeal, getInsights, generateWorkout } from '../controllers/ai.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.post('/analyze-meal', authMiddleware, analyzeMeal)
router.get('/insights', authMiddleware, getInsights)
router.post('/generate-workout', authMiddleware, generateWorkout)

export default router
