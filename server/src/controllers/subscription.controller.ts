import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client'
import {
  getOrCreateStripeCustomer,
  createPaymentIntent,
  verifyPaymentIntent,
} from '../services/stripe.service'

export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'FREE',
    tier: SubscriptionTier.FREE,
    name: 'FitTrack Free',
    badge: 'Starter',
    price: 0,
    currency: 'USD',
    interval: null,
    features: [
      'Basic workout and exercise set tracking',
      '50+ exercise library with video demonstrations',
      'Standard food, calories & water logger',
      'Daily readiness check-in and streaks',
      'Community athlete transformations & reviews',
    ],
  },
  PRO_MONTHLY: {
    id: 'PRO_MONTHLY',
    tier: SubscriptionTier.PRO_MONTHLY,
    name: 'FitTrack Pro Monthly',
    badge: 'Most Popular',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Free tier',
      'Unlimited AI Fitness Coach (Google Gemini 2.0 Flash)',
      'AI Multimodal Camera Food Scanner & Macro Analysis',
      'Daily, weekly, and monthly workout routine planner',
      'Detailed Personal Record (PR) badges and trophies',
      'Offline-first cloud synchronization and data backup',
    ],
  },
  PRO_ANNUAL: {
    id: 'PRO_ANNUAL',
    tier: SubscriptionTier.PRO_ANNUAL,
    name: 'FitTrack Pro Annual',
    badge: 'Best Value · Save 33%',
    price: 79.99,
    currency: 'USD',
    interval: 'year',
    features: [
      'All Pro Monthly features included',
      'Save 33% compared to monthly ($6.67/month)',
      'Priority customer service and ticket resolution',
      'Advanced 1RM and volume analytics',
      'Early access to all upcoming features',
    ],
  },
  LIFETIME_FOUNDER: {
    id: 'LIFETIME_FOUNDER',
    tier: SubscriptionTier.LIFETIME_FOUNDER,
    name: 'Founder Lifetime Pass',
    badge: 'Limited VIP',
    price: 199.99,
    currency: 'USD',
    interval: 'lifetime',
    features: [
      'Permanent lifetime Pro access with zero recurring fees',
      'Exclusive Gold Founder athlete profile badge',
      'Direct developer feedback channel',
      'All future premium fitness models included forever',
    ],
  },
}

export async function getOrCreatePlatformWallet() {
  let wallet = await prisma.wallet.findFirst({
    where: { isPlatform: true },
  })
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        isPlatform: true,
        balance: 0.0,
        currency: 'USD',
      },
    })
  }
  return wallet
}

export async function getOrCreateUserWallet(userId: string) {
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
  })
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        isPlatform: false,
        balance: 0.0,
        currency: 'USD',
      },
    })
  }
  return wallet
}

/**
 * GET /api/subscriptions/plans
 * Returns available subscription tiers and feature matrices
 */
export const getSubscriptionPlans = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    plans: Object.values(SUBSCRIPTION_PLANS),
  })
})

/**
 * GET /api/subscriptions/me
 * Returns authenticated user's current subscription, status, and unlocked features
 */
export const getCurrentSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  let sub = await prisma.subscription.findUnique({
    where: { userId },
  })

  // Create free tier subscription if none exists yet
  if (!sub) {
    sub = await prisma.subscription.create({
      data: {
        userId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        amount: 0.0,
        currency: 'USD',
      },
    })
  }

  // Check if paid subscription has expired
  const now = new Date()
  if (
    sub.tier !== SubscriptionTier.FREE &&
    sub.tier !== SubscriptionTier.LIFETIME_FOUNDER &&
    sub.currentPeriodEnd &&
    sub.currentPeriodEnd < now &&
    sub.status === SubscriptionStatus.ACTIVE
  ) {
    sub = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: SubscriptionStatus.EXPIRED,
        tier: SubscriptionTier.FREE,
      },
    })
  }

  const planInfo = SUBSCRIPTION_PLANS[sub.tier] || SUBSCRIPTION_PLANS.FREE
  const isPro = sub.tier !== SubscriptionTier.FREE && sub.status === SubscriptionStatus.ACTIVE

  // Compute remaining days
  let daysRemaining = null
  if (sub.currentPeriodEnd && sub.tier !== SubscriptionTier.LIFETIME_FOUNDER) {
    const diffMs = sub.currentPeriodEnd.getTime() - now.getTime()
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  }

  res.json({
    success: true,
    subscription: sub,
    isPro,
    planInfo,
    daysRemaining,
  })
})

/**
 * POST /api/subscriptions/checkout
 * Prepares a Stripe PaymentIntent or checks wallet balance for subscription purchase
 */
