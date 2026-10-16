import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import {
  getInAppNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteInAppNotification,
  clearReadNotifications,
} from '../controllers/inAppNotification.controller'

const router = Router()

// All notification inbox routes require authentication
router.use(authMiddleware)

router.get('/', getInAppNotifications)
router.patch('/read-all', markAllNotificationsAsRead)
router.patch('/:id/read', markNotificationAsRead)
router.delete('/read', clearReadNotifications)
router.delete('/:id', deleteInAppNotification)

export default router
