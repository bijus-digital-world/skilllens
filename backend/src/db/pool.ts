import { Pool } from 'pg'
import { config } from '../config'

export const pool = new Pool({
  connectionString: config.databaseUrl,

  // Connection pool sizing
  // With PM2 cluster mode, each worker gets its own pool.
  // 4 workers x 20 connections = 80 total (within PostgreSQL's default 100 limit)
  max: config.db.maxConnections,

  // Release idle connections after 30 seconds
  // Prevents holding connections that aren't being used
  idleTimeoutMillis: config.db.idleTimeoutMs,

  // Fail fast if a connection can't be acquired in 5 seconds
  // Better to return an error than hang indefinitely
  connectionTimeoutMillis: config.db.connectionTimeoutMs,

  // Keep at least 2 connections warm for fast first queries
  min: 2,

  // Allow connections to exit cleanly during graceful shutdown
  allowExitOnIdle: true,
})

// Log pool errors but don't crash — let the request fail gracefully
pool.on('error', (err) => {
  console.error('Database pool error:', err.message)
})

// Monitor pool health in production
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const { totalCount, idleCount, waitingCount } = pool
    if (waitingCount > 0) {
      console.warn(`[DB Pool] total=${totalCount} idle=${idleCount} waiting=${waitingCount}`)
    }
  }, 30000)
}
