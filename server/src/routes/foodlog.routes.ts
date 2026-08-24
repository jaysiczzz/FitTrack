import { Router } from 'express'
import {
  saveDayLogController,
  getHistoryController,
  getDayLogController,
  deleteDayLogController,
} from '../controllers/foodlog.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// All food log routes require user authentication
router.post('/save-day', authMiddleware, saveDayLogController)
router.get('/history', authMiddleware, getHistoryController)
router.get('/:date', authMiddleware, getDayLogController)
router.delete('/:date', authMiddleware, deleteDayLogController)

export default router
