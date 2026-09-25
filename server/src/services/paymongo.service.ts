/**
 * PayMongo Payment Service for FitTrack (Philippines e-Wallets)
 * Connects directly to PayMongo REST API to support:
 * - GCash (Instant Philippine mobile wallet transfer)
 * - Maya / PayMaya (Philippine digital bank & e-wallet)
 * - GrabPay PH & Philippine Visa/Mastercard debit cards
 * 
 * Works in both Test Mode (Free sandbox) and Live Production Mode.
 */

const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1';

export interface PayMongoCheckoutResult {
  id: string;
  checkoutUrl: string;
  referenceNumber: string;
  amount: number;
  currency: string;
  status: string;
  isSimulated: boolean;
}

function getPayMongoKey(): string | null {
  return process.env.PAYMONGO_SECRET_KEY || null;
}

/**
 * Creates a PayMongo Checkout Session for GCash, Maya, or Philippine Cards
 */
export async function createPayMongoCheckoutSession(params: {
  amount: number; // in PHP
  description: string;
  paymentMethod: 'GCASH' | 'MAYA' | 'CARD' | 'GRABPAY';
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, string>;
}): Promise<PayMongoCheckoutResult> {
  const {
    amount,
    description,
    paymentMethod,
    customerEmail,
    customerName,
    customerPhone,
    metadata = {},
  } = params;

  const secretKey = getPayMongoKey();
  const amountCentavos = Math.round(amount * 100); // PayMongo takes amounts in centavos (₱1 = 100)
  const refNumber = `${paymentMethod}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Map FitTrack payment method to PayMongo payment method types
  let paymentMethodTypes: string[] = ['gcash', 'paymaya', 'card'];
  if (paymentMethod === 'GCASH') {
    paymentMethodTypes = ['gcash'];
  } else if (paymentMethod === 'MAYA') {
    paymentMethodTypes = ['paymaya'];
  } else if (paymentMethod === 'GRABPAY') {
    paymentMethodTypes = ['grab_pay'];
  } else if (paymentMethod === 'CARD') {
    paymentMethodTypes = ['card'];
  }

  // If PAYMONGO_SECRET_KEY is configured, call official PayMongo API
  if (secretKey) {
    try {
      const authHeader = `Basic ${Buffer.from(secretKey + ':').toString('base64')}`;

      const payload = {
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            description,
            payment_method_types: paymentMethodTypes,
            reference_number: refNumber,
            line_items: [
              {
                name: description,
                amount: amountCentavos,
                currency: 'PHP',
                quantity: 1,
              },
            ],
            metadata: {
              ...metadata,
              referenceNumber: refNumber,
              paymentMethod,
            },
          },
        },
      };

      const response = await fetch(`${PAYMONGO_API_BASE}/checkout_sessions`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const json = await response.json();
        const attr = json.data.attributes;
        return {
          id: json.data.id,
          checkoutUrl: attr.checkout_url,
          referenceNumber: refNumber,
          amount,
          currency: 'PHP',
          status: attr.status || 'active',
          isSimulated: false,
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        // If production, surface the error
        if (process.env.NODE_ENV === 'production') {
          throw new Error(
            `PayMongo Error: ${errorData.errors?.[0]?.detail || response.statusText}`
          );
        }
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
    }
  }

  // Development/Test Mode Fallback:
  // Provides a simulated checkout URL so the app workflow functions smoothly even before keys are pasted in
  const simId = `cs_pm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    id: simId,
    checkoutUrl: `https://test-checkout.paymongo.com/pay/${simId}?method=${paymentMethod.toLowerCase()}&amount=${amount}`,
    referenceNumber: refNumber,
    amount,
    currency: 'PHP',
    status: 'active',
    isSimulated: true,
  };
}

/**
 * Verifies PayMongo Checkout Session or Payment status
 */
export async function verifyPayMongoPayment(checkoutSessionId: string): Promise<{
  paid: boolean;
  status: string;
  amount: number;
}> {
  const secretKey = getPayMongoKey();

  if (!secretKey || checkoutSessionId.startsWith('cs_pm_')) {
    // Simulated sandbox auto-success for development
    return {
      paid: true,
      status: 'paid',
      amount: 0,
    };
  }

  try {
    const authHeader = `Basic ${Buffer.from(secretKey + ':').toString('base64')}`;
    const response = await fetch(`${PAYMONGO_API_BASE}/checkout_sessions/${checkoutSessionId}`, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const json = await response.json();
      const status = json.data.attributes.status;
      const payments = json.data.attributes.payments || [];
      const isPaid = status === 'paid' || (payments.length > 0 && payments[0].attributes.status === 'paid');
      const amount = payments[0]?.attributes?.amount ? payments[0].attributes.amount / 100 : 0;
      return {
        paid: isPaid,
        status,
        amount,
      };
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
  }

  return {
    paid: false,
    status: 'pending',
    amount: 0,
  };
}
