import { Router } from 'express'
import {
  getUserWallet,
  initiateDeposit,
  confirmDeposit,
  paySubscriptionWithWallet,
} from '../controllers/wallet.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  depositWalletSchema,
  walletPaySchema,
} from '../schemas/subscription.schema'

const router = Router()

router.use(authMiddleware)

router.get('/me', getUserWallet)
router.post('/deposit/initiate', validate(depositWalletSchema), initiateDeposit)
router.post('/deposit/confirm', confirmDeposit)
router.post('/pay-subscription', validate(walletPaySchema), paySubscriptionWithWallet)

export default router
