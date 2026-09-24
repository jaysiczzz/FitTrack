import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { saveCheckInSchema } from '../schemas/checkin.schema'
import {
  getTodayCheckIn,
  saveCheckIn,
  getCheckInStreak,
  getCheckInHistory,
  deleteTodayCheckIn,
} from '../controllers/checkin.controller'

const router = Router()

// All check-in endpoints require authentication
router.use(authMiddleware)

router.get('/today', getTodayCheckIn)
router.post('/', validate(saveCheckInSchema), saveCheckIn)
router.get('/streak', getCheckInStreak)
router.get('/history', getCheckInHistory)
router.delete('/today', deleteTodayCheckIn)

export default router
