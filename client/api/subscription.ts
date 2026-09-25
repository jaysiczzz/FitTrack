import { apiRequest } from './client';

export type SubscriptionTierType = 'FREE' | 'PRO_MONTHLY' | 'PRO_ANNUAL' | 'LIFETIME_FOUNDER';
export type SubscriptionStatusType = 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAST_DUE';

export type CurrencyType = 'PHP' | 'USD';
export type PaymentMethodType = 'CARD' | 'GCASH' | 'GRABPAY' | 'MAYA' | 'E_WALLET' | 'STRIPE';

export interface SubscriptionPlanItem {
  id: string;
  tier: SubscriptionTierType;
  name: string;
  badge: string;
  price: number;
  priceUSD?: number;
  pricePHP?: number;
  currency: string;
  symbol?: string;
  interval: 'month' | 'year' | 'lifetime' | null;
  features: string[];
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTierType;
  status: SubscriptionStatusType;
  stripePaymentIntentId?: string | null;
  amount: number;
  currency: string;
  interval?: string | null;
  currentPeriodStart: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentSubscriptionResponse {
  success: boolean;
  subscription: UserSubscription;
  isPro: boolean;
  planInfo: SubscriptionPlanItem;
  daysRemaining: number | null;
}

export interface WalletTransactionItem {
  id: string;
  walletId: string;
  userId?: string | null;
  type: 'SUBSCRIPTION' | 'DEPOSIT' | 'PAYOUT' | 'REFUND' | 'CREDIT';
  amount: number;
  currency: string;
  fee: number;
  netAmount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  referenceId?: string | null;
  description: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface UserWalletResponse {
  success: boolean;
  wallet: {
    id: string;
    balance: number;
    currency: string;
  };
  transactions: WalletTransactionItem[];
}

export interface AdminRevenueMetrics {
  platformWalletBalance: number;
  grossRevenue: number;
  stripeFees: number;
  netRevenue: number;
  mrr: number;
  arr: number;
  totalPayouts: number;
  totalUsersCount: number;
  freeUsersCount: number;
  totalActivePayingSubscribers: number;
  activeMonthlyCount: number;
  activeAnnualCount: number;
  activeLifetimeCount: number;
  churnRate: number;
}

export interface AdminRevenueResponse {
  success: boolean;
  platformWallet?: {
    balance: number;
    currency: string;
  };
  metrics: AdminRevenueMetrics;
  tierBreakdown: {
    free: number;
    proMonthly: number;
    proAnnual: number;
    lifetime: number;
  };
  transactions: WalletTransactionItem[];
  subscribers: Array<
    UserSubscription & {
      user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        createdAt: string;
      };
    }
  >;
}

// 1. Subscription endpoints
export const getSubscriptionPlansApi = (
  currency: CurrencyType = 'PHP'
): Promise<{ success: boolean; currency: string; symbol: string; plans: SubscriptionPlanItem[] }> =>
  apiRequest(`/api/subscriptions/plans?currency=${currency}`);

export const getCurrentSubscriptionApi = (): Promise<CurrentSubscriptionResponse> =>
  apiRequest('/api/subscriptions/me');

export const createCheckoutSessionApi = (
  tier: SubscriptionTierType,
  paymentMethod: PaymentMethodType = 'CARD',
  currency: CurrencyType = 'PHP',
  phoneNumber?: string,
  cardDetails?: {
    cardNumber?: string;
    cardExpiry?: string;
    cardCvc?: string;
  }
): Promise<{
  success: boolean;
  paymentMethod: string;
  plan: SubscriptionPlanItem;
  clientSecret?: string;
  paymentIntentId?: string;
  checkoutUrl?: string;
  amount?: number;
  currency?: string;
  referenceNumber?: string;
  isSimulated?: boolean;
  canPayImmediately?: boolean;
}> =>
  apiRequest('/api/subscriptions/checkout', {
    method: 'POST',
    body: {
      tier,
      paymentMethod,
      currency,
      phoneNumber,
      cardNumber: cardDetails?.cardNumber,
      cardExpiry: cardDetails?.cardExpiry,
      cardCvc: cardDetails?.cardCvc,
    },
  });

export const confirmSubscriptionApi = (
  tier: SubscriptionTierType,
  paymentIntentId: string,
  currency: CurrencyType = 'PHP',
  paymentMethod: PaymentMethodType = 'CARD'
): Promise<{
  success: boolean;
  message: string;
  subscription: UserSubscription;
  isPro: boolean;
  planInfo: SubscriptionPlanItem;
}> =>
  apiRequest('/api/subscriptions/confirm', {
    method: 'POST',
    body: { tier, paymentIntentId, currency, paymentMethod },
  });

export const cancelSubscriptionApi = (): Promise<{
  success: boolean;
  message: string;
  subscription: UserSubscription;
}> =>
  apiRequest('/api/subscriptions/cancel', {
    method: 'POST',
  });

export const reactivateSubscriptionApi = (): Promise<{
  success: boolean;
  message: string;
  subscription: UserSubscription;
}> =>
  apiRequest('/api/subscriptions/reactivate', {
    method: 'POST',
  });

// 2. e-Wallet endpoints
export const getUserWalletApi = (): Promise<UserWalletResponse> =>
  apiRequest('/api/wallet/me');

export const initiateWalletDepositApi = (
  amount: number,
  currency: CurrencyType = 'PHP',
  paymentMethod: PaymentMethodType = 'GCASH',
  phoneNumber?: string,
  cardDetails?: {
    cardNumber?: string;
    cardExpiry?: string;
    cardCvc?: string;
  }
): Promise<{
  success: boolean;
  clientSecret?: string;
  paymentIntentId: string;
  checkoutUrl?: string;
  amount: number;
  currency: string;
  referenceNumber?: string;
  paymentMethod: string;
  isSimulated: boolean;
}> =>
  apiRequest('/api/wallet/deposit/initiate', {
    method: 'POST',
    body: {
      amount,
      currency,
      paymentMethod,
      phoneNumber,
      cardNumber: cardDetails?.cardNumber,
      cardExpiry: cardDetails?.cardExpiry,
      cardCvc: cardDetails?.cardCvc,
    },
  });

export const confirmWalletDepositApi = (
  paymentIntentId: string,
  amount: number,
  currency: CurrencyType = 'PHP',
  paymentMethod: PaymentMethodType = 'GCASH'
): Promise<{
  success: boolean;
  message: string;
  balance: number;
  currency: string;
  transaction: WalletTransactionItem;
}> =>
  apiRequest('/api/wallet/deposit/confirm', {
    method: 'POST',
    body: { paymentIntentId, amount, currency, paymentMethod },
  });

export const paySubscriptionWithWalletApi = (
  tier: SubscriptionTierType,
  currency: CurrencyType = 'PHP'
): Promise<{
  success: boolean;
  message: string;
  subscription: UserSubscription;
  remainingBalance: number;
  currency: string;
  isPro: boolean;
  planInfo: SubscriptionPlanItem;
}> =>
  apiRequest('/api/wallet/pay-subscription', {
    method: 'POST',
    body: { tier, currency },
  });

// 3. Admin Revenue endpoints
export const getAdminRevenueOverviewApi = (): Promise<AdminRevenueResponse> =>
  apiRequest('/api/admin/revenue/overview');

export const processAdminPayoutApi = (
  amount: number,
  destination: string,
  notes?: string
): Promise<{
  success: boolean;
  message: string;
  newBalance: number;
  transaction: WalletTransactionItem;
}> =>
  apiRequest('/api/admin/revenue/payout', {
    method: 'POST',
    body: { amount, destination, notes },
  });

export const adminOverrideSubscriptionApi = (
  userId: string,
  tier: SubscriptionTierType,
  status: SubscriptionStatusType = 'ACTIVE',
  durationMonths: number = 1
): Promise<{
  success: boolean;
  message: string;
  subscription: UserSubscription;
}> =>
  apiRequest('/api/admin/revenue/override-subscription', {
    method: 'PUT',
    body: { userId, tier, status, durationMonths },
  });
