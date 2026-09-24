import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { updateNotificationSettingsSchema } from '../schemas/notification.schema'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  resetNotificationPreferences,
} from '../controllers/notification.controller'

const router = Router()

router.use(authMiddleware)

router.get('/', getNotificationPreferences)
router.put('/', validate(updateNotificationSettingsSchema), updateNotificationPreferences)
router.post('/reset', resetNotificationPreferences)

export default router
