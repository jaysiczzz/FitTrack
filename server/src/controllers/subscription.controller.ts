import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client'
import {
  getOrCreateStripeCustomer,
  createPaymentIntent,
  verifyPaymentIntent,
  createStripeCheckoutSession,
  processCardPayment,
} from '../services/stripe.service'
import {
  createPayMongoCheckoutSession,
  verifyPayMongoPayment,
} from '../services/paymongo.service'
import {
  convertCurrency,
  formatCurrencyString,
  USD_PHP_EXCHANGE_RATE,
} from '../utils/currency.utils'

export interface PlanDefinition {
  id: string
  tier: SubscriptionTier
  name: string
  badge: string
  price: number // backward compatibility (defaults to PHP or USD)
  priceUSD: number
  pricePHP: number
  currency: string
  interval: string | null
  features: string[]
}

export const SUBSCRIPTION_PLANS: Record<string, PlanDefinition> = {
  FREE: {
    id: 'FREE',
    tier: SubscriptionTier.FREE,
    name: 'FitTrack Free',
    badge: 'Starter',
    price: 0,
    priceUSD: 0,
    pricePHP: 0,
    currency: 'PHP',
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
    price: 499.00,
    priceUSD: 9.99,
    pricePHP: 499.00,
    currency: 'PHP',
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
    price: 3999.00,
    priceUSD: 79.99,
    pricePHP: 3999.00,
    currency: 'PHP',
    interval: 'year',
    features: [
      'All Pro Monthly features included',
      'Save 33% compared to monthly (₱333/month)',
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
    price: 9999.00,
    priceUSD: 199.99,
    pricePHP: 9999.00,
    currency: 'PHP',
    interval: 'lifetime',
    features: [
      'Permanent lifetime Pro access with zero recurring fees',
      'Exclusive Gold Founder athlete profile badge',
      'Direct developer feedback channel',
      'All future premium fitness models included forever',
    ],
  },
}

export function getPlanPricing(tierKey: string, currency: string = 'PHP') {
  const plan = SUBSCRIPTION_PLANS[tierKey] || SUBSCRIPTION_PLANS.FREE
  const isUSD = currency.toUpperCase() === 'USD'
  return {
    price: isUSD ? plan.priceUSD : plan.pricePHP,
    currency: isUSD ? 'USD' : 'PHP',
    symbol: isUSD ? '$' : '₱',
  }
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
        currency: 'PHP',
      },
    })
  }
  return wallet
}

export async function getOrCreateUserWallet(userId: string, defaultCurrency: string = 'PHP') {
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
  })
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        isPlatform: false,
        balance: 0.0,
        currency: defaultCurrency.toUpperCase(),
      },
    })
  }
  return wallet
}

/**
 * GET /api/subscriptions/plans
 * Returns available subscription tiers and feature matrices with PHP & USD pricing
 */
export const getSubscriptionPlans = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currency = (req.query.currency as string) || 'PHP'
  const isUSD = currency.toUpperCase() === 'USD'

  const formattedPlans = Object.values(SUBSCRIPTION_PLANS).map((p) => ({
    ...p,
    price: isUSD ? p.priceUSD : p.pricePHP,
    currency: isUSD ? 'USD' : 'PHP',
    symbol: isUSD ? '$' : '₱',
  }))

  res.json({
    success: true,
    currency: isUSD ? 'USD' : 'PHP',
    symbol: isUSD ? '$' : '₱',
    plans: formattedPlans,
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

  const { tier, paymentMethod = 'CARD', currency = 'PHP', phoneNumber } = req.body
  const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS]

  if (!plan) {
    return res.status(400).json({ error: 'Invalid paid subscription tier selected.' })
  }

  const pricing = getPlanPricing(tier, currency)
  if (pricing.price <= 0) {
    return res.status(400).json({ error: 'Free tier does not require checkout.' })
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
    const userWallet = await getOrCreateUserWallet(userId, 'PHP')
    const { convertedAmount: requiredWalletBalance } = convertCurrency(
      pricing.price,
      pricing.currency,
      userWallet.currency
    )
    if (userWallet.balance < requiredWalletBalance) {
      return res.status(400).json({
        error: `Insufficient e-wallet balance (${formatCurrencyString(userWallet.balance, userWallet.currency)}). Required: ${formatCurrencyString(requiredWalletBalance, userWallet.currency)}. Please top up your wallet via GCash, Maya, or Card.`,
        requiredAmount: requiredWalletBalance,
        currentBalance: userWallet.balance,
        currency: userWallet.currency,
      })
    }

    return res.json({
      success: true,
      paymentMethod: 'E_WALLET',
      plan: { ...plan, price: pricing.price, currency: pricing.currency, symbol: pricing.symbol },
      canPayImmediately: true,
    })
  }

  const selectedMethod = String(paymentMethod).toUpperCase() as 'GCASH' | 'MAYA' | 'CARD' | 'GRABPAY'

  // 1. GCash & Maya via PayMongo Official Checkout
  if (selectedMethod === 'GCASH' || selectedMethod === 'MAYA' || selectedMethod === 'GRABPAY') {
    const { convertedAmount: phpPrice } = convertCurrency(pricing.price, pricing.currency, 'PHP')
    const paymongoSession = await createPayMongoCheckoutSession({
      amount: phpPrice,
      description: `FitTrack Subscription: ${plan.name}`,
      paymentMethod: selectedMethod,
      customerEmail: user.email,
      customerName: `${user.firstName} ${user.lastName}`,
      customerPhone: phoneNumber,
      metadata: {
        userId,
        tier,
        planName: plan.name,
        currency: 'PHP',
        paymentMethod: selectedMethod,
      },
    })

    return res.json({
      success: true,
      paymentMethod: selectedMethod,
      plan: { ...plan, price: pricing.price, currency: pricing.currency, symbol: pricing.symbol },
      checkoutUrl: paymongoSession.checkoutUrl,
      paymentIntentId: paymongoSession.id,
      amount: phpPrice,
      currency: 'PHP',
      referenceNumber: paymongoSession.referenceNumber,
      isSimulated: paymongoSession.isSimulated,
    })
  }

  // 2. Card via Stripe Direct API or Hosted Checkout
  const { cardNumber, cardExpiry, cardCvc } = req.body
  if (cardNumber && cardExpiry && cardCvc) {
    const cardResult = await processCardPayment({
      amount: pricing.price,
      currency: pricing.currency,
      cardNumber,
      cardExpiry,
      cardCvc,
      description: `FitTrack Subscription: ${plan.name} (${formatCurrencyString(pricing.price, pricing.currency)})`,
      metadata: {
        userId,
        tier,
        planName: plan.name,
      },
    })

    return res.json({
      success: true,
      paymentMethod: 'CARD',
      plan: { ...plan, price: pricing.price, currency: pricing.currency, symbol: pricing.symbol },
      paymentIntentId: cardResult.id,
      amount: pricing.price,
      currency: pricing.currency,
      isSimulated: cardResult.isSimulated,
    })
  }

  const stripeSession = await createStripeCheckoutSession({
    amount: pricing.price,
    currency: pricing.currency,
    planName: `FitTrack ${plan.name} (${formatCurrencyString(pricing.price, pricing.currency)})`,
    customerEmail: user.email,
    metadata: {
      userId,
      tier,
      planName: plan.name,
      currency: pricing.currency,
      paymentMethod: 'CARD',
    },
  })

  return res.json({
    success: true,
    paymentMethod: 'CARD',
    plan: { ...plan, price: pricing.price, currency: pricing.currency, symbol: pricing.symbol },
    checkoutUrl: stripeSession.checkoutUrl,
    paymentIntentId: stripeSession.sessionId,
    amount: pricing.price,
    currency: pricing.currency,
    isSimulated: stripeSession.isSimulated,
  })
})

