import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.use(authenticate, authorize('admin'))

// GET /api/candidates — list all candidates
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      "SELECT id, email, name, created_at FROM users WHERE role = 'candidate' ORDER BY name ASC"
    )
    res.json(result.rows)
  } catch (err) {
    console.error('List candidates error:', err)
    res.status(500).json({ message: 'Failed to list candidates' })
  }
})

export default router
