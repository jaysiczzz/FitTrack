import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { AuthRequest } from './auth.middleware'

/**
 * Strict rate limiter for authentication endpoints (login, register, refresh).
 * Keyed by IP address to prevent brute-force and credential stuffing attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
})

/**
 * Identity-aware rate limiter for AI generation endpoints.
 * Keyed by authenticated user ID (falls back to IP if unauthenticated).
 * Ensures multiple users on the same Wi-Fi don't starve each other's quota,
 * while preventing single users from abusing Google Gemini API costs.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 AI requests per minute per user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const authReq = req as AuthRequest
    return authReq.user?.id || ipKeyGenerator(req.ip ?? '') || 'anonymous'
  },
  validate: {
    keyGeneratorIpFallback: false,
  },
  message: {
    error: 'AI request quota reached for this minute. Please wait a moment before trying again.',
  },
})

/**
 * Global protective rate limiter for general API traffic.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.',
  },
})
