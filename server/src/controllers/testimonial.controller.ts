import { Response } from 'express'

import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { Goal } from '@prisma/client'
import { capitalizeWords } from '../utils/formatters.utils'
import { createNotification } from './inAppNotification.controller'
import { emitToCommunity, emitToAdmin } from '../socket'

/**
 * GET /api/testimonials
 * Public endpoint to fetch testimonials with optional goal and sorting filters.
 */
export const getTestimonials = asyncHandler(async (req: AuthRequest, res: Response) => {

  const { goal, limit, sortBy } = req.query
  const userId = req.user?.id

  const whereClause: any = {
    isFeatured: true,
    status: 'APPROVED',
  }

  if (goal && (goal === 'MUSCLE_GAIN' || goal === 'WEIGHT_LOSS')) {
    whereClause.goal = goal as Goal
  }

  const take = limit ? Math.min(Math.max(Number(limit) || 20, 1), 50) : 30

  let orderBy: any[]
  if (sortBy === 'helpful') {
    orderBy = [{ helpfulCount: 'desc' }, { createdAt: 'desc' }]
  } else if (sortBy === 'highest_rated') {
    orderBy = [{ rating: 'desc' }, { helpfulCount: 'desc' }]
  } else if (sortBy === 'recent') {
    orderBy = [{ createdAt: 'desc' }]
  } else {
    // Featured default
    orderBy = [{ helpfulCount: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }]
  }

  const [testimonials, allRatings, userVotes] = await Promise.all([
    prisma.testimonial.findMany({
      where: whereClause,
      orderBy,
      take,
      select: {
        id: true,
        userId: true,
        authorName: true,
        avatarUrl: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        rating: true,
        content: true,
        highlightBadge: true,
        goal: true,
        helpfulCount: true,
        weightChangeKg: true,
        durationWeeks: true,
        verifiedAthlete: true,
        beforeImageUrl: true,
        afterImageUrl: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.testimonial.aggregate({
      where: whereClause,
      _avg: { rating: true },
      _count: { id: true },
    }),
    userId
      ? prisma.testimonialVote.findMany({
          where: { userId },
          select: { testimonialId: true },
        })
      : Promise.resolve([]),
  ])

  const votedSet = new Set(userVotes.map((v) => v.testimonialId))
  const mappedTestimonials = testimonials.map((t) => {
    let resolvedAuthorName = t.authorName
    let resolvedAvatarUrl = t.avatarUrl

    if (t.user) {
      const first = capitalizeWords(t.user.firstName) || 'Athlete'
      const last = capitalizeWords(t.user.lastName)
      const lastInitial = last ? ` ${last.charAt(0).toUpperCase()}.` : ''
      resolvedAuthorName = `${first}${lastInitial}`
      resolvedAvatarUrl = t.user.avatarUrl ?? null
    } else {
      resolvedAuthorName = capitalizeWords(t.authorName)
    }

    return {
      id: t.id,
      userId: t.userId,
      authorName: resolvedAuthorName,
      avatarUrl: resolvedAvatarUrl,
      rating: t.rating,
      content: t.content,
      highlightBadge: t.highlightBadge,
      goal: t.goal,
      helpfulCount: t.helpfulCount,
      weightChangeKg: t.weightChangeKg,
      durationWeeks: t.durationWeeks,
      verifiedAthlete: t.verifiedAthlete,
      beforeImageUrl: t.beforeImageUrl,
      afterImageUrl: t.afterImageUrl,
      status: t.status,
      createdAt: t.createdAt,
      hasVoted: votedSet.has(t.id),
    }
  })

  const averageRating = allRatings._avg.rating
    ? Number(allRatings._avg.rating.toFixed(1))
    : 5.0
  const totalCount = allRatings._count.id || 0

  res.json({
    success: true,
    averageRating,
    totalCount,
    testimonials: mappedTestimonials,
  })
})

/**
 * GET /api/testimonials/my
 * Returns the authenticated user's current testimonial if already submitted.
 */
export const getMyTestimonial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const [testimonials, user] = await Promise.all([
    prisma.testimonial.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, avatarUrl: true },
    }),
  ])

  const mapped = testimonials.map((t) => {
    let resolvedAuthorName = t.authorName
    let resolvedAvatarUrl = t.avatarUrl
    if (user) {
      const first = capitalizeWords(user.firstName) || 'Athlete'
      const last = capitalizeWords(user.lastName)
      const lastInitial = last ? ` ${last.charAt(0).toUpperCase()}.` : ''
      resolvedAuthorName = `${first}${lastInitial}`
      resolvedAvatarUrl = user.avatarUrl ?? null
    } else {
      resolvedAuthorName = capitalizeWords(t.authorName)
    }
    return {
      ...t,
      authorName: resolvedAuthorName,
      avatarUrl: resolvedAvatarUrl,
    }
  })

  res.json({
    success: true,
    testimonial: mapped[0] || null,
    testimonials: mapped,
  })
})

