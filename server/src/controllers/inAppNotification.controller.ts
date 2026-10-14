import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { emitToUser } from '../socket'

/**
 * Dispatches a native push notification to mobile devices via Expo Push Service
 */
async function sendExpoPush(token: string, title: string, body: string, data?: any) {
  try {
    if (!token || typeof token !== 'string') return
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        sound: 'default',
        priority: 'high',
        channelId: 'fittrack-reminders',
        data: data || {},
      }),
    })
  } catch (err) {
    console.warn('[InAppNotification] Push dispatch failed:', err)
  }
}

/**
 * Helper utility to create in-app notifications programmatically and dispatch mobile push alerts
 */
export async function createNotification(data: {
  userId: string
  title: string
  message: string
  type: 'STREAK' | 'WORKOUT' | 'NUTRITION' | 'SUPPORT' | 'AI' | 'SYSTEM' | 'ACHIEVEMENT'
  linkUrl?: string
}) {
  try {
    const created = await prisma.inAppNotification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        linkUrl: data.linkUrl,
      },
    })

    // Real-time live streaming to user's active devices
    emitToUser(data.userId, 'notification:new', {
      notification: created,
    })

    // If user has a registered mobile push token, notify device in background
    prisma.notificationPreference.findUnique({
      where: { userId: data.userId },
      select: { pushToken: true, soundEnabled: true },
    }).then((prefs) => {
      if (prefs?.pushToken) {
        sendExpoPush(prefs.pushToken, data.title, data.message, {
          linkUrl: data.linkUrl,
          type: data.type,
          notificationId: created.id,
        })
      }
    }).catch(() => {})

    return created
  } catch (err) {
    console.warn('[InAppNotification] Failed to create notification:', err)
    return null
  }
}

/**
 * GET /api/notifications
 * Pure read-only endpoint: Retrieve user's in-app notifications and unread count
 */
export const getInAppNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.inAppNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.inAppNotification.count({
      where: { userId, isRead: false },
    }),
  ])

  res.json({
    success: true,
    notifications,
    unreadCount,
  })
})

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
export const markNotificationAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

  if (!userId || !id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const notification = await prisma.inAppNotification.findFirst({
    where: { id, userId },
  })

  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' })
  }

  const updated = await prisma.inAppNotification.update({
    where: { id },
    data: { isRead: true },
  })

  const unreadCount = await prisma.inAppNotification.count({
    where: { userId, isRead: false },
  })

  emitToUser(userId, 'notification:updated', {
    id: updated.id,
    isRead: true,
    unreadCount,
  })

  res.json({
    success: true,
    notification: updated,
    unreadCount,
  })
})

/**
 * PATCH /api/notifications/read-all
 * Mark all user notifications as read
 */
export const markAllNotificationsAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  await prisma.inAppNotification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })

  emitToUser(userId, 'notification:read_all', {
    unreadCount: 0,
  })

  res.json({
    success: true,
    message: 'All notifications marked as read',
    unreadCount: 0,
  })
})

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
export const deleteInAppNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

  if (!userId || !id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  await prisma.inAppNotification.deleteMany({
    where: { id, userId },
  })

  const unreadCount = await prisma.inAppNotification.count({
    where: { userId, isRead: false },
  })

  emitToUser(userId, 'notification:deleted', {
    id,
    unreadCount,
  })

  res.json({
    success: true,
    message: 'Notification deleted',
    unreadCount,
  })
})

/**
 * DELETE /api/notifications/read
 * Clear all read notifications
 */
export const clearReadNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const result = await prisma.inAppNotification.deleteMany({
    where: { userId, isRead: true },
  })

  res.json({
    success: true,
    message: `Cleared ${result.count} read notifications`,
  })
})
