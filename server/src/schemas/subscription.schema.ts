import { z } from 'zod'

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    tier: z.enum(['PRO_MONTHLY', 'PRO_ANNUAL', 'LIFETIME_FOUNDER'], {
      message: 'Invalid subscription tier selected',
    }),
    paymentMethod: z
      .enum(['STRIPE', 'CARD', 'GCASH', 'GRABPAY', 'MAYA', 'E_WALLET'])
      .optional()
      .default('CARD'),
    currency: z.enum(['USD', 'PHP', 'usd', 'php']).optional().default('PHP'),
    phoneNumber: z.string().optional(),
    cardNumber: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvc: z.string().optional(),
  }),
})

export const confirmSubscriptionSchema = z.object({
  body: z.object({
    tier: z.enum(['PRO_MONTHLY', 'PRO_ANNUAL', 'LIFETIME_FOUNDER'], {
      message: 'Invalid subscription tier',
    }),
    paymentIntentId: z.string().min(1, 'PaymentIntent ID is required'),
    currency: z.enum(['USD', 'PHP', 'usd', 'php']).optional().default('PHP'),
    paymentMethod: z.string().optional().default('CARD'),
  }),
})

export const depositWalletSchema = z.object({
  body: z.object({
    amount: z.coerce
      .number({ message: 'Deposit amount must be a number' })
      .positive('Deposit amount must be greater than 0')
      .max(100000, 'Maximum single deposit limit reached'),
    currency: z.enum(['USD', 'PHP', 'usd', 'php']).optional().default('PHP'),
    paymentMethod: z.string().optional().default('GCASH'),
    phoneNumber: z.string().optional(),
    cardNumber: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvc: z.string().optional(),
  }),
})

export const confirmDepositSchema = z.object({
  body: z.object({
    paymentIntentId: z.string().min(1, 'PaymentIntent ID is required'),
    amount: z.coerce
      .number({ message: 'Deposit amount must be a number' })
      .positive('Deposit amount must be greater than 0'),
    currency: z.enum(['USD', 'PHP', 'usd', 'php']).optional().default('PHP'),
    paymentMethod: z.string().optional().default('GCASH'),
  }),
})

export const walletPaySchema = z.object({
  body: z.object({
    tier: z.enum(['PRO_MONTHLY', 'PRO_ANNUAL', 'LIFETIME_FOUNDER'], {
      message: 'Invalid subscription tier',
    }),
    currency: z.enum(['USD', 'PHP', 'usd', 'php']).optional().default('PHP'),
  }),
})

export const adminPayoutSchema = z.object({
  body: z.object({
    amount: z
      .number({ message: 'Payout amount must be a number' })
      .positive('Payout amount must be greater than 0'),
    destination: z.string().min(2, 'Payout destination or bank account details required'),
    notes: z.string().max(200).optional(),
  }),
})

export const adminOverrideSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    tier: z.enum(['FREE', 'PRO_MONTHLY', 'PRO_ANNUAL', 'LIFETIME_FOUNDER']),
    status: z.enum(['ACTIVE', 'CANCELED', 'EXPIRED', 'PAST_DUE']).default('ACTIVE'),
    durationMonths: z.number().int().positive().optional(),
  }),
})

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>['body']
export type ConfirmSubscriptionInput = z.infer<typeof confirmSubscriptionSchema>['body']
export type DepositWalletInput = z.infer<typeof depositWalletSchema>['body']
export type WalletPayInput = z.infer<typeof walletPaySchema>['body']
export type AdminPayoutInput = z.infer<typeof adminPayoutSchema>['body']
export type AdminOverrideInput = z.infer<typeof adminOverrideSchema>['body']
