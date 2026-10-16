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
    const client = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 10) {
          console.warn(`[Redis:${customName}] Max retry attempts reached. Discontinuing reconnection loop.`)
          return null
        }
        return Math.min(times * 200, 3000)
      },
    })

    client.on('error', (err) => {
      // Prevent unhandled errors from crashing the Node process if Redis is unreachable
      console.warn(`[Redis:${customName}] Connection error:`, err?.message || err)
    })

    client.on('connect', () => {
      redisAvailable = true
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
      primaryRedisClient.connect().catch((err) => {
        console.warn('[Redis:primary] Initial connect failed, will retry in background:', err?.message || err)
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
