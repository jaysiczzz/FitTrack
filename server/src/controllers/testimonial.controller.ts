import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { Goal } from '@prisma/client'

/**
 * GET /api/testimonials
 * Public endpoint to fetch testimonials with optional goal filtering.
 */
export const getTestimonials = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { goal, limit } = req.query

  const whereClause: any = {
    isFeatured: true,
    userId: { not: null },
  }
  if (goal && (goal === 'MUSCLE_GAIN' || goal === 'WEIGHT_LOSS')) {
    whereClause.goal = goal as Goal
  }

  const take = limit ? Math.min(Math.max(Number(limit) || 20, 1), 50) : 30

  const [testimonials, allRatings] = await Promise.all([
    prisma.testimonial.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        authorName: true,
        rating: true,
        content: true,
        highlightBadge: true,
        goal: true,
        createdAt: true,
      },
    }),
    prisma.testimonial.aggregate({
      where: whereClause,
      _avg: { rating: true },
      _count: { id: true },
    }),
  ])

  const averageRating = allRatings._avg.rating
    ? Number(allRatings._avg.rating.toFixed(1))
    : 5.0
  const totalCount = allRatings._count.id || 0

  res.json({
    success: true,
    averageRating,
    totalCount,
    testimonials,
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

  const testimonial = await prisma.testimonial.findFirst({
    where: { userId },
  })

  res.json({
    success: true,
    testimonial: testimonial || null,
  })
})

/**
 * POST /api/testimonials
 * Create or update the authenticated user's testimonial.
 */
export const submitTestimonial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, goal: true },
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const { rating, content, highlightBadge, goal } = req.body

  const first = user.firstName?.trim() || 'Athlete'
  const lastInitial = user.lastName?.trim() ? ` ${user.lastName.trim().charAt(0).toUpperCase()}.` : ''
  const authorName = `${first}${lastInitial}`

  const resolvedGoal = (goal && (goal === 'MUSCLE_GAIN' || goal === 'WEIGHT_LOSS'))
    ? (goal as Goal)
    : user.goal || null

  // Check if user already submitted a testimonial
  const existing = await prisma.testimonial.findFirst({
    where: { userId },
  })

  let saved
  if (existing) {
    saved = await prisma.testimonial.update({
      where: { id: existing.id },
      data: {
        userId,
        authorName,
        rating: Number(rating),
        content: content.trim(),
        highlightBadge: highlightBadge ? highlightBadge.trim() : null,
        goal: resolvedGoal,
        isFeatured: true,
      },
    })
  } else {
    saved = await prisma.testimonial.create({
      data: {
        userId,
        authorName,
        rating: Number(rating),
        content: content.trim(),
        highlightBadge: highlightBadge ? highlightBadge.trim() : null,
        goal: resolvedGoal,
        isFeatured: true,
      },
    })
  }

  res.status(200).json({
    success: true,
    message: existing
      ? 'Your testimonial has been updated successfully!'
      : 'Thank you! Your testimonial has been shared with the community.',
    testimonial: saved,
  })
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

  const existing = await prisma.testimonial.findFirst({
    where: { userId },
  })

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
