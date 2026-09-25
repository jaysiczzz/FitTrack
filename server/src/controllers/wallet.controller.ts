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
import {
  createPaymentIntent,
  verifyPaymentIntent,
  createStripeCheckoutSession,
  processCardPayment,
} from '../services/stripe.service'
import { createPayMongoCheckoutSession, verifyPayMongoPayment } from '../services/paymongo.service'
import { convertCurrency, formatCurrencyString, USD_PHP_EXCHANGE_RATE } from '../utils/currency.utils'

/**
 * GET /api/wallet/me
 * Retrieves authenticated user's wallet balance and personal transaction ledger
 */
export const getUserWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const wallet = await getOrCreateUserWallet(userId, 'PHP')

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
    exchangeRate: {
      USD_PHP: USD_PHP_EXCHANGE_RATE,
      note: `1 USD = ₱${USD_PHP_EXCHANGE_RATE.toFixed(2)} PHP`,
    },
    transactions,
  })
})

/**
 * POST /api/wallet/deposit/initiate
 * Creates a PayMongo Checkout Session (GCash/Maya) or Stripe Checkout Session (Card)
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
  const selectedMethod = String(paymentMethod).toUpperCase() as 'GCASH' | 'MAYA' | 'CARD' | 'GRABPAY'

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, lastName: true },
  })

  // 1. GCash & Maya via PayMongo Official Checkout
  if (selectedMethod === 'GCASH' || selectedMethod === 'MAYA' || selectedMethod === 'GRABPAY') {
    const { convertedAmount: phpAmount } = convertCurrency(depositAmount, targetCurrency, 'PHP')
    const paymongoSession = await createPayMongoCheckoutSession({
      amount: phpAmount,
      description: `FitTrack e-Wallet Deposit: ₱${phpAmount.toFixed(2)} via ${selectedMethod}`,
      paymentMethod: selectedMethod,
      customerEmail: user?.email,
      customerName: user ? `${user.firstName} ${user.lastName}` : undefined,
      customerPhone: phoneNumber,
      metadata: {
        userId,
        action: 'wallet_deposit',
        depositAmount: String(depositAmount),
        currency: targetCurrency,
      },
    })

    return res.json({
      success: true,
      checkoutUrl: paymongoSession.checkoutUrl,
      paymentIntentId: paymongoSession.id,
      amount: paymongoSession.amount,
      currency: 'PHP',
      referenceNumber: paymongoSession.referenceNumber,
      paymentMethod: selectedMethod,
      isSimulated: paymongoSession.isSimulated,
    })
  }

  // 2. Card via Stripe Direct API or Hosted Checkout
  const { cardNumber, cardExpiry, cardCvc } = req.body
  if (cardNumber && cardExpiry && cardCvc) {
    const cardResult = await processCardPayment({
      amount: depositAmount,
      currency: targetCurrency,
      cardNumber,
      cardExpiry,
      cardCvc,
      description: `FitTrack e-Wallet Deposit: ${formatCurrencyString(depositAmount, targetCurrency)}`,
      metadata: {
        userId,
        action: 'wallet_deposit',
      },
    })

    return res.json({
      success: true,
      paymentIntentId: cardResult.id,
      amount: depositAmount,
      currency: targetCurrency,
      paymentMethod: 'CARD',
      isSimulated: cardResult.isSimulated,
    })
  }

  const stripeSession = await createStripeCheckoutSession({
    amount: depositAmount,
    currency: targetCurrency,
    planName: `FitTrack e-Wallet Deposit (${formatCurrencyString(depositAmount, targetCurrency)})`,
    customerEmail: user?.email,
    metadata: {
      userId,
      action: 'wallet_deposit',
      depositAmount: String(depositAmount),
      currency: targetCurrency,
      paymentMethod: 'CARD',
    },
  })

  return res.json({
    success: true,
    checkoutUrl: stripeSession.checkoutUrl,
    paymentIntentId: stripeSession.sessionId,
    amount: depositAmount,
    currency: targetCurrency,
    paymentMethod: 'CARD',
    isSimulated: stripeSession.isSimulated,
  })
})

/**
 * POST /api/wallet/deposit/confirm
 * Confirms payment intent and credits user's e-wallet with realistic FX conversion
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
  const selectedMethod = String(paymentMethod).toUpperCase()

  // Verify via PayMongo or Stripe
  if (paymentIntentId.startsWith('cs_pm_') || selectedMethod === 'GCASH' || selectedMethod === 'MAYA') {
    const verified = await verifyPayMongoPayment(paymentIntentId)
    if (!verified.paid && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ error: 'PayMongo payment has not been confirmed yet.' })
    }
  } else {
    const verified = await verifyPaymentIntent(paymentIntentId, depositAmount, targetCurrency)
    if (verified.status !== 'succeeded' && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ error: `Payment not verified (status: ${verified.status}).` })
    }
  }

  // Fetch or create user wallet (standardized in PHP)
  const wallet = await getOrCreateUserWallet(userId, 'PHP')

  // Convert foreign deposits to the wallet's native currency (e.g. 100 USD -> 5,800.00 PHP)
  const { convertedAmount: creditedAmount } = convertCurrency(depositAmount, targetCurrency, wallet.currency)

  // Atomically increment wallet balance and record ledger transaction
  const [updatedWallet, transaction] = await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: creditedAmount,
        },
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: 'DEPOSIT',
        amount: creditedAmount,
        fee: 0.0,
        netAmount: creditedAmount,
        currency: wallet.currency,
        status: 'COMPLETED',
        paymentMethod: selectedMethod,
        referenceId: paymentIntentId,
        description:
          targetCurrency === wallet.currency
            ? `e-Wallet Top-up: +${formatCurrencyString(depositAmount, targetCurrency)} via ${selectedMethod}`
            : `e-Wallet Top-up: +${formatCurrencyString(depositAmount, targetCurrency)} (Credited ${formatCurrencyString(creditedAmount, wallet.currency)} at 1 USD = ₱${USD_PHP_EXCHANGE_RATE}) via ${selectedMethod}`,
      },
    }),
  ])

  res.json({
    success: true,
    message: `Successfully credited ${formatCurrencyString(creditedAmount, wallet.currency)} to your e-wallet!`,
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

  // Ensure platform wallet exists before transaction
  const platformWallet = await getOrCreatePlatformWallet()
  const userWallet = await getOrCreateUserWallet(userId, 'PHP')

  // Calculate required amount in user's wallet currency (e.g. $9.99 converts to ₱579.42 PHP)
  const { convertedAmount: requiredWalletBalance } = convertCurrency(pricing.price, pricing.currency, userWallet.currency)

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

  try {
    const result = await prisma.$transaction(async (tx) => {
      const liveUserWallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!liveUserWallet || liveUserWallet.balance < requiredWalletBalance) {
        throw new Error(
          `INSUFFICIENT_BALANCE:${formatCurrencyString(liveUserWallet?.balance || 0, userWallet.currency)}:${formatCurrencyString(requiredWalletBalance, userWallet.currency)}`
        )
      }

      // Convert debit to platform currency
      const { convertedAmount: platformCreditAmount } = convertCurrency(requiredWalletBalance, userWallet.currency, platformWallet.currency)

      // 1. Deduct from user wallet
      const updatedUserWallet = await tx.wallet.update({
        where: { id: liveUserWallet.id },
        data: {
          balance: {
            decrement: requiredWalletBalance,
          },
        },
      })

      // 2. Credit platform master revenue wallet
      await tx.wallet.update({
        where: { id: platformWallet.id },
        data: {
          balance: {
            increment: platformCreditAmount,
          },
        },
      })

      const referenceId = `wallet_tx_${Date.now().toString(36)}`

      // 3. Upsert subscription
      const sub = await tx.subscription.upsert({
        where: { userId },
        update: {
          tier: plan.tier,
          status: SubscriptionStatus.ACTIVE,
          stripePaymentIntentId: referenceId,
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
          stripePaymentIntentId: referenceId,
          amount: pricing.price,
          currency: pricing.currency,
          interval: plan.interval,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      })

      // 4. Record user-side debit in personal ledger
      await tx.walletTransaction.create({
        data: {
          walletId: liveUserWallet.id,
          userId,
          type: 'SUBSCRIPTION',
          amount: -requiredWalletBalance,
          fee: 0.0,
          netAmount: -requiredWalletBalance,
          currency: userWallet.currency,
          status: 'COMPLETED',
          paymentMethod: 'E_WALLET',
          referenceId,
          description: `Subscription paid via e-wallet: ${plan.name} (${formatCurrencyString(requiredWalletBalance, userWallet.currency)})`,
        },
      })

      // 5. Record platform master revenue credit in platform ledger
      await tx.walletTransaction.create({
        data: {
          walletId: platformWallet.id,
          userId,
          type: 'SUBSCRIPTION',
          amount: platformCreditAmount,
          fee: 0.0,
          netAmount: platformCreditAmount,
          currency: platformWallet.currency,
          status: 'COMPLETED',
          paymentMethod: 'E_WALLET',
          referenceId,
          description: `Subscription activated via e-Wallet: ${plan.name} (${formatCurrencyString(platformCreditAmount, platformWallet.currency)})`,
        },
      })

      return { sub, updatedUserWallet }
    })

    res.json({
      success: true,
      message: `Congratulations! ${plan.name} has been activated using your e-wallet balance.`,
      subscription: result.sub,
      remainingBalance: result.updatedUserWallet.balance,
      currency: result.updatedUserWallet.currency,
      isPro: true,
      planInfo: { ...plan, price: pricing.price, currency: pricing.currency, symbol: pricing.symbol },
    })
  } catch (err: any) {
    if (err?.message?.startsWith('INSUFFICIENT_BALANCE:')) {
      const [, current, required] = err.message.split(':')
      return res.status(400).json({
        error: `Insufficient e-wallet balance (${current}). Required: ${required}.`,
        currency: userWallet.currency,
      })
    }
    throw err
  }
})
