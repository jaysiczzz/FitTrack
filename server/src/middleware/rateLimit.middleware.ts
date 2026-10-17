import rateLimit, { ipKeyGenerator, MemoryStore } from 'express-rate-limit'
import type { Store, Options, IncrementResponse } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import jwt from 'jsonwebtoken'
import { getRedisClient, isRedisConfigured } from '../config/redis'

/**
 * Resilient Store that delegates to Redis when connected,
 * and seamlessly falls back to in-memory tracking if Redis is unreachable or reconnecting.
 * This ensures that Redis downtime or network blips never crash user requests or return 500 errors.
 */
class ResilientRateLimitStore implements Store {
  public prefix: string
  public localKeys = false
  private memoryStore: MemoryStore
  private redisStore: RedisStore | null = null

  constructor(prefix: string) {
    this.prefix = prefix
    this.memoryStore = new MemoryStore()
    if (isRedisConfigured()) {
      const client = getRedisClient()
      if (client) {
        this.redisStore = new RedisStore({
          sendCommand: (...args: string[]) => {
            if (!client || client.status !== 'ready') {
              return Promise.reject(new Error('Redis connection is not ready'))
            }
            return (client as any).call(...args)
          },
          prefix: `rl:${prefix}:`,
        })
      }
    }
  }

  async init(options: Options): Promise<void> {
    this.memoryStore.init(options)
    if (this.redisStore) {
      try {
        await this.redisStore.init(options)
      } catch {
        // Suppress init error if Redis is offline during server start; scripts will load on demand
      }
    }
  }

  async increment(key: string): Promise<IncrementResponse> {
    const client = getRedisClient()
    if (this.redisStore && client?.status === 'ready') {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Redis timeout')), 1000)
        )
        return await Promise.race([this.redisStore.increment(key), timeoutPromise])
      } catch {
        // Fall back to memoryStore so athlete requests are never rejected or stalled
      }
    }
    return this.memoryStore.increment(key)
  }

  async decrement(key: string): Promise<void> {
    const client = getRedisClient()
    if (this.redisStore && client?.status === 'ready') {
      try {
        await this.redisStore.decrement(key)
      } catch {
        // Ignore fallback error
      }
    }
    return this.memoryStore.decrement(key)
  }

  async resetKey(key: string): Promise<void> {
    const client = getRedisClient()
    if (this.redisStore && client?.status === 'ready') {
      try {
        await this.redisStore.resetKey(key)
      } catch {
        // Ignore fallback error
      }
    }
    return this.memoryStore.resetKey(key)
  }

  async resetAll(): Promise<void> {
    const client = getRedisClient()
    if (this.redisStore && client?.status === 'ready') {
      try {
        await (this.redisStore as any).resetAll?.()
      } catch {
        // Ignore fallback error
      }
    }
    return this.memoryStore.resetAll?.()
  }
}

function getRateLimitStore(prefix: string): Store {
  return new ResilientRateLimitStore(prefix)
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
  passOnStoreError: true,
  store: getRateLimitStore('auth'),
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
  passOnStoreError: true,
  keyGenerator: (req) => getClientIdentifier(req),
  validate: {
    keyGeneratorIpFallback: false,
  },
  store: getRateLimitStore('ai'),
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
  passOnStoreError: true,
  store: getRateLimitStore('general'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.',
  },
})