/**
 * POST /api/testimonials
 * Create or update an authenticated user's testimonial.
 * Supports multiple testimonials across milestones.
 */
export const submitTestimonial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, goal: true, avatarUrl: true, role: true },
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const {
    id,
    rating,
    content,
    highlightBadge,
    goal,
    weightChangeKg,
    durationWeeks,
    beforeImageUrl,
    afterImageUrl,
    publishImmediately,
  } = req.body

  const first = capitalizeWords(user.firstName) || 'Athlete'
  const last = capitalizeWords(user.lastName)
  const lastInitial = last ? ` ${last.charAt(0).toUpperCase()}.` : ''
  const authorName = `${first}${lastInitial}`

  const resolvedGoal = (goal && (goal === 'MUSCLE_GAIN' || goal === 'WEIGHT_LOSS'))
    ? (goal as Goal)
    : user.goal || null

  // Check if user has active check-ins or workouts to grant verified athlete badge
  const [workoutCount, checkInCount] = await Promise.all([
    prisma.workoutSession.count({ where: { userId } }),
    prisma.dailyCheckIn.count({ where: { userId } }),
  ])
  const verifiedAthlete = workoutCount > 0 || checkInCount > 0

  const hasImages = Boolean(
    (beforeImageUrl && String(beforeImageUrl).trim()) ||
    (afterImageUrl && String(afterImageUrl).trim())
  )
  const isAdmin = user.role === 'ADMIN'
  const shouldPublishImmediately = isAdmin && Boolean(publishImmediately)
  const moderationStatus = shouldPublishImmediately ? 'APPROVED' : 'PENDING_APPROVAL'
  const isFeatured = moderationStatus === 'APPROVED'

  let saved
  if (id) {
    saved = await prisma.testimonial.update({
      where: { id },
      data: {
        authorName,
        avatarUrl: user.avatarUrl,
        rating: Number(rating),
        content: content.trim(),
        highlightBadge: highlightBadge ? highlightBadge.trim() : null,
        goal: resolvedGoal,
        weightChangeKg: weightChangeKg !== undefined ? Number(weightChangeKg) : null,
        durationWeeks: durationWeeks !== undefined ? Number(durationWeeks) : null,
        beforeImageUrl: beforeImageUrl ? String(beforeImageUrl).trim() : null,
        afterImageUrl: afterImageUrl ? String(afterImageUrl).trim() : null,
        status: moderationStatus,
        verifiedAthlete,
        isFeatured,
      },
    })
  } else {
    saved = await prisma.testimonial.create({
      data: {
        userId,
        authorName,
        avatarUrl: user.avatarUrl,
        rating: Number(rating),
        content: content.trim(),
        highlightBadge: highlightBadge ? highlightBadge.trim() : null,
        goal: resolvedGoal,
        weightChangeKg: weightChangeKg !== undefined ? Number(weightChangeKg) : null,
        durationWeeks: durationWeeks !== undefined ? Number(durationWeeks) : null,
        beforeImageUrl: beforeImageUrl ? String(beforeImageUrl).trim() : null,
        afterImageUrl: afterImageUrl ? String(afterImageUrl).trim() : null,
        status: moderationStatus,
        verifiedAthlete,
        isFeatured,
        helpfulCount: 0,
      },
    })
  }

  if (moderationStatus === 'APPROVED') {
    createNotification({
      userId,
      type: 'ACHIEVEMENT',
      title: 'Story Published! 🌟',
      message: 'Your transformation story is now live in the Community Stories feed!',
      linkUrl: '/(screen)/dashboard?modal=testimonials&tab=feed',
    }).catch(() => {})
  } else {
    // Notify the user that their story is pending review
    createNotification({
      userId,
      type: 'ACHIEVEMENT',
      title: 'Story Submitted for Review ⏳',
      message: 'Your transformation story has been submitted and is currently pending admin approval.',
      linkUrl: '/(screen)/dashboard?modal=testimonials&tab=write',
    }).catch(() => {})

    // Notify ALL admins of the new story awaiting review
    prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    }).then((adminUsers) => {
      for (const admin of adminUsers) {
        createNotification({
          userId: admin.id,
          type: 'SUPPORT',
          title: 'New Story Pending Approval 📝',
          message: `${authorName} submitted a transformation story waiting for review.`,
          linkUrl: '/(screen)/admin?tab=support&subTab=stories',
        }).catch(() => {})
      }
    }).catch(() => {})
  }

  const successMessage = moderationStatus === 'APPROVED'
    ? (id ? 'Your transformation story has been updated and published!' : 'Thank you! Your transformation story has been published to the community.')
    : (id ? 'Your transformation story update has been submitted for admin approval.' : 'Thank you! Your story has been submitted for admin approval.')

  res.status(200).json({
    success: true,
    message: successMessage,
    testimonial: saved,
  })
})

