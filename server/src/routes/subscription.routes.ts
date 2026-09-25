import { Router } from 'express'
import {
  getSubscriptionPlans,
  getCurrentSubscription,
  createCheckoutSession,
  confirmSubscription,
  cancelSubscription,
  reactivateSubscription,
} from '../controllers/subscription.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  createCheckoutSessionSchema,
  confirmSubscriptionSchema,
} from '../schemas/subscription.schema'

const router = Router()

// Public plans definition (can be viewed before or after logging in)
router.get('/plans', getSubscriptionPlans)

// Authenticated user subscription operations
router.use(authMiddleware)
router.get('/me', getCurrentSubscription)
router.post('/checkout', validate(createCheckoutSessionSchema), createCheckoutSession)
router.post('/confirm', validate(confirmSubscriptionSchema), confirmSubscription)
router.post('/cancel', cancelSubscription)
router.post('/reactivate', reactivateSubscription)

export default router
