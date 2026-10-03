import { Router, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { supportFeedbackSchema } from '../schemas/support.schema'
import { prisma } from '../config/db'
import { createTicket } from '../services/ticket.service'

const router = Router()

/**
 * Submit user feedback, bug report, or support request.
 * Can be called with or without authentication.
 */
router.post(
  '/feedback',
  optionalAuthMiddleware,
  validate(supportFeedbackSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { category, subject, message, email } = req.body
    const userId = req.user?.id

    // Optional user email resolution if logged in
    let contactEmail = email
    let userName: string | undefined = undefined
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true },
      })
      if (user) {
        if (!contactEmail) contactEmail = user.email
        userName = `${user.firstName} ${user.lastName}`.trim()
      }
    }

    const savedTicket = await createTicket({
      userId,
      userEmail: contactEmail || 'guest@fittrack.app',
      userName,
      category,
      subject,
      message,
    })

    const maskedEmail = contactEmail ? contactEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'N/A'
    console.log(
      `[Support Feedback Logged: ${savedTicket.id}] Category: ${category}, Subject: ${subject}, User: ${userId || 'Guest'} (${maskedEmail})`
    )

    res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been received and our team will review it.',
      ticketId: savedTicket.id,
      ticket: savedTicket,
    })
  })
)

export default router

