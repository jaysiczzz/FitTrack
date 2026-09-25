/**
 * Payment Input Formatting and Validation Utilities
 * Provides formatting as users type and validation for:
 * - Philippine Mobile Numbers (GCash & Maya)
 * - Credit / Debit Cards (Stripe: Card Number, Expiry MM/YY, CVC)
 * - e-Wallet Top-up Amounts
 */

// -------------------------------------------------------------
// 1. Philippine Mobile Phone Number (GCash & Maya)
// -------------------------------------------------------------

/**
 * Formats a phone number in real-time as '09XX XXX XXXX'
 * Handles:
 * - "+639171234567" -> "0917 123 4567"
 * - "639171234567"  -> "0917 123 4567"
 * - "9171234567"    -> "0917 123 4567"
 * - "09171234567"   -> "0917 123 4567"
 */
export function formatPhilippinePhone(raw: string): string {
  if (!raw) return '';

  // Extract only digits
  let digits = raw.replace(/\D/g, '');

  // Strip country code if pasted with +63 or 63
  if (digits.startsWith('63') && digits.length > 2) {
    digits = '0' + digits.slice(2);
  } else if (digits.startsWith('9') && digits.length <= 10) {
    digits = '0' + digits;
  }

  // Maximum 11 digits for PH mobile (e.g., 0917 123 4567)
  digits = digits.slice(0, 11);

  // Group into '09XX XXX XXXX'
  if (digits.length <= 4) {
    return digits;
  }
  if (digits.length <= 7) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  }
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

export function validatePhilippinePhone(formattedOrRaw: string): { valid: boolean; error?: string } {
  const digits = (formattedOrRaw || '').replace(/\D/g, '');

  if (!digits) {
    return { valid: false, error: 'Mobile number is required.' };
  }

  if (digits.length < 11) {
    return {
      valid: false,
      error: `Phone number is incomplete (${digits.length}/11 digits). Enter an 11-digit number like 0917 123 4567.`,
    };
  }

  if (digits.length > 11) {
    return {
      valid: false,
      error: 'Phone number cannot exceed 11 digits.',
    };
  }

  if (!digits.startsWith('09')) {
    return {
      valid: false,
      error: "Philippine mobile numbers must start with '09' (e.g., 0917 123 4567).",
    };
  }

  return { valid: true };
}

// -------------------------------------------------------------
// 2. Credit / Debit Card Number (Stripe)
// -------------------------------------------------------------

export type CardBrandType = 'visa' | 'mastercard' | 'amex' | 'jcb' | 'discover' | 'generic';

export function detectCardBrand(digits: string): CardBrandType {
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^35/.test(digits)) return 'jcb';
  if (/^6(?:011|5)/.test(digits)) return 'discover';
  return 'generic';
}

/**
 * Formats a card number into 4-digit chunks 'XXXX XXXX XXXX XXXX' (max 16 digits, 19 chars)
 */
export function formatCardNumber(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
}

/**
 * Standard Luhn Algorithm check for card validity
 */