export const createCheckoutSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { tier, paymentMethod = 'STRIPE' } = req.body
  const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS]

  if (!plan || plan.price <= 0) {
    return res.status(400).json({ error: 'Invalid paid subscription tier selected.' })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, lastName: true },
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Handle e-Wallet payment option
  if (paymentMethod === 'E_WALLET') {
    const wallet = await getOrCreateUserWallet(userId)
    if (wallet.balance < plan.price) {
      return res.status(400).json({
        error: `Insufficient e-wallet balance ($${wallet.balance.toFixed(2)}). Please top up or pay with Stripe.`,
        requiredAmount: plan.price,
        currentBalance: wallet.balance,
      })
    }

    return res.json({
      success: true,
      paymentMethod: 'E_WALLET',
      plan,
      canPayImmediately: true,
    })
  }

  // Stripe PaymentIntent
  const stripeCustomer = await getOrCreateStripeCustomer(user.email, `${user.firstName} ${user.lastName}`)
  const paymentIntent = await createPaymentIntent({
    amount: plan.price,
    currency: 'usd',
    customerId: stripeCustomer.id,
    description: `FitTrack Subscription: ${plan.name}`,
    metadata: {
      userId,
      tier,
      planName: plan.name,
    },
  })

  res.json({
    success: true,
    paymentMethod: 'STRIPE',
    plan,
    clientSecret: paymentIntent.clientSecret,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    isSimulated: paymentIntent.isSimulated,
  })
})

/**
 * POST /api/subscriptions/confirm
 * Confirms payment with Stripe, activates subscription tier, and records transaction in ledger
 */
export const confirmSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { tier, paymentIntentId } = req.body
  const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS]

  if (!plan) {
    return res.status(400).json({ error: 'Invalid subscription tier' })
  }

  // Verify payment status
  const verified = await verifyPaymentIntent(paymentIntentId)
  if (verified.status !== 'succeeded') {
    return res.status(400).json({
      error: `Payment has not succeeded yet (status: ${verified.status}).`,
    })
  }

  // Calculate subscription active period
  const now = new Date()
  let periodEnd: Date | null = null

  if (plan.tier === SubscriptionTier.PRO_MONTHLY) {
    periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  } else if (plan.tier === SubscriptionTier.PRO_ANNUAL) {
    periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
  } else if (plan.tier === SubscriptionTier.LIFETIME_FOUNDER) {
    periodEnd = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000) // 100 years
  }

  // Upsert subscription
  const updatedSub = await prisma.subscription.upsert({
    where: { userId },
    update: {
      tier: plan.tier,
      status: SubscriptionStatus.ACTIVE,
      stripePaymentIntentId: paymentIntentId,
      amount: plan.price,
      currency: 'USD',
      interval: plan.interval,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
    create: {
      userId,
      tier: plan.tier,
      status: SubscriptionStatus.ACTIVE,
      stripePaymentIntentId: paymentIntentId,
      amount: plan.price,
      currency: 'USD',
      interval: plan.interval,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  })

  // Credit platform master revenue wallet
  const platformWallet = await getOrCreatePlatformWallet()
  const stripeFee = Number((plan.price * 0.029 + 0.3).toFixed(2)) // Stripe 2.9% + $0.30 standard fee
  const netAmount = Number((plan.price - stripeFee).toFixed(2))

  await prisma.wallet.update({
    where: { id: platformWallet.id },
    data: {
      balance: {
        increment: netAmount,
      },
    },
  })

  // Record transaction in ledger
  await prisma.walletTransaction.create({
    data: {
      walletId: platformWallet.id,
      userId,
      type: 'SUBSCRIPTION',
      amount: plan.price,
      fee: stripeFee,
      netAmount,
      currency: 'USD',
      status: 'COMPLETED',
      paymentMethod: 'STRIPE',
      referenceId: paymentIntentId,
      description: `Subscription activated: ${plan.name}`,
    },
  })

  res.json({
    success: true,
    message: `Congratulations! You have upgraded to ${plan.name}.`,
    subscription: updatedSub,
    isPro: true,
    planInfo: plan,
  })
})

/**
 * POST /api/subscriptions/cancel
 * Cancels auto-renew at the end of the current billing cycle
 */
export const cancelSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId },
  })

  if (!sub || sub.tier === SubscriptionTier.FREE) {
    return res.status(400).json({ error: 'No active paid subscription to cancel.' })
  }

  if (sub.tier === SubscriptionTier.LIFETIME_FOUNDER) {
    return res.status(400).json({ error: 'Lifetime passes do not renew and cannot be canceled.' })
  }

  const updated = await prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
    },
  })

  res.json({
    success: true,
    message: 'Auto-renewal turned off. You will retain Pro access until the end of your billing cycle.',
    subscription: updated,
  })
})

/**
 * POST /api/subscriptions/reactivate
 * Reactivates auto-renew before expiration
 */
export const reactivateSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const updated = await prisma.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: false,
    },
  })

  res.json({
    success: true,
    message: 'Auto-renewal reactivated successfully!',
    subscription: updated,
  })
})
