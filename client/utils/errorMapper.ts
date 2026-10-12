/**
 * Central Error Mapper & Sanitizer
 * Transforms technical, protocol, network, and backend errors into
 * polished, user-friendly error messages that do not leak internal URLs,
 * database details, or raw HTTP status codes.
 */

export function getFriendlyErrorMessage(
  err: unknown,
  fallback: string = 'An unexpected issue occurred. Please try again.'
): string {
  if (!err) {
    return fallback;
  }

  const rawMessage =
    typeof err === 'string'
      ? err
      : err instanceof Error
      ? err.message
      : (err as any)?.message || (err as any)?.error || '';

  if (!rawMessage || typeof rawMessage !== 'string') {
    return fallback;
  }

  const trimmed = rawMessage.trim();

  // 1. Network & Connectivity Failures
  if (
    trimmed.includes('Unable to connect') ||
    trimmed.includes('Network request failed') ||
    trimmed.includes('Failed to fetch') ||
    trimmed.includes('timed out') ||
    trimmed.includes('NetworkError') ||
    trimmed.includes('AbortError') ||
    trimmed.includes('ECONNREFUSED')
  ) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  // 2. Server Errors (5xx, HTTP status leaks)
  if (
    trimmed.includes('status 5') ||
    trimmed.includes('500') ||
    trimmed.includes('502') ||
    trimmed.includes('503') ||
    trimmed.includes('504') ||
    trimmed.includes('Internal Server Error') ||
    trimmed.includes('Request failed with status')
  ) {
    return 'Our servers are experiencing issues. Please try again shortly.';
  }

  // 3. Authentication & Session Expiry
  if (
    trimmed.includes('jwt expired') ||
    trimmed.includes('invalid token') ||
    trimmed.includes('Unauthorized') ||
    trimmed.includes('jwt malformed')
  ) {
    return 'Your session has expired. Please log in again.';
  }

  // 4. Rate Limiting / AI Quota
  if (
    trimmed.includes('status 429') ||
    trimmed.includes('Too many requests') ||
    trimmed.includes('quota exceeded')
  ) {
    return 'Too many requests. Please wait a moment before trying again.';
  }

  // 5. Hide URLs if any leaked through
  if (trimmed.includes('http://') || trimmed.includes('https://')) {
    return fallback;
  }

  // 6. User-facing domain errors from backend API
  return trimmed;
}
