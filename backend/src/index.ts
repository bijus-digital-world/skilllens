import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
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

const app = express()
const server = http.createServer(app)

app.use(cors({
  origin: config.clientOrigin,
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Socket.IO for interview streaming
setupInterviewSocket(server)

if (require.main === module) {
  server.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`)
  })
}

export { app, server }
