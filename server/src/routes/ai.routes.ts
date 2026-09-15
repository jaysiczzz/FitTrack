import { Router } from 'express'
import { analyzeMeal, getInsights, generateWorkout, suggestMeals, chatCoach } from '../controllers/ai.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { aiLimiter } from '../middleware/rateLimit.middleware'

const router = Router()

// Enforce authentication then identity-aware per-user rate limiting on all AI endpoints
router.use(authMiddleware)
router.use(aiLimiter)

router.post('/analyze-meal', analyzeMeal)
router.get('/insights', getInsights)
router.post('/generate-workout', generateWorkout)
router.post('/suggest-meals', suggestMeals)
router.post('/chat', chatCoach)

export default router

