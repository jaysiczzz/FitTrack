import { Router } from 'express'
import {
  getAdminRevenueOverview,
  processAdminPayout,
  adminOverrideUserSubscription,
} from '../controllers/adminRevenue.controller'
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  adminPayoutSchema,
  adminOverrideSchema,
} from '../schemas/subscription.schema'

const router = Router()

// Strict Admin Only Access Guards
router.use(authMiddleware)
router.use(adminMiddleware)

router.get('/overview', getAdminRevenueOverview)
router.post('/payout', validate(adminPayoutSchema), processAdminPayout)
router.put('/override-subscription', validate(adminOverrideSchema), adminOverrideUserSubscription)

export default router
