import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('FitTrack API running')
})

app.use('/api/auth', authRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))