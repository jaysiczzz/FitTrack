import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
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
import { errorHandler } from './middleware/error.middleware'
import { authLimiter, generalApiLimiter } from './middleware/rateLimit.middleware'

const app = express()

// Trust first proxy hop (e.g., Render, reverse proxies) for accurate client IP in rate limiting
app.set('trust proxy', 1)

// 1. Security Headers
app.use(helmet())

// 2. CORS Whitelisting
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : [
      'http://localhost:8081', // Expo mobile dev
      'http://localhost:3000', // Web client dev
      'http://localhost:19006', // Expo web dev
    ]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile React Native apps, curl)
      if (!origin) return callback(null, true)
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
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

// 4. Base Health Check
app.get('/', (req, res) => {
  res.send('FitTrack API running')
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

app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})