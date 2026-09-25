/**
 * FitTrack Currency Conversion & FX Utilities
 * Standardizes multi-currency conversion between Philippine Peso (PHP) and US Dollar (USD)
 */

export const USD_PHP_EXCHANGE_RATE = 58.0; // 1 USD = 58.00 PHP

export interface CurrencyConversionResult {
  originalAmount: number;
  convertedAmount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
}

/**
 * Converts an amount from one currency to another using the standard FX rate
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): CurrencyConversionResult {
  const from = (fromCurrency || 'PHP').toUpperCase();
  const to = (toCurrency || 'PHP').toUpperCase();
  const cleanAmount = Number(amount) || 0;

  if (from === to) {
    return {
      originalAmount: cleanAmount,
      convertedAmount: cleanAmount,
      fromCurrency: from,
      toCurrency: to,
      exchangeRate: 1.0,
    };
  }

  // USD -> PHP: 1 USD = 58 PHP
  if (from === 'USD' && to === 'PHP') {
    const converted = Number((cleanAmount * USD_PHP_EXCHANGE_RATE).toFixed(2));
    return {
      originalAmount: cleanAmount,
      convertedAmount: converted,
      fromCurrency: from,
      toCurrency: to,
      exchangeRate: USD_PHP_EXCHANGE_RATE,
    };
  }

  // PHP -> USD: 58 PHP = 1 USD
  if (from === 'PHP' && to === 'USD') {
    const converted = Number((cleanAmount / USD_PHP_EXCHANGE_RATE).toFixed(2));
    return {
      originalAmount: cleanAmount,
      convertedAmount: converted,
      fromCurrency: from,
      toCurrency: to,
      exchangeRate: Number((1 / USD_PHP_EXCHANGE_RATE).toFixed(4)),
    };
  }

  return {
    originalAmount: cleanAmount,
    convertedAmount: cleanAmount,
    fromCurrency: from,
    toCurrency: to,
    exchangeRate: 1.0,
  };
}

/**
 * Formats amount with proper symbol and decimal precision
 */
export function formatCurrencyString(amount: number, currency: string = 'PHP'): string {
  const isUSD = currency.toUpperCase() === 'USD';
  const symbol = isUSD ? '$' : '₱';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
