import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client'
import {
  getOrCreateUserWallet,
  getOrCreatePlatformWallet,
  SUBSCRIPTION_PLANS,
  getPlanPricing,
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
 * Creates a Stripe PaymentIntent to top up the user's e-wallet via GCash, Maya, or Card
 */
export const initiateDeposit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { amount, currency = 'PHP', paymentMethod = 'GCASH', phoneNumber } = req.body
  const depositAmount = Number(amount)

  if (isNaN(depositAmount) || depositAmount <= 0) {
    return res.status(400).json({ error: 'Valid deposit amount is required.' })
  }

  const isUSD = String(currency).toUpperCase() === 'USD'
  const targetCurrency = isUSD ? 'USD' : 'PHP'
  const symbol = isUSD ? '$' : '₱'
  const stripePaymentMethod = String(paymentMethod).toUpperCase()

  let stripePmTypes: string[] = ['card']
  if (stripePaymentMethod === 'GCASH') {
    stripePmTypes = ['gcash']
  } else if (stripePaymentMethod === 'GRABPAY') {
    stripePmTypes = ['grabpay']
  } else if (stripePaymentMethod === 'MAYA') {
    stripePmTypes = ['card']
  }

  const paymentIntent = await createPaymentIntent({
    amount: depositAmount,
    currency: targetCurrency.toLowerCase(),
    paymentMethodTypes: stripePmTypes,
    description: `FitTrack e-Wallet Deposit: ${symbol}${depositAmount.toFixed(2)} via ${stripePaymentMethod}`,
    metadata: {
      userId,
      action: 'wallet_deposit',
      depositAmount: String(depositAmount),
      currency: targetCurrency,
      paymentMethod: stripePaymentMethod,
      phoneNumber: phoneNumber || '',
    },
  })

  const phReferenceNumber =
    stripePaymentMethod === 'GCASH'
      ? `GCASH-${Math.floor(10000000 + Math.random() * 90000000)}`
      : stripePaymentMethod === 'MAYA'
      ? `MAYA-${Math.floor(10000000 + Math.random() * 90000000)}`
      : undefined

  res.json({
    success: true,
    clientSecret: paymentIntent.clientSecret,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    referenceNumber: phReferenceNumber,
    paymentMethod: stripePaymentMethod,
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

  const { paymentIntentId, amount, currency = 'PHP', paymentMethod = 'GCASH' } = req.body
  const depositAmount = Number(amount)
  const isUSD = String(currency).toUpperCase() === 'USD'
  const targetCurrency = isUSD ? 'USD' : 'PHP'
  const symbol = isUSD ? '$' : '₱'

  const verified = await verifyPaymentIntent(paymentIntentId, depositAmount, targetCurrency)
  if (verified.status !== 'succeeded') {
    return res.status(400).json({ error: `Payment not verified (status: ${verified.status}).` })
  }

  const wallet = await getOrCreateUserWallet(userId, targetCurrency)

  const updatedWallet = await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: {
        increment: depositAmount,
      },
      currency: targetCurrency,
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
      currency: targetCurrency,
      status: 'COMPLETED',
      paymentMethod: String(paymentMethod).toUpperCase(),
      referenceId: paymentIntentId,
      description: `e-Wallet Top-up: +${symbol}${depositAmount.toFixed(2)} via ${paymentMethod}`,
    },
  })

  res.json({
    success: true,
    message: `Successfully topped up ${symbol}${depositAmount.toFixed(2)} to your e-wallet!`,
    balance: updatedWallet.balance,
    currency: updatedWallet.currency,
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

  const { tier, currency = 'PHP' } = req.body
  const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS]

  if (!plan) {
    return res.status(400).json({ error: 'Invalid subscription tier selected.' })
  }

  const pricing = getPlanPricing(tier, currency)
  if (pricing.price <= 0) {
    return res.status(400).json({ error: 'Invalid paid subscription tier.' })
  }

  const userWallet = await getOrCreateUserWallet(userId, pricing.currency)

  if (userWallet.balance < pricing.price) {
    return res.status(400).json({
      error: `Insufficient e-wallet balance (${pricing.symbol}${userWallet.balance.toFixed(2)}). Needed: ${pricing.symbol}${pricing.price.toFixed(2)}.`,
      balance: userWallet.balance,
      required: pricing.price,
      currency: pricing.currency,
    })
  }

  // Deduct from user wallet
  const updatedUserWallet = await prisma.wallet.update({
    where: { id: userWallet.id },
    data: {
      balance: {
        decrement: pricing.price,
      },
    },
  })

  // Credit platform master revenue wallet
  const platformWallet = await getOrCreatePlatformWallet()
  await prisma.wallet.update({
    where: { id: platformWallet.id },
    data: {
      balance: {
        increment: pricing.price,
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
      stripePaymentIntentId: `wallet_tx_${Date.now().toString(36)}`,
      amount: pricing.price,
      currency: pricing.currency,
      interval: plan.interval,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  })

  // Record transaction in ledger
  await prisma.walletTransaction.create({
    data: {
      walletId: platformWallet.id,
      userId,
      type: 'SUBSCRIPTION',
      amount: pricing.price,
      fee: 0.0,
      netAmount: pricing.price,
      currency: pricing.currency,
      status: 'COMPLETED',
      paymentMethod: 'E_WALLET',
      referenceId: `wallet_tx_${Date.now().toString(36)}`,
      description: `Subscription activated via e-Wallet: ${plan.name} (${pricing.symbol}${pricing.price})`,
    },
  })

  res.json({
    success: true,
    message: `Congratulations! ${plan.name} has been activated using your e-wallet balance.`,
    subscription: sub,
    remainingBalance: updatedUserWallet.balance,
    currency: pricing.currency,
    isPro: true,
    planInfo: { ...plan, price: pricing.price, currency: pricing.currency, symbol: pricing.symbol },
  })
})