/**
 * POST /api/testimonials/:id/helpful
 * Toggles helpful / inspiring vote on a testimonial per user.
 */
export const toggleHelpfulTestimonial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to vote on athlete stories' })
  }

  const rawId = req.params.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  if (!id) {
    return res.status(400).json({ error: 'Testimonial ID is required' })
  }

  const existing = await prisma.testimonial.findUnique({
    where: { id },
  })

  if (!existing) {
    return res.status(404).json({ error: 'Testimonial not found' })
  }

  const existingVote = await prisma.testimonialVote.findUnique({
    where: {
      testimonialId_userId: {
        testimonialId: id,
        userId,
      },
    },
  })

  if (existingVote) {
    // Un-vote
    await prisma.testimonialVote.delete({
      where: { id: existingVote.id },
    })

    const updated = await prisma.testimonial.update({
      where: { id },
      data: {
        helpfulCount: { decrement: 1 },
      },
      select: {
        id: true,
        helpfulCount: true,
      },
    })

    const finalCount = Math.max(updated.helpfulCount, 0)
    emitToCommunity('testimonial:voted', { id, helpfulCount: finalCount })

    return res.json({
      success: true,
      hasVoted: false,
      helpfulCount: finalCount,
      message: 'Inspiration vote removed',
    })
  } else {
    // Vote
    await prisma.testimonialVote.create({
      data: {
        testimonialId: id,
        userId,
      },
    })

    const updated = await prisma.testimonial.update({
      where: { id },
      data: {
        helpfulCount: { increment: 1 },
      },
      select: {
        id: true,
        helpfulCount: true,
      },
    })

    emitToCommunity('testimonial:voted', { id, helpfulCount: updated.helpfulCount })

    return res.json({
      success: true,
      hasVoted: true,
      helpfulCount: updated.helpfulCount,
      message: 'Marked as inspiring!',
    })
  }
})

/**
 * DELETE /api/testimonials/my
 * Allows the user to remove their testimonial.
 */
export const deleteMyTestimonial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const targetId = typeof req.query.id === 'string' ? req.query.id : undefined

  let existing
  if (targetId) {
    existing = await prisma.testimonial.findFirst({
      where: { id: targetId, userId },
    })
  } else {
    existing = await prisma.testimonial.findFirst({
      where: { userId },
    })
  }

  if (!existing) {
    return res.status(404).json({ error: 'No testimonial found to delete' })
  }

  await prisma.testimonial.delete({
    where: { id: existing.id },
  })

  res.json({
    success: true,
    message: 'Your testimonial has been removed.',
  })
})

/**
 * GET /api/testimonials/admin/all
 * Lists all testimonials for admin moderation.
 */
export const getAdminTestimonials = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied: Admin role required' })
  }

  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  })

  res.json({
    success: true,
    testimonials,
  })
})

/**
 * PATCH /api/testimonials/admin/:id
 * Approves, rejects, or toggles featured status of a testimonial.
 */
export const moderateTestimonial = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied: Admin role required' })
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const { status, isFeatured } = req.body

  const autoFeatured = status === 'APPROVED' ? true : status === 'REJECTED' ? false : undefined
  const finalFeatured = isFeatured !== undefined ? Boolean(isFeatured) : autoFeatured

  const updated = await prisma.testimonial.update({
    where: { id: String(id) },
    data: {
      ...(status ? { status } : {}),
      ...(finalFeatured !== undefined ? { isFeatured: finalFeatured } : {}),
    },
  })

  if (updated.userId) {
    createNotification({
      userId: updated.userId,
      type: status === 'APPROVED' ? 'ACHIEVEMENT' : 'SUPPORT',
      title: status === 'APPROVED' ? 'Story Approved! 🌟' : 'Story Moderation Notice',
      message: status === 'APPROVED'
        ? 'Your athlete transformation story has been approved and published to the community.'
        : 'Your transformation story was reviewed by administrators and marked as private.',
      linkUrl: status === 'APPROVED'
        ? '/(screen)/dashboard?modal=testimonials&tab=feed'
        : '/(screen)/dashboard?modal=testimonials&tab=write',
    }).catch(() => {})
  }

  if (status === 'APPROVED') {
    emitToCommunity('testimonial:new', updated)
  }

  emitToAdmin('admin:event', {
    type: 'TESTIMONIAL_MODERATED',
    id: updated.id,
    status: updated.status,
    timestamp: new Date().toISOString(),
  })

  res.json({
    success: true,
    message: `Testimonial updated to ${status || 'moderated'}`,
    testimonial: updated,
  })
})
