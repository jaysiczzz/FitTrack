import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes'
import { errorHandler } from './middleware/error.middleware'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('FitTrack API running')
})

app.use('/api/auth', authRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))