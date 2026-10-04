import { Response } from 'express'

import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { Goal } from '@prisma/client'
import { capitalizeWords } from '../utils/formatters.utils'

/**
 * GET /api/testimonials
 * Public endpoint to fetch testimonials with optional goal and sorting filters.
 */
export const getTestimonials = asyncHandler(async (req: AuthRequest, res: Response) => {

  const { goal, limit, sortBy } = req.query
  const userId = req.user?.id

  const whereClause: any = {
    isFeatured: true,
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
    select: { firstName: true, lastName: true, goal: true, avatarUrl: true },
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const { id, rating, content, highlightBadge, goal, weightChangeKg, durationWeeks } = req.body

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
        verifiedAthlete,
        isFeatured: true,
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
        verifiedAthlete,
        isFeatured: true,
        helpfulCount: 0, // Starts at 0 honest appreciations
      },
    })
  }

  res.status(200).json({
    success: true,
    message: id
      ? 'Your testimonial has been updated successfully!'
      : 'Thank you! Your transformation story has been shared with the community.',
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

    return res.json({
      success: true,
      hasVoted: false,
      helpfulCount: Math.max(updated.helpfulCount, 0),
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
