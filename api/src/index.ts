import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { zoomRouter } from './routes/zoom'
import { ghlRouter } from './routes/ghl'
import { registrationRouter } from './routes/registration'
import { webhooksRouter } from './routes/webhooks'
import { errorHandler } from './middleware/error-handler'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/zoom', zoomRouter)
app.use('/api/ghl', ghlRouter)
app.use('/api/register', registrationRouter)
app.use('/api/webhooks', webhooksRouter)

// Error handling
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`WebinarOS API running on port ${PORT}`)
})

export default app
