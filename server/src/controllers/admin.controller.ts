import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { SubscriptionTier, SubscriptionStatus, Role } from '@prisma/client'
import { getOrCreatePlatformWallet } from './subscription.controller'
import {
  getAllTickets,
  updateTicket,
  deleteTicket,
  getTicketStats,
} from '../services/ticket.service'

/**
 * GET /api/admin/system-stats
 * Real-time aggregated system vitals, engagement, AI usage, and financial health
 */
export const getAdminSystemStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    totalAthletes,
    totalAdmins,
    newUsers7d,
    totalWorkoutsCompleted,
    workoutsCompletedToday,
    totalMealsLogged,
    mealsLoggedToday,
    aiScansToday,
    aiMessagesToday,
    totalStories,
    activeMonthly,
    activeAnnual,
    activeLifetime,
    grossRevenueResult,
    platformWallet,
    ticketStats,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: Role.USER } }),
    prisma.user.count({ where: { role: Role.ADMIN } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.workoutSession.count({ where: { completed: true } }),
    prisma.workoutSession.count({
      where: {
        completed: true,
        completedAt: { gte: startOfDay },
      },
    }),
    prisma.foodLogMeal.count(),
    prisma.foodLogMeal.count({
      where: {
        createdAt: { gte: startOfDay },
      },
    }),
    prisma.foodLogMeal.count({
      where: {
        imageUri: { not: null },
        createdAt: { gte: startOfDay },
      },
    }),
    prisma.aiChatMessage.count({
      where: {
        createdAt: { gte: startOfDay },
      },
    }),
    prisma.testimonial.count(),
    prisma.subscription.count({
      where: { tier: SubscriptionTier.PRO_MONTHLY, status: SubscriptionStatus.ACTIVE },
    }),
    prisma.subscription.count({
      where: { tier: SubscriptionTier.PRO_ANNUAL, status: SubscriptionStatus.ACTIVE },
    }),
    prisma.subscription.count({
      where: { tier: SubscriptionTier.LIFETIME_FOUNDER, status: SubscriptionStatus.ACTIVE },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: 'SUBSCRIPTION', status: 'COMPLETED' },
      _sum: { amount: true, fee: true, netAmount: true },
    }),
    getOrCreatePlatformWallet(),
    getTicketStats(),
  ])

  // MRR calculation (PHP/USD normalized)
  const monthlyRevenue = activeMonthly * 9.99
  const annualNormalizedMonthly = activeAnnual * (79.99 / 12)
  const mrr = Number((monthlyRevenue + annualNormalizedMonthly).toFixed(2))

  const totalProSubscribers = activeMonthly + activeAnnual + activeLifetime

  res.json({
    success: true,
    stats: {
      users: {
        total: totalUsers,
        athletes: totalAthletes,
        admins: totalAdmins,
        newThisWeek: newUsers7d,
      },
      activity: {
        totalWorkoutsCompleted,
        workoutsCompletedToday,
        totalMealsLogged,
        mealsLoggedToday,
        totalStories,
      },
      aiEngine: {
        foodScansToday: aiScansToday,
        coachQuestionsToday: aiMessagesToday,
        status: 'ONLINE',
      },
      financials: {
        mrr,
        grossRevenue: grossRevenueResult._sum.amount || 0.0,
        netRevenue: grossRevenueResult._sum.netAmount || 0.0,
        platformBalance: platformWallet.balance || 0.0,
        currency: platformWallet.currency || 'USD',
        activeProSubscribers: totalProSubscribers,
        activeMonthly,
        activeAnnual,
        activeLifetime,
      },
      support: ticketStats,
      timestamp: new Date().toISOString(),
    },
  })
})

/**
 * GET /api/admin/users
 * Real-time searchable directory of all registered athletes and administrators
 */
