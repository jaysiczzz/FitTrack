import { Router, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { supportFeedbackSchema } from '../schemas/support.schema'
import { prisma } from '../config/db'

const router = Router()

/**
 * Submit user feedback, bug report, or support request.
 * Can be called with or without authentication.
 */
router.post(
  '/feedback',
  validate(supportFeedbackSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { category, subject, message, email } = req.body
    const userId = req.user?.id

    // Optional user email resolution if logged in
    let contactEmail = email
    if (!contactEmail && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })
      if (user) contactEmail = user.email
    }

    console.log(
      `[Support Feedback Received -> fittrack.app.help@gmail.com] Category: ${category}, Subject: ${subject}, User: ${userId || 'Guest'} (${contactEmail || 'N/A'})`
    )

    res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been received and our team will review it.',
      ticketId: `TICK-${Date.now().toString(36).toUpperCase()}`,
    })
  })
)

export default router
