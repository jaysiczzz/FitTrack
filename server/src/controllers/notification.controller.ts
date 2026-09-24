import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { asyncHandler } from '../utils/asyncHandler.utils'

const DEFAULT_PREFERENCES = {
  mealReminders: true,
  breakfastTime: '08:30',
  lunchTime: '12:30',
  dinnerTime: '19:00',
  hydrationReminders: true,
  hydrationTime1: '11:00',
  hydrationTime2: '15:00',
  workoutReminders: true,
  workoutTime: '17:30',
  checkinReminders: true,
  checkinTime: '09:00',
  soundEnabled: true,
  vibrationEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
}

/**
 * GET /api/user/notifications
 * Retrieves user's notification preferences or initializes defaults
 */
export const getNotificationPreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  })

  if (!prefs) {
    prefs = await prisma.notificationPreference.create({
      data: {
        userId,
        ...DEFAULT_PREFERENCES,
      },
    })
  }

  res.json({
    success: true,
    settings: prefs,
  })
})

/**
 * PUT /api/user/notifications
 * Updates user's notification preferences
 */
export const updateNotificationPreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const updates = req.body

  const updated = await prisma.notificationPreference.upsert({
    where: { userId },
    update: updates,
    create: {
      userId,
      ...DEFAULT_PREFERENCES,
      ...updates,
    },
  })

  res.json({
    success: true,
    message: 'Notification settings updated successfully',
    settings: updated,
  })
})

/**
 * POST /api/user/notifications/reset
 * Resets user's notification preferences to recommended defaults
 */
export const resetNotificationPreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const reset = await prisma.notificationPreference.upsert({
    where: { userId },
    update: DEFAULT_PREFERENCES,
    create: {
      userId,
      ...DEFAULT_PREFERENCES,
    },
  })

  res.json({
    success: true,
    message: 'Notification settings reset to defaults',
    settings: reset,
  })
})
