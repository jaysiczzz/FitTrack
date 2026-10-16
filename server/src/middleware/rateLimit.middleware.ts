import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import jwt from 'jsonwebtoken'
import { AuthRequest } from './auth.middleware'
import { getRedisClient, isRedisConfigured } from '../config/redis'

/**
 * Creates a distributed RedisStore instance if REDIS_URL is configured,
 * otherwise returns undefined so express-rate-limit falls back to memory store.
 */
function getDistributedStore(prefix: string) {
  if (!isRedisConfigured()) return undefined
  const client = getRedisClient()
  if (!client) return undefined
  return new RedisStore({
    // @ts-expect-error - ioredis call compatibility
    sendCommand: (...args: string[]) => client.call(...args),
    prefix: `rl:${prefix}:`,
  })
}

/**
 * Fast client identifier resolver.
 * Prefers authenticated user ID if present (via req.user or fast JWT decode)
 * to avoid shared IP / Wi-Fi throttling collisions in gyms, schools, and offices.
 */
export function getClientIdentifier(req: any): string {
  if (req.user?.id) {
    return `user:${req.user.id}`
  }

  const authHeader = req.headers?.authorization
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    try {
      const decoded: any = jwt.decode(token)
      if (decoded?.id && typeof decoded.id === 'string') {
        return `user:${decoded.id}`
      }
    } catch {
      // Fallback to IP
    }
  }

  return `ip:${ipKeyGenerator(req.ip ?? '') || 'anonymous'}`
}

/**
 * Strict rate limiter for authentication endpoints (login, register, refresh).
 * Keyed by IP address to prevent brute-force and credential stuffing attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 500, // 20 in production, generous in local development
  standardHeaders: true,
  legacyHeaders: false,
  store: getDistributedStore('auth'),
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
  keyGenerator: (req) => getClientIdentifier(req),
  validate: {
    keyGeneratorIpFallback: false,
  },
  store: getDistributedStore('ai'),
  message: {
    error: 'AI request quota reached for this minute. Please wait a moment before trying again.',
  },
})

/**
 * Global protective rate limiter for general API traffic.
 * Grants a generous per-user bucket (1,200 req / 15m) for authenticated athletes,
 * preventing shared-gym Wi-Fi blocking while strictly throttling anonymous scrapers (300 req / 15m).
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    const key = getClientIdentifier(req)
    return key.startsWith('user:') ? 1200 : 300
  },
  keyGenerator: (req) => getClientIdentifier(req),
  validate: {
    keyGeneratorIpFallback: false,
  },
  store: getDistributedStore('general'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.',
  },
})
