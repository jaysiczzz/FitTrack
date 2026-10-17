import Redis from 'ioredis'

let primaryRedisClient: Redis | null = null
let redisAvailable = false

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL?.trim())
}

/**
 * Returns a new Redis client instance using REDIS_URL.
 * Useful for Pub/Sub connections where isolated connections are required.
 */
export function createRedisClient(customName = 'fittrack-redis'): Redis | null {
  const url = process.env.REDIS_URL?.trim()
  if (!url) return null

  try {
    const isTls = url.startsWith('rediss://')
    let lastLoggedError = ''
    let lastLoggedTime = 0

    const client = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 10000,
      keepAlive: 30000,
      family: 4, // Force IPv4 to prevent getaddrinfo ENOTFOUND timeouts with dual-stack/IPv6 on cloud Redis
      ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
      retryStrategy(times) {
        // Backoff reconnection strategy capped at 5000ms.
        // Never return null so the connection automatically heals whenever network or Redis recovers.
        const delay = Math.min(times * 300, 5000)
        return delay
      },
      reconnectOnError(err) {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT']
        if (targetErrors.some((e) => err.message.includes(e))) {
          return true
        }
        return false
      },
    })

    client.on('error', (err: any) => {
      const msg = err?.message || String(err)
      const now = Date.now()
      // Throttle repetitive connection error messages to at most once every 30s to avoid console noise
      if (msg !== lastLoggedError || now - lastLoggedTime > 30000) {
        lastLoggedError = msg
        lastLoggedTime = now
        console.warn(`[Redis:${customName}] Connection error (will keep retrying):`, msg)
      }
    })

    client.on('connect', () => {
      // Socket connected
    })

    client.on('ready', () => {
      if (customName === 'primary') {
        redisAvailable = true
      }
      lastLoggedError = ''
      console.log(`[Redis:${customName}] Connection established and ready.`)
    })

    client.on('close', () => {
      if (customName === 'primary') {
        redisAvailable = false
      }
    })

    client.on('end', () => {
      if (customName === 'primary') {
        redisAvailable = false
      }
    })

    return client
  } catch (err: any) {
    console.warn(`[Redis:${customName}] Failed to initialize client:`, err?.message || err)
    return null
  }
}

/**
 * Retrieves or lazily initializes the primary shared Redis client.
 */
export function getRedisClient(): Redis | null {
  if (!isRedisConfigured()) {
    return null
  }

  if (!primaryRedisClient) {
    primaryRedisClient = createRedisClient('primary')
    if (primaryRedisClient) {
      primaryRedisClient.connect().catch(() => {
        // Handled via client.on('error')
      })
    }
  }

  return primaryRedisClient
}

/**
 * Checks whether Redis is actively reachable.
 */
export function isRedisAvailable(): boolean {
  return redisAvailable && primaryRedisClient?.status === 'ready'
}

/**
 * Gracefully disconnects all active Redis connections upon server shutdown.
 */
export async function closeRedisConnections(): Promise<void> {
  if (primaryRedisClient) {
    try {
      await primaryRedisClient.quit()
      console.log('[Redis] Primary client disconnected cleanly.')
    } catch {
      primaryRedisClient.disconnect()
    }
    primaryRedisClient = null
    redisAvailable = false
  }
}

