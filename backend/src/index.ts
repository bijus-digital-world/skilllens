import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import http from 'http'
import { config } from './config'
import authRoutes from './routes/auth'
import jobDescriptionRoutes from './routes/jobDescriptions'
import candidateCvRoutes from './routes/candidateCvs'
import candidateRoutes from './routes/candidates'
import interviewRoutes from './routes/interviews'
import dashboardRoutes from './routes/dashboard'
import questionRoutes from './routes/questions'
import profileRoutes from './routes/profiles'
import suggestRoutes from './routes/suggest'
import teamRoutes from './routes/team'
import { setupInterviewSocket } from './services/interviewHandler'
import { pool } from './db/pool'

const app = express()
const server = http.createServer(app)

// Trust proxy (behind Nginx)
app.set('trust proxy', 1)

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled — frontend serves its own CSP
  crossOriginEmbedderPolicy: false, // Allow cross-origin resources
}))

// CORS
app.use(cors({
  origin: config.clientOrigin,
  credentials: true,
}))

// Request size limits
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false, limit: '1mb' }))
app.use(cookieParser())

// Global rate limit — 200 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
})
app.use('/api/', globalLimiter)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/job-descriptions', jobDescriptionRoutes)
app.use('/api/cvs', candidateCvRoutes)
app.use('/api/candidates', candidateRoutes)
app.use('/api/interviews', interviewRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/suggest', suggestRoutes)
app.use('/api/team', teamRoutes)

// Health check (exempt from rate limiting)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Socket.IO for interview streaming
setupInterviewSocket(server)

// Graceful shutdown — save active interviews before exit
function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`)

  server.close(async () => {
    console.log('HTTP server closed')
    try {
      await pool.end()
      console.log('Database pool closed')
    } catch {
      // ignore
    }
    process.exit(0)
  })

  // Force exit after 10 seconds
  setTimeout(() => {
    console.log('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

if (require.main === module) {
  server.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`)
  })

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
}

export { app, server }
