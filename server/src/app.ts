import 'dotenv/config'
import { validateEnv } from './config/env'

// Validate required environment variables immediately upon process startup
validateEnv()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { prisma } from './config/db'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import workoutRoutes from './routes/workout.routes'
import foodLogRoutes from './routes/foodlog.routes'
import aiRoutes from './routes/ai.routes'
import supportRoutes from './routes/support.routes'
import testimonialRoutes from './routes/testimonial.routes'
import checkinRoutes from './routes/checkin.routes'
import notificationRoutes from './routes/notification.routes'
import weightRoutes from './routes/weight.routes'
import subscriptionRoutes from './routes/subscription.routes'
import walletRoutes from './routes/wallet.routes'
import adminRevenueRoutes from './routes/adminRevenue.routes'
import adminRoutes from './routes/admin.routes'
import { errorHandler } from './middleware/error.middleware'
import { authLimiter, generalApiLimiter } from './middleware/rateLimit.middleware'

const app = express()

// Trust first proxy hop (e.g., Render, reverse proxies) for accurate client IP in rate limiting
app.set('trust proxy', 1)

// 1. Security Headers
app.use(helmet())

// 2. CORS Whitelisting
const isProduction = process.env.NODE_ENV === 'production'
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : isProduction
  ? []
  : [
      'http://localhost:8081', // Expo mobile dev
      'http://localhost:3000', // Web client dev
      'http://localhost:19006', // Expo web dev
    ]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile React Native apps, curl, server-to-server)
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      // In local development, permit localhost and loopback origins
      if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Cross-Origin Request blocked by CORS policy'))
    },
    credentials: true,
  })
)

// 3. Body Parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// 4. Base & Health Check Probes
app.get('/', (req, res) => {
  res.send('FitTrack API running')
})

app.get(['/health', '/api/health'], async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: 'healthy',
      db: 'connected',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    res.status(503).json({
      status: 'unhealthy',
      db: 'disconnected',
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    })
  }
})

// 5. Rate-Limited API Routes
app.use('/api', generalApiLimiter)
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/workouts', workoutRoutes)
app.use('/api/food-logs', foodLogRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/support', supportRoutes)
app.use('/api/testimonials', testimonialRoutes)
app.use('/api/checkin', checkinRoutes)
app.use('/api/user/notifications', notificationRoutes)
app.use('/api/weight', weightRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/admin/revenue', adminRevenueRoutes)
app.use('/api/admin', adminRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another running instance of FitTrack server (or another process).`)
    console.error(`👉 Solution: Stop the existing terminal/process running on port ${PORT}, or run: taskkill /F /IM node.exe`)
  } else {
    console.error('❌ Server error:', err)
  }
  process.exit(1)
})

// 6. Graceful Shutdown & Process Exception Traps
const gracefulShutdown = (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`)
  server.close(async () => {
    console.log('[Server] HTTP server closed.')
    try {
      await prisma.$disconnect()
      console.log('[Server] Database connections closed.')
      process.exit(0)
    } catch (dbErr) {
      console.error('[Server] Error disconnecting database:', dbErr)
      process.exit(1)
    }
  })

  // Force shutdown if connections do not close in 10s
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.')
    process.exit(1)
  }, 10000).unref()
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

process.on('unhandledRejection', (reason: any) => {
  console.error('[Server] Unhandled Promise Rejection:', reason?.message || reason)
})

process.on('uncaughtException', (err: Error) => {
  console.error('[Server] Uncaught Exception:', err.message, err.stack)
  process.exit(1)
})