/**
 * POST /api/subscriptions/confirm
 * Confirms payment with Stripe / PayMongo, activates subscription tier, and records transaction in ledger
 */
export const confirmSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { tier, paymentIntentId, currency = 'PHP', paymentMethod = 'CARD' } = req.body
  const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS]

  if (!plan) {
    return res.status(400).json({ error: 'Invalid subscription tier' })
  }

  const pricing = getPlanPricing(tier, currency)
  const selectedMethod = String(paymentMethod).toUpperCase()

  // Verify payment status
  if (paymentIntentId.startsWith('cs_pm_') || selectedMethod === 'GCASH' || selectedMethod === 'MAYA') {
    const verified = await verifyPayMongoPayment(paymentIntentId)
    if (!verified.paid && process.env.NODE_ENV === 'production') {
      return res.status(400).json({
        error: 'PayMongo payment has not been completed yet.',
      })
    }
  } else {
    const verified = await verifyPaymentIntent(paymentIntentId, pricing.price, pricing.currency)
    if (verified.status !== 'succeeded') {
      return res.status(400).json({
        error: `Payment has not succeeded yet (status: ${verified.status}).`,
      })
    }
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
      amount: pricing.price,
      currency: pricing.currency,
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
      amount: pricing.price,
      currency: pricing.currency,
      interval: plan.interval,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  })

  // Atomically credit platform master wallet and record ledger
  const platformWallet = await getOrCreatePlatformWallet()
  const feeRate = pricing.currency === 'PHP' ? 0.025 : 0.029
  const fixedFee = pricing.currency === 'PHP' ? 15.0 : 0.30
  const processingFee = Number((pricing.price * feeRate + fixedFee).toFixed(2))
  const netAmount = Number(Math.max(0, pricing.price - processingFee).toFixed(2))

  // Convert net amount to platform wallet currency
  const { convertedAmount: platformNetCredit } = convertCurrency(netAmount, pricing.currency, platformWallet.currency)
  const { convertedAmount: platformGrossCredit } = convertCurrency(pricing.price, pricing.currency, platformWallet.currency)
  const { convertedAmount: platformFee } = convertCurrency(processingFee, pricing.currency, platformWallet.currency)

  await prisma.$transaction([
    prisma.wallet.update({
      where: { id: platformWallet.id },
      data: {
        balance: {
          increment: platformNetCredit,
        },
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: platformWallet.id,
        userId,
        type: 'SUBSCRIPTION',
        amount: platformGrossCredit,
        fee: platformFee,
        netAmount: platformNetCredit,
        currency: platformWallet.currency,
        status: 'COMPLETED',
        paymentMethod: selectedMethod,
        referenceId: paymentIntentId,
        description: `Subscription activated: ${plan.name} (${formatCurrencyString(pricing.price, pricing.currency)}) via ${selectedMethod}`,
      },
    }),
  ])

  res.json({
    success: true,
    message: `Congratulations! You have upgraded to ${plan.name}.`,
    subscription: updatedSub,
    isPro: true,
    planInfo: { ...plan, price: pricing.price, currency: pricing.currency, symbol: pricing.symbol },
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

  const sub = await prisma.subscription.findUnique({
    where: { userId },
  })

  if (!sub || sub.tier === SubscriptionTier.FREE) {
    return res.status(400).json({ error: 'No active subscription found to reactivate.' })
  }

  if (!sub.cancelAtPeriodEnd) {
    return res.status(400).json({ error: 'Subscription is already active with auto-renewal enabled.' })
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