export const getAdminUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const roleFilter = typeof req.query.role === 'string' ? req.query.role.toUpperCase() : 'ALL'
  const tierFilter = typeof req.query.tier === 'string' ? req.query.tier.toUpperCase() : 'ALL'

  const whereClause: any = {}

  if (search) {
    whereClause.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (roleFilter === 'ADMIN') {
    whereClause.role = Role.ADMIN
  } else if (roleFilter === 'USER') {
    whereClause.role = Role.USER
  }

  if (tierFilter !== 'ALL') {
    if (tierFilter === 'PRO') {
      whereClause.subscription = {
        tier: { not: SubscriptionTier.FREE },
        status: SubscriptionStatus.ACTIVE,
      }
    } else if (tierFilter === 'FREE') {
      whereClause.OR = [
        { subscription: null },
        { subscription: { tier: SubscriptionTier.FREE } },
      ]
    }
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      height: true,
      weight: true,
      targetWeight: true,
      age: true,
      goal: true,
      createdAt: true,
      subscription: {
        select: {
          tier: true,
          status: true,
          currentPeriodEnd: true,
        },
      },
      _count: {
        select: {
          workoutSessions: true,
          dailyFoodLogs: true,
        },
      },
    },
  })

  res.json({
    success: true,
    total: users.length,
    users,
  })
})

/**
 * PUT /api/admin/users/:id/role
 * Elevate or demote user role (USER <-> ADMIN)
 */
export const updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const { role } = req.body

  if (!userId) return res.status(400).json({ error: 'User ID is required' })
  if (!role || (role !== 'USER' && role !== 'ADMIN')) {
    return res.status(400).json({ error: 'Role must be either USER or ADMIN' })
  }

  // Prevent admin from removing their own admin privilege if they are logged in
  if (req.user?.id === userId && role === 'USER') {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } })
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last remaining admin role.' })
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: role as Role },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  })

  res.json({
    success: true,
    message: `User role successfully updated to ${role}`,
    user: updatedUser,
  })
})

/**
 * DELETE /api/admin/users/:id
 * Remove user account and cascade associated records
 */
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  if (!userId) return res.status(400).json({ error: 'User ID is required' })

  if (req.user?.id === userId) {
    return res.status(400).json({ error: 'You cannot delete your own active admin account.' })
  }

  await prisma.user.delete({
    where: { id: userId },
  })

  res.json({
    success: true,
    message: 'User account and associated records deleted permanently.',
  })
})

/**
 * GET /api/admin/tickets
 * Live ticket feed from user feedback, bug reports, and inquiries
 */
export const getAdminTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const statusFilter = typeof req.query.status === 'string' ? (req.query.status.toUpperCase() as any) : undefined
  const [tickets, stats] = await Promise.all([
    getAllTickets(statusFilter),
    getTicketStats(),
  ])

  res.json({
    success: true,
    stats,
    tickets,
  })
})

/**
 * PATCH /api/admin/tickets/:id
 * Update support ticket status and add resolution notes
 */
export const updateAdminTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const { status, adminNotes } = req.body

  if (!id) return res.status(400).json({ error: 'Ticket ID is required' })

  const updated = await updateTicket(id, { status, adminNotes })
  if (!updated) {
    return res.status(404).json({ error: 'Ticket not found' })
  }

  res.json({
    success: true,
    message: 'Ticket updated successfully',
    ticket: updated,
  })
})

/**
 * DELETE /api/admin/tickets/:id
 * Remove resolved or spam ticket
 */
export const deleteAdminTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  if (!id) return res.status(400).json({ error: 'Ticket ID is required' })

  const success = await deleteTicket(id)
  if (!success) {
    return res.status(404).json({ error: 'Ticket not found' })
  }

  res.json({
    success: true,
    message: 'Ticket removed',
  })
})

/**
 * PATCH /api/admin/testimonials/:id/feature
 * Feature or unfeature an athlete transformation story in the community tab
 */
export const toggleStoryFeature = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  if (!id) return res.status(400).json({ error: 'Story ID is required' })

  const existing = await prisma.testimonial.findUnique({ where: { id } })
  if (!existing) return res.status(404).json({ error: 'Story not found' })

  const updated = await prisma.testimonial.update({
    where: { id },
    data: { isFeatured: !existing.isFeatured },
  })

  res.json({
    success: true,
    isFeatured: updated.isFeatured,
    message: `Story is now ${updated.isFeatured ? 'Featured' : 'Hidden from Featured'}`,
  })
})

/**
 * DELETE /api/admin/testimonials/:id
 * Remove inappropriate community submission
 */
export const deleteStory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  if (!id) return res.status(400).json({ error: 'Story ID is required' })

  await prisma.testimonial.delete({ where: { id } })

  res.json({
    success: true,
    message: 'Story removed from community database',
  })
})
