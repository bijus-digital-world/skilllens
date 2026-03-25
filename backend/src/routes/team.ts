import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { pool } from '../db/pool'
import { authenticate, authorize } from '../middleware/auth'
import { sanitizeString, sanitizeName, isValidEmail, isOneOf } from '../utils/validate'
import { sendAccountCreatedEmail } from '../services/emailService'
import { logAudit } from '../services/auditLog'

const router = Router()

router.use(authenticate, authorize('admin'))

// GET /api/team — list all users created by this admin (or all for system admin)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, role, is_self_registered, must_change_password, created_at
       FROM users WHERE org_id = $1 ORDER BY created_at DESC`,
      [req.user!.orgId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('List team error:', err)
    res.status(500).json({ message: 'Failed to list team members' })
  }
})

// POST /api/team — create a new admin or candidate user
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const email = sanitizeString(req.body.email).toLowerCase()
    const name = sanitizeName(req.body.name)
    const role = isOneOf(req.body.role, ['admin', 'candidate']) ? req.body.role : 'candidate'

    if (!email || !name) {
      res.status(400).json({ message: 'Email and name are required' })
      return
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ message: 'Invalid email address' })
      return
    }

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      res.status(409).json({ message: 'Email already registered' })
      return
    }

    // Generate random password
    const tempPassword = crypto.randomBytes(6).toString('base64url')
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, must_change_password, is_self_registered, created_by, org_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, name, role, created_at`,
      [email, passwordHash, name, role, true, false, req.user!.userId, req.user!.orgId]
    )

    // Send credentials email
    sendAccountCreatedEmail(email, name, tempPassword, role).catch(() => {})
    logAudit(req, 'user.created', 'user', result.rows[0].id, { email, role })

    res.status(201).json({
      ...result.rows[0],
      tempPassword, // Return to admin so they can share if email fails
    })
  } catch (err) {
    console.error('Create user error:', err)
    res.status(500).json({ message: 'Failed to create user' })
  }
})

export default router
