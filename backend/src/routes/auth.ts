import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { pool } from '../db/pool'
import { config } from '../config'
import { authenticate, type JwtPayload } from '../middleware/auth'
import { sanitizeString, sanitizeName, isValidEmail } from '../utils/validate'
import { sendPasswordResetEmail } from '../services/emailService'

const router = Router()

// Rate limit: 10 attempts per 15 minutes per IP for login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
})

// Rate limit: 3 password reset requests per 15 minutes
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many reset requests. Please try again later.' },
})

function createToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions)
}

function setTokenCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const email = sanitizeString(req.body.email).toLowerCase()
    const password = req.body.password
    const name = sanitizeName(req.body.name)
    const role = req.body.role

    if (!email || !password || !name) {
      res.status(400).json({ message: 'Email, password, and name are required' })
      return
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ message: 'Invalid email address' })
      return
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      res.status(400).json({ message: 'Password must be 8-128 characters' })
      return
    }

    // Public registration is always candidate. Admin accounts are created internally.
    const userRole = 'candidate'

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      res.status(409).json({ message: 'Email already registered' })
      return
    }

    // Hash password and create user (self-registered)
    // Assign to default org (self-registered users get practice mode)
    const defaultOrg = await pool.query("SELECT id FROM organizations WHERE slug = 'default' LIMIT 1")
    const orgId = defaultOrg.rows[0]?.id || null

    const passwordHash = await bcrypt.hash(password, 12)
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, role, is_self_registered, org_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, role, org_id, created_at',
      [email, passwordHash, name, userRole, true, orgId]
    )

    const user = result.rows[0]
    const token = createToken({ userId: user.id, email: user.email, role: user.role, orgId: user.org_id })
    setTokenCookie(res, token)

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
      },
      message: 'Registration successful',
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/auth/login
router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const email = sanitizeString(req.body.email).toLowerCase()
    const password = req.body.password

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' })
      return
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ message: 'Invalid email address' })
      return
    }

    const result = await pool.query(
      'SELECT id, email, password_hash, name, role, must_change_password, org_id, created_at FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      res.status(401).json({ message: 'Invalid email or password' })
      return
    }

    const user = result.rows[0]
    const validPassword = await bcrypt.compare(password, user.password_hash)

    if (!validPassword) {
      res.status(401).json({ message: 'Invalid email or password' })
      return
    }

    const token = createToken({ userId: user.id, email: user.email, role: user.role, orgId: user.org_id })
    setTokenCookie(res, token)

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
        mustChangePassword: user.must_change_password,
      },
      message: 'Login successful',
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/auth/change-password — change password (used for forced change and voluntary)
router.post('/change-password', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const password = req.body.password
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      res.status(400).json({ message: 'Password must be 8-128 characters' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await pool.query(
      'UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2',
      [passwordHash, req.user!.userId]
    )

    res.json({ message: 'Password changed successfully' })
  } catch (err) {
    console.error('Change password error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/auth/token — return the current token for WebSocket auth
router.get('/token', authenticate, (req: Request, res: Response) => {
  const token = req.cookies?.token
  if (!token) {
    res.status(401).json({ message: 'No token' })
    return
  }
  res.json({ token })
})

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token')
  res.json({ message: 'Logged out successfully' })
})

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, is_self_registered, created_at FROM users WHERE id = $1',
      [req.user!.userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    const user = result.rows[0]
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isSelfRegistered: user.is_self_registered,
      createdAt: user.created_at,
    })
  } catch (err) {
    console.error('Me error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/auth/forgot-password — request a password reset
router.post('/forgot-password', resetLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const email = sanitizeString(req.body.email).toLowerCase()

    if (!email || !isValidEmail(email)) {
      res.status(400).json({ message: 'Valid email is required' })
      return
    }

    // Always return success to prevent email enumeration
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email])

    if (result.rows.length > 0) {
      const userId = result.rows[0].id
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Invalidate any existing tokens for this user
      await pool.query('UPDATE password_resets SET used = true WHERE user_id = $1 AND used = false', [userId])

      await pool.query(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [userId, token, expiresAt.toISOString()]
      )

      sendPasswordResetEmail(email, token).catch(() => {})
    }

    res.json({ message: 'If that email is registered, a reset link has been sent.' })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/auth/reset-password — reset password with token
router.post('/reset-password', resetLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const token = sanitizeString(req.body.token)
    const password = req.body.password

    if (!token) {
      res.status(400).json({ message: 'Reset token is required' })
      return
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      res.status(400).json({ message: 'Password must be 8-128 characters' })
      return
    }

    // Find valid token
    const result = await pool.query(
      'SELECT pr.id, pr.user_id FROM password_resets pr WHERE pr.token = $1 AND pr.used = false AND pr.expires_at > NOW()',
      [token]
    )

    if (result.rows.length === 0) {
      res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' })
      return
    }

    const { id: resetId, user_id: userId } = result.rows[0]

    // Update password
    const passwordHash = await bcrypt.hash(password, 12)
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId])

    // Mark token as used
    await pool.query('UPDATE password_resets SET used = true WHERE id = $1', [resetId])

    res.json({ message: 'Password has been reset. You can now log in.' })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
