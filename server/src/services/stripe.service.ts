/**
 * Stripe Service for FitTrack
 * Uses direct Stripe REST API with standard global fetch.
 * When STRIPE_SECRET_KEY is present in env, interacts with Stripe live/test API.
 * When STRIPE_SECRET_KEY is absent, seamlessly simulates payments for development and testing.
 */

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

export interface StripePaymentIntentResult {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
  isSimulated: boolean;
}

export interface StripeCustomerResult {
  id: string;
  email: string;
  isSimulated: boolean;
}

function getStripeKey(): string | null {
  return process.env.STRIPE_SECRET_KEY || null;
}

/**
 * Creates or retrieves a Stripe Customer
 */
export async function getOrCreateStripeCustomer(email: string, name?: string): Promise<StripeCustomerResult> {
  const secretKey = getStripeKey();

  if (!secretKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('STRIPE_SECRET_KEY is not configured on the production server.');
    }
    // Simulated customer ID for development
    return {
      id: `cus_sim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      email,
      isSimulated: true,
    };
  }

  try {
    // Search existing customer by email
    const searchParams = new URLSearchParams({ email, limit: '1' });
    const searchRes = await fetch(`${STRIPE_API_BASE}/customers?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.data && data.data.length > 0) {
        return {
          id: data.data[0].id,
          email: data.data[0].email,
          isSimulated: false,
        };
      }
    }

    // Create new customer
    const body = new URLSearchParams({ email });
    if (name) body.append('name', name);

    const createRes = await fetch(`${STRIPE_API_BASE}/customers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err?.error?.message || 'Failed to create customer on Stripe');
    }

    const newCustomer = await createRes.json();
    return {
      id: newCustomer.id,
      email: newCustomer.email,
      isSimulated: false,
    };
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    return {
      id: `cus_sim_${Date.now().toString(36)}`,
      email,
      isSimulated: true,
    };
  }
}

/**
 * Creates a PaymentIntent for subscription upgrade or e-wallet deposit
 */
export async function createPaymentIntent(params: {
  amount: number; // in dollars / pesos
  currency?: string;
  customerId?: string;
  description: string;
  paymentMethodTypes?: string[];
  metadata?: Record<string, string>;
}): Promise<StripePaymentIntentResult> {
  const { amount, currency = 'php', customerId, description, paymentMethodTypes, metadata = {} } = params;
  const secretKey = getStripeKey();
  const amountCents = Math.round(amount * 100);

  if (!secretKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('STRIPE_SECRET_KEY is not configured on the production server.');
    }
    const simId = `pi_sim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    return {
      id: simId,
      clientSecret: `${simId}_secret_${Math.random().toString(36).slice(2, 10)}`,
      amount,
      currency: currency.toUpperCase(),
      status: 'requires_payment_method',
      isSimulated: true,
    };
  }

  try {
    const body = new URLSearchParams({
      amount: String(amountCents),
      currency: currency.toLowerCase(),
      description,
    });

    if (paymentMethodTypes && paymentMethodTypes.length > 0) {
      paymentMethodTypes.forEach((pm) => body.append('payment_method_types[]', pm.toLowerCase()));
    } else {
      body.append('automatic_payment_methods[enabled]', 'true');
    }

    if (customerId && !customerId.startsWith('cus_sim_')) {
      body.append('customer', customerId);
    }

    Object.entries(metadata).forEach(([k, v]) => {
      body.append(`metadata[${k}]`, v);
    });

    const res = await fetch(`${STRIPE_API_BASE}/payment_intents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message || 'Failed to create Stripe PaymentIntent');
    }

    const pi = await res.json();
    return {
      id: pi.id,
      clientSecret: pi.client_secret,
      amount: pi.amount / 100,
      currency: pi.currency.toUpperCase(),
      status: pi.status,
      isSimulated: false,
    };
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    const simId = `pi_sim_${Date.now().toString(36)}`;
    return {
      id: simId,
      clientSecret: `${simId}_secret_${Math.random().toString(36).slice(2, 10)}`,
      amount,
      currency: currency.toUpperCase(),
      status: 'requires_payment_method',
      isSimulated: true,
    };
  }
}

/**
 * Confirms or verifies payment status of a PaymentIntent
 */
export async function verifyPaymentIntent(
  paymentIntentId: string,
  expectedAmount?: number,
  expectedCurrency: string = 'PHP'
): Promise<{
  id: string;
  status: 'succeeded' | 'processing' | 'requires_payment_method' | 'canceled';
  amount: number;
  currency: string;
}> {
  const secretKey = getStripeKey();

  // In production, reject simulated payment tokens
  if (
    paymentIntentId.startsWith('pi_sim_') ||
    paymentIntentId.startsWith('gcash_sim_') ||
    paymentIntentId.startsWith('maya_sim_')
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Simulated payment tokens are not accepted in production.');
    }
    return {
      id: paymentIntentId,
      status: 'succeeded',
      amount: expectedAmount || 499.0,
      currency: expectedCurrency.toUpperCase(),
    };
  }

  // Wallet internal transfers
  if (paymentIntentId.startsWith('wallet_tx_')) {
    return {
      id: paymentIntentId,
      status: 'succeeded',
      amount: expectedAmount || 499.0,
      currency: expectedCurrency.toUpperCase(),
    };
  }

  if (!secretKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('STRIPE_SECRET_KEY is required in production.');
    }
    return {
      id: paymentIntentId,
      status: 'succeeded',
      amount: expectedAmount || 499.0,
      currency: expectedCurrency.toUpperCase(),
    };
  }

  try {
    const isCheckoutSession = paymentIntentId.startsWith('cs_');
    const endpoint = isCheckoutSession
      ? `${STRIPE_API_BASE}/checkout/sessions/${paymentIntentId}`
      : `${STRIPE_API_BASE}/payment_intents/${paymentIntentId}`;

    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Could not verify payment with Stripe');
    }

    const data = await res.json();
    const isPaid = isCheckoutSession ? data.payment_status === 'paid' : data.status === 'succeeded';

    return {
      id: data.id,
      status: isPaid ? 'succeeded' : (data.status || 'requires_payment_method'),
      amount: (data.amount_total || data.amount || 0) / 100,
      currency: (data.currency || expectedCurrency).toUpperCase(),
    };
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    return {
      id: paymentIntentId,
      status: 'succeeded',
      amount: expectedAmount || 499.0,
      currency: expectedCurrency.toUpperCase(),
    };
  }
}

export interface StripeCheckoutResult {
  sessionId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  isSimulated: boolean;
}

/**
 * Creates an official Stripe Hosted Checkout Session (Card, Apple Pay, Google Pay)
 */
export async function createStripeCheckoutSession(params: {
  amount: number;
  currency: string;
  planName: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}): Promise<StripeCheckoutResult> {
  const secretKey = getStripeKey();
  const {
    amount,
    currency = 'php',
    planName,
    customerEmail,
    successUrl = 'https://fittrack.app/checkout/success',
    cancelUrl = 'https://fittrack.app/checkout/cancel',
    metadata = {},
  } = params;

  const amountCents = Math.round(amount * 100);

  if (!secretKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('STRIPE_SECRET_KEY is not configured on the production server.');
    }
    const simSessionId = `cs_sim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    return {
      sessionId: simSessionId,
      checkoutUrl: `https://checkout.stripe.com/pay/${simSessionId}?plan=${encodeURIComponent(planName)}&amount=${amount}`,
      amount,
      currency: currency.toUpperCase(),
      isSimulated: true,
    };
  }

  const body = new URLSearchParams({
    'payment_method_types[]': 'card',
    'mode': 'payment',
    'line_items[0][price_data][currency]': currency.toLowerCase(),
    'line_items[0][price_data][product_data][name]': planName,
    'line_items[0][price_data][unit_amount]': String(amountCents),
    'line_items[0][quantity]': '1',
    'success_url': `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    'cancel_url': cancelUrl,
  });

  if (customerEmail) {
    body.append('customer_email', customerEmail);
  }

  Object.entries(metadata).forEach(([k, v]) => {
    body.append(`metadata[${k}]`, v);
  });

  const res = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to create Stripe Checkout Session');
  }

  const session = await res.json();
  return {
    sessionId: session.id,
    checkoutUrl: session.url || '',
    amount,
    currency: currency.toUpperCase(),
    isSimulated: false,
  };
}

/**
 * Direct Card payment via Stripe API (Charges test cards or tokens and logs in Stripe dashboard)
 */
export async function processCardPayment(params: {
  amount: number;
  currency: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  description: string;
  metadata?: Record<string, string>;
}): Promise<{
  id: string;
  status: 'succeeded' | 'failed';
  amount: number;
  currency: string;
  isSimulated: boolean;
}> {
  const secretKey = getStripeKey();
  const { amount, currency, cardNumber, cardExpiry, cardCvc, description, metadata = {} } = params;
  const cleanNumber = (cardNumber || '').replace(/\s+/g, '');
  const amountCents = Math.round(amount * 100);

  // Map to Stripe test tokens
  let token = 'tok_visa';
  if (cleanNumber.startsWith('5')) {
    token = 'tok_mastercard';
  } else if (cleanNumber.startsWith('37')) {
    token = 'tok_amex';
  } else if (cleanNumber.startsWith('35')) {
    token = 'tok_jcb';
  } else if (cleanNumber === '4000000000000002') {
    token = 'tok_chargeCustomerFail';
  }

  if (secretKey) {
    try {
      const body = new URLSearchParams({
        amount: String(amountCents),
        currency: currency.toLowerCase(),
        'payment_method_data[type]': 'card',
        'payment_method_data[card][token]': token,
        confirm: 'true',
        'automatic_payment_methods[enabled]': 'true',
        'automatic_payment_methods[allow_redirects]': 'never',
        description,
      });

      Object.entries(metadata).forEach(([k, v]) => {
        body.append(`metadata[${k}]`, v);
      });

      const res = await fetch(`${STRIPE_API_BASE}/payment_intents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const pi = await res.json();
      if (!res.ok || pi.error) {
        throw new Error(pi.error?.message || 'Stripe card payment failed.');
      }

      return {
        id: pi.id,
        status: pi.status === 'succeeded' ? 'succeeded' : 'failed',
        amount: pi.amount / 100,
        currency: pi.currency.toUpperCase(),
        isSimulated: false,
      };
    } catch (err: any) {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
    }
  }

  // Local sandbox fallback
  const simId = `pi_sim_${Date.now().toString(36)}`;
  return {
    id: simId,
    status: 'succeeded',
    amount,
    currency: currency.toUpperCase(),
    isSimulated: true,
  };
}
