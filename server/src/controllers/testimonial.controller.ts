import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { Goal } from '@prisma/client'

const SEED_TESTIMONIALS = [
  {
    authorName: 'Marcus T.',
    rating: 5,
    content: "FitTrack's daily readiness check-in and camera food scanner kept me accountable every single day. Dropping 12kg without feeling starved changed my relationship with food forever.",
    highlightBadge: '🔥 -12kg in 16 Weeks',
    goal: 'WEIGHT_LOSS' as Goal,
    isFeatured: true,
    helpfulCount: 42,
    weightChangeKg: -12.0,
    durationWeeks: 16,
    verifiedAthlete: true,
  },
  {
    authorName: 'Sarah L.',
    rating: 5,
    content: 'The progressive overload tracking in the workout logger is unmatched. Hit personal bests on both my squat and deadlift within 3 months of following the structured routine!',
    highlightBadge: '💪 +4.5kg Muscle Mass',
    goal: 'MUSCLE_GAIN' as Goal,
    isFeatured: true,
    helpfulCount: 38,
    weightChangeKg: 4.5,
    durationWeeks: 12,
    verifiedAthlete: true,
  },
  {
    authorName: 'David K.',
    rating: 5,
    content: 'The AI Coach routines broke my 6-month plateau. Having tailored warm-up sets and dynamic target adjustments made all the difference.',
    highlightBadge: '🏆 100kg Bench Press PR',
    goal: 'MUSCLE_GAIN' as Goal,
    isFeatured: true,
    helpfulCount: 29,
    weightChangeKg: 2.0,
    durationWeeks: 8,
    verifiedAthlete: true,
  },
  {
    authorName: 'Elena R.',
    rating: 5,
    content: 'What I love most is the simplicity. Logging meals with the camera scanner takes literally 10 seconds. Down 7kg and feeling more energetic than ever!',
    highlightBadge: '⚡ 45-Day Consistency Streak',
    goal: 'WEIGHT_LOSS' as Goal,
    isFeatured: true,
    helpfulCount: 35,
    weightChangeKg: -7.0,
    durationWeeks: 10,
    verifiedAthlete: true,
  },
  {
    authorName: 'Alex M.',
    rating: 5,
    content: 'Finally hitting my daily macro goals with consistency. The macro progress rings and nutrition insights keep me dialed in throughout my bulking phase.',
    highlightBadge: '🥗 160g Daily Protein Target',
    goal: 'MUSCLE_GAIN' as Goal,
    isFeatured: true,
    helpfulCount: 24,
    weightChangeKg: 3.2,
    durationWeeks: 14,
    verifiedAthlete: true,
  },
  {
    authorName: 'Jessica P.',
    rating: 5,
    content: 'Started using FitTrack for weight loss and ended up falling in love with daily readiness check-ins and recovery tracking. Highly recommend to anyone seeking consistency.',
    highlightBadge: '🏃‍♀️ First 10K & -5kg',
    goal: 'WEIGHT_LOSS' as Goal,
    isFeatured: true,
    helpfulCount: 31,
    weightChangeKg: -5.0,
    durationWeeks: 9,
    verifiedAthlete: true,
  },
]

async function ensureInitialTestimonials() {
  try {
    const count = await prisma.testimonial.count()
    if (count === 0) {
      for (const t of SEED_TESTIMONIALS) {
        await prisma.testimonial.create({ data: t })
      }
    }
  } catch (err) {
    // Non-fatal if seeding runs into race condition
    console.warn('Testimonial seed initialization skipped:', err)
  }
}

/**
 * GET /api/testimonials
 * Public endpoint to fetch testimonials with optional goal and sorting filters.
 */
export const getTestimonials = asyncHandler(async (req: AuthRequest, res: Response) => {
  await ensureInitialTestimonials()

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
        authorName: true,
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
  const mappedTestimonials = testimonials.map((t) => ({
    ...t,
    hasVoted: votedSet.has(t.id),
  }))

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

  const { rating, content, highlightBadge, goal, weightChangeKg, durationWeeks } = req.body

  const first = user.firstName?.trim() || 'Athlete'
  const lastInitial = user.lastName?.trim() ? ` ${user.lastName.trim().charAt(0).toUpperCase()}.` : ''
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
        rating: Number(rating),
        content: content.trim(),
        highlightBadge: highlightBadge ? highlightBadge.trim() : null,
        goal: resolvedGoal,
        weightChangeKg: weightChangeKg !== undefined ? Number(weightChangeKg) : null,
        durationWeeks: durationWeeks !== undefined ? Number(durationWeeks) : null,
        verifiedAthlete,
        isFeatured: true,
        helpfulCount: 1, // Start with 1 appreciation
      },
    })
  }

  res.status(200).json({
    success: true,
    message: existing
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