function checkLuhn(digits: string): boolean {
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

export function validateCardNumber(formattedOrRaw: string): {
  valid: boolean;
  brand: CardBrandType;
  error?: string;
} {
  const digits = (formattedOrRaw || '').replace(/\D/g, '');
  const brand = detectCardBrand(digits);

  if (!digits) {
    return { valid: false, brand, error: 'Card number is required.' };
  }

  if (digits.length < 15) {
    return {
      valid: false,
      brand,
      error: `Card number must be 16 digits (${digits.length}/16 entered).`,
    };
  }

  if (digits.length > 16) {
    return {
      valid: false,
      brand,
      error: 'Card number cannot exceed 16 digits.',
    };
  }

  // Allow standard Stripe test cards directly (or pass Luhn)
  const isStripeTestCard =
    digits === '4242424242424242' ||
    digits === '5555555555554444' ||
    digits === '4000000000000002';

  if (!isStripeTestCard && !checkLuhn(digits)) {
    return {
      valid: false,
      brand,
      error: 'Invalid card number. Please check for mistyped digits.',
    };
  }

  return { valid: true, brand };
}

// -------------------------------------------------------------
// 3. Card Expiry Date (MM/YY)
// -------------------------------------------------------------

/**
 * Formats expiry input to MM/YY in real-time
 * - Types '3' -> '03/'
 * - Types '12' -> '12/'
 * - Types '1228' -> '12/28'
 * - Max length: 5 chars ('MM/YY')
 */
export function formatCardExpiry(raw: string): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '').slice(0, 4);

  // If user enters single digit 2-9, auto-pad with 0
  if (digits.length === 1 && parseInt(digits, 10) >= 2) {
    return `0${digits}/`;
  }

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function validateCardExpiry(formattedOrRaw: string): { valid: boolean; error?: string } {
  const digits = (formattedOrRaw || '').replace(/\D/g, '');

  if (!digits) {
    return { valid: false, error: 'Card expiry date is required (MM/YY).' };
  }

  if (digits.length < 4) {
    return { valid: false, error: 'Enter a complete expiry date in MM/YY format (e.g. 12/28).' };
  }

  const month = parseInt(digits.slice(0, 2), 10);
  const yearSuffix = parseInt(digits.slice(2, 4), 10);
  const fullYear = 2000 + yearSuffix;

  if (month < 1 || month > 12) {
    return { valid: false, error: 'Invalid month (must be between 01 and 12).' };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
    return { valid: false, error: 'This card has already expired.' };
  }

  if (fullYear > currentYear + 20) {
    return { valid: false, error: 'Invalid expiry year (too far in the future).' };
  }

  return { valid: true };
}

// -------------------------------------------------------------
// 4. Card CVC (3 or 4 digits)
// -------------------------------------------------------------

/**
 * Formats CVC input: numbers only, max 4 digits
 */
export function formatCardCvc(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '').slice(0, 4);
}

export function validateCardCvc(raw: string): { valid: boolean; error?: string } {
  const digits = (raw || '').replace(/\D/g, '');

  if (!digits) {
    return { valid: false, error: 'Card CVC security code is required.' };
  }

  if (digits.length < 3 || digits.length > 4) {
    return { valid: false, error: 'CVC must be 3 or 4 digits.' };
  }

  return { valid: true };
}

// -------------------------------------------------------------
// 5. e-Wallet Top-up Amount
// -------------------------------------------------------------

/**
 * Cleans deposit amount input: positive numbers with up to 2 decimal places
 */
export function formatTopUpAmount(raw: string): string {
  if (!raw) return '';
  // Keep only numbers and first decimal point
  let cleaned = raw.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
  }
  // Max 2 decimal digits
  const decIndex = cleaned.indexOf('.');
  if (decIndex !== -1) {
    cleaned = cleaned.slice(0, decIndex + 3);
  }
  return cleaned;
}

export function validateTopUpAmount(
  amountStr: string,
  currency: 'PHP' | 'USD'
): { valid: boolean; amount: number; error?: string } {
  const numeric = parseFloat(amountStr);

  if (isNaN(numeric) || numeric <= 0) {
    return { valid: false, amount: 0, error: 'Please enter a valid deposit amount greater than 0.' };
  }

  const min = currency === 'PHP' ? 50 : 1;
  const max = currency === 'PHP' ? 100000 : 2000;
  const sym = currency === 'PHP' ? '₱' : '$';

  if (numeric < min) {
    return {
      valid: false,
      amount: numeric,
      error: `Minimum deposit amount is ${sym}${min.toLocaleString()} ${currency}.`,
    };
  }

  if (numeric > max) {
    return {
      valid: false,
      amount: numeric,
      error: `Maximum single deposit limit is ${sym}${max.toLocaleString()} ${currency}.`,
    };
  }

  return { valid: true, amount: numeric };
}
