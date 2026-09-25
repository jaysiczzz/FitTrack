/**
 * Client Currency Conversion Utilities
 * Handles FX rates between PHP and USD across FitTrack
 */

export const USD_PHP_EXCHANGE_RATE = 58.0; // 1 USD = 58.00 PHP

export type AppCurrency = 'PHP' | 'USD';

export function convertCurrency(
  amount: number,
  from: AppCurrency,
  to: AppCurrency
): number {
  if (from === to) return amount;
  if (from === 'USD' && to === 'PHP') {
    return Number((amount * USD_PHP_EXCHANGE_RATE).toFixed(2));
  }
  if (from === 'PHP' && to === 'USD') {
    return Number((amount / USD_PHP_EXCHANGE_RATE).toFixed(2));
  }
  return amount;
}

export function formatCurrency(amount: number, currency: AppCurrency = 'PHP'): string {
  const symbol = currency === 'USD' ? '$' : '₱';
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
