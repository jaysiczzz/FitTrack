import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client'
import {
  getOrCreateUserWallet,
  getOrCreatePlatformWallet,
  SUBSCRIPTION_PLANS,
} from './subscription.controller'
import { createPaymentIntent, verifyPaymentIntent } from '../services/stripe.service'

/**
 * GET /api/wallet/me
 * Retrieves authenticated user's wallet balance and personal transaction ledger
 */
export const getUserWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const wallet = await getOrCreateUserWallet(userId)

  const transactions = await prisma.walletTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  res.json({
    success: true,
    wallet: {
      id: wallet.id,
      balance: wallet.balance,
      currency: wallet.currency,
    },
    transactions,
  })
})

/**
 * POST /api/wallet/deposit/initiate
 * Creates a Stripe PaymentIntent to top up the user's e-wallet
 */
export const initiateDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { amount } = req.body
  const depositAmount = Number(amount)

  if (isNaN(depositAmount) || depositAmount <= 0) {
    return res.status(400).json({ error: 'Valid deposit amount is required.' })
  }

  const paymentIntent = await createPaymentIntent({
    amount: depositAmount,
    currency: 'usd',
    description: `FitTrack e-Wallet Deposit: $${depositAmount.toFixed(2)}`,
    metadata: {
      userId,
      action: 'wallet_deposit',
      depositAmount: String(depositAmount),
    },
  })

  res.json({
    success: true,
    clientSecret: paymentIntent.clientSecret,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    isSimulated: paymentIntent.isSimulated,
  })
})

/**
 * POST /api/wallet/deposit/confirm
 * Confirms payment intent and credits user's e-wallet
 */
export const confirmDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { paymentIntentId, amount } = req.body
  const depositAmount = Number(amount)

  const verified = await verifyPaymentIntent(paymentIntentId)
  if (verified.status !== 'succeeded') {
    return res.status(400).json({ error: `Payment not verified (status: ${verified.status}).` })
  }

  const wallet = await getOrCreateUserWallet(userId)

  const updatedWallet = await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: {
        increment: depositAmount,
      },
    },
  })

  // Create transaction record
  const transaction = await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      userId,
      type: 'DEPOSIT',
      amount: depositAmount,
      fee: 0.0,
      netAmount: depositAmount,
      currency: 'USD',
      status: 'COMPLETED',
      paymentMethod: 'STRIPE',
      referenceId: paymentIntentId,
      description: `e-Wallet Top-up: +$${depositAmount.toFixed(2)}`,
    },
  })

  res.json({
    success: true,
    message: `Successfully topped up $${depositAmount.toFixed(2)} to your e-wallet!`,
    balance: updatedWallet.balance,
    transaction,
  })
})

/**
 * POST /api/wallet/pay-subscription
 * Pays for a subscription plan directly with user's e-wallet balance
 */
export const paySubscriptionWithWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { tier } = req.body
  const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS]

  if (!plan || plan.price <= 0) {
    return res.status(400).json({ error: 'Invalid paid subscription tier.' })
  }

  const userWallet = await getOrCreateUserWallet(userId)

  if (userWallet.balance < plan.price) {
    return res.status(400).json({
      error: `Insufficient e-wallet balance ($${userWallet.balance.toFixed(2)}). Needed: $${plan.price.toFixed(2)}.`,
      balance: userWallet.balance,
      required: plan.price,
    })
  }

  // Deduct from user wallet
  const updatedUserWallet = await prisma.wallet.update({
    where: { id: userWallet.id },
    data: {
      balance: {
        decrement: plan.price,
      },
    },
  })

  // Credit platform master revenue wallet
  const platformWallet = await getOrCreatePlatformWallet()
  await prisma.wallet.update({
    where: { id: platformWallet.id },
    data: {
      balance: {
        increment: plan.price,
      },
    },
  })

  // Calculate dates
  const now = new Date()
  let periodEnd: Date | null = null

  if (plan.tier === SubscriptionTier.PRO_MONTHLY) {
    periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  } else if (plan.tier === SubscriptionTier.PRO_ANNUAL) {
    periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
  } else if (plan.tier === SubscriptionTier.LIFETIME_FOUNDER) {
    periodEnd = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000)
  }

  // Update subscription
  const sub = await prisma.subscription.upsert({
    where: { userId },
    update: {
      tier: plan.tier,
      status: SubscriptionStatus.ACTIVE,
      stripePaymentIntentId: `wallet_tx_${Date.now().toString(36)}`,
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
      stripePaymentIntentId: `wallet_tx_${Date.now().toString(36)}`,
      amount: plan.price,
      currency: 'USD',
      interval: plan.interval,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  })

  // Record user debit transaction
  await prisma.walletTransaction.create({
    data: {
      walletId: userWallet.id,
      userId,
      type: 'SUBSCRIPTION',
      amount: -plan.price,
      fee: 0.0,
      netAmount: -plan.price,
      currency: 'USD',
      status: 'COMPLETED',
      paymentMethod: 'E_WALLET',
      referenceId: sub.id,
      description: `Subscription paid via e-wallet: ${plan.name}`,
    },
  })

  // Record platform revenue credit
  await prisma.walletTransaction.create({
    data: {
      walletId: platformWallet.id,
      userId,
      type: 'SUBSCRIPTION',
      amount: plan.price,
      fee: 0.0,
      netAmount: plan.price,
      currency: 'USD',
      status: 'COMPLETED',
      paymentMethod: 'E_WALLET',
      referenceId: sub.id,
      description: `e-Wallet Subscription: ${plan.name}`,
    },
  })

  res.json({
    success: true,
    message: `Subscribed to ${plan.name} using your e-wallet!`,
    subscription: sub,
    remainingBalance: updatedUserWallet.balance,
    isPro: true,
    planInfo: plan,
  })
})
