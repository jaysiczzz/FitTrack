import 'dotenv/config'

import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import workoutRoutes from './routes/workout.routes'
import { errorHandler } from './middleware/error.middleware'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('FitTrack API running')
})

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/workouts', workoutRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))