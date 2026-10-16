import { Router } from 'express'
import {
  analyzeMeal,
  getInsights,
  generateWorkout,
  suggestMeals,
  chatCoach,
  getChatHistory,
  clearChatHistory,
  autocompleteExercise,
} from '../controllers/ai.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { aiLimiter } from '../middleware/rateLimit.middleware'
import { featureLimitMiddleware } from '../middleware/featureLimit.middleware'

const router = Router()

// Enforce authentication then identity-aware per-user rate limiting on all AI endpoints
router.use(authMiddleware)
router.use(aiLimiter)

router.post('/analyze-meal', featureLimitMiddleware('FOOD_SCAN'), analyzeMeal)
router.get('/insights', getInsights)
router.post('/insights', getInsights)
router.post('/generate-workout', featureLimitMiddleware('WORKOUT_GENERATOR'), generateWorkout)
router.post('/suggest-meals', featureLimitMiddleware('MEAL_SUGGESTION'), suggestMeals)
router.post('/chat', featureLimitMiddleware('COACH'), chatCoach)
router.get('/chat/history', getChatHistory)
router.delete('/chat/history', clearChatHistory)
router.post('/autocomplete-exercise', autocompleteExercise)

export default router

