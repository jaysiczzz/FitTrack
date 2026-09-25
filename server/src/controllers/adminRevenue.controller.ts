import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client'
import {
  getOrCreatePlatformWallet,
  SUBSCRIPTION_PLANS,
} from './subscription.controller'

/**
 * GET /api/admin/revenue/overview
 * Comprehensive financial and subscription metrics for administrators
 */
export const getAdminRevenueOverview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const platformWallet = await getOrCreatePlatformWallet()

  // Total active subscribers
  const [
    totalUsersCount,
    activeMonthlyCount,
    activeAnnualCount,
    activeLifetimeCount,
    canceledCount,
    expiredCount,
    totalGrossRevenueResult,
    totalPayoutsResult,
    recentTransactions,
    recentSubscribers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({
      where: { tier: SubscriptionTier.PRO_MONTHLY, status: SubscriptionStatus.ACTIVE },
    }),
    prisma.subscription.count({
      where: { tier: SubscriptionTier.PRO_ANNUAL, status: SubscriptionStatus.ACTIVE },
    }),
    prisma.subscription.count({
      where: { tier: SubscriptionTier.LIFETIME_FOUNDER, status: SubscriptionStatus.ACTIVE },
    }),
    prisma.subscription.count({
      where: { status: SubscriptionStatus.CANCELED },
    }),
    prisma.subscription.count({
      where: { status: SubscriptionStatus.EXPIRED },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: 'SUBSCRIPTION', status: 'COMPLETED' },
      _sum: { amount: true, fee: true, netAmount: true },
      _count: { id: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: 'PAYOUT', status: 'COMPLETED' },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.walletTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.subscription.findMany({
      where: {
        tier: { not: SubscriptionTier.FREE },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        },
      },
    }),
  ])

  // MRR Calculation
  const monthlyRevenue = activeMonthlyCount * 9.99
  const annualNormalizedMonthly = activeAnnualCount * (79.99 / 12)
  const mrr = Number((monthlyRevenue + annualNormalizedMonthly).toFixed(2))

  const totalActivePayingSubscribers = activeMonthlyCount + activeAnnualCount + activeLifetimeCount
  const freeUsersCount = Math.max(0, totalUsersCount - totalActivePayingSubscribers)

  const grossRevenue = totalGrossRevenueResult._sum.amount || 0.0
  const stripeFees = totalGrossRevenueResult._sum.fee || 0.0
  const netRevenue = totalGrossRevenueResult._sum.netAmount || 0.0
  const totalPayouts = Math.abs(totalPayoutsResult._sum.amount || 0.0)

  // Churn rate calculation
  const totalSubscribersEver = totalActivePayingSubscribers + canceledCount + expiredCount
  const churnRate =
    totalSubscribersEver > 0
      ? Number(((canceledCount + expiredCount) / totalSubscribersEver * 100).toFixed(1))
      : 0

  res.json({
    success: true,
    metrics: {
      platformWalletBalance: platformWallet.balance,
      grossRevenue: Number(grossRevenue.toFixed(2)),
      stripeFees: Number(stripeFees.toFixed(2)),
      netRevenue: Number(netRevenue.toFixed(2)),
      mrr,
      arr: Number((mrr * 12).toFixed(2)),
      totalPayouts: Number(totalPayouts.toFixed(2)),
      totalUsersCount,
      freeUsersCount,
      totalActivePayingSubscribers,
      activeMonthlyCount,
      activeAnnualCount,
      activeLifetimeCount,
      churnRate,
    },
    tierBreakdown: {
      free: freeUsersCount,
      proMonthly: activeMonthlyCount,
      proAnnual: activeAnnualCount,
      lifetime: activeLifetimeCount,
    },
    transactions: recentTransactions,
    subscribers: recentSubscribers,
  })
})

/**
 * POST /api/admin/revenue/payout
 * Processes an administrator withdrawal/payout from the platform master wallet
 */
export const processAdminPayout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { amount, destination, notes } = req.body
  const payoutAmount = Number(amount)

  if (isNaN(payoutAmount) || payoutAmount <= 0) {
    return res.status(400).json({ error: 'Valid payout amount is required.' })
  }

  const platformWallet = await getOrCreatePlatformWallet()

  if (platformWallet.balance < payoutAmount) {
    return res.status(400).json({
      error: `Insufficient platform wallet funds ($${platformWallet.balance.toFixed(2)}).`,
      currentBalance: platformWallet.balance,
      requestedAmount: payoutAmount,
    })
  }

  const updatedWallet = await prisma.wallet.update({
    where: { id: platformWallet.id },
    data: {
      balance: {
        decrement: payoutAmount,
      },
    },
  })

  // Record payout transaction
  const tx = await prisma.walletTransaction.create({
    data: {
      walletId: platformWallet.id,
      userId: req.user?.id,
      type: 'PAYOUT',
      amount: -payoutAmount,
      fee: 0.0,
      netAmount: -payoutAmount,
      currency: 'USD',
      status: 'COMPLETED',
      paymentMethod: 'MANUAL',
      referenceId: `payout_${Date.now().toString(36)}`,
      description: `Admin Payout to ${destination}${notes ? ` (${notes})` : ''}`,
    },
  })

  res.json({
    success: true,
    message: `Successfully processed payout of $${payoutAmount.toFixed(2)} to ${destination}!`,
    newBalance: updatedWallet.balance,
    transaction: tx,
  })
})

/**
 * PUT /api/admin/revenue/override-subscription
 * Admin ability to grant, extend, or revoke user subscriptions
 */
export const adminOverrideUserSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, tier, status = 'ACTIVE', durationMonths = 1 } = req.body

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true },
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const now = new Date()
  let periodEnd: Date | null = null

  if (tier === SubscriptionTier.PRO_MONTHLY) {
    periodEnd = new Date(now.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000)
  } else if (tier === SubscriptionTier.PRO_ANNUAL) {
    periodEnd = new Date(now.getTime() + durationMonths * 365 * 24 * 60 * 60 * 1000)
  } else if (tier === SubscriptionTier.LIFETIME_FOUNDER) {
    periodEnd = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000)
  }

  const sub = await prisma.subscription.upsert({
    where: { userId },
    update: {
      tier,
      status,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
    create: {
      userId,
      tier,
      status,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  })

  // Create audit transaction log
  const platformWallet = await getOrCreatePlatformWallet()
  await prisma.walletTransaction.create({
    data: {
      walletId: platformWallet.id,
      userId,
      type: 'CREDIT',
      amount: 0.0,
      fee: 0.0,
      netAmount: 0.0,
      currency: 'USD',
      status: 'COMPLETED',
      paymentMethod: 'MANUAL',
      description: `Admin manual grant: ${tier} (${status}) for ${user.email}`,
    },
  })

  res.json({
    success: true,
    message: `Updated ${user.firstName}'s subscription to ${tier}!`,
    subscription: sub,
  })
})
