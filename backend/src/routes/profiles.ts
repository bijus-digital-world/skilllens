import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.use(authenticate, authorize('admin'))

// GET /api/profiles — list all profiles (presets + user's custom)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, experience_level, role_type, domain, categories, strictness, pass_threshold, is_preset, created_at
       FROM evaluation_profiles
       WHERE is_preset = TRUE OR org_id = $1
       ORDER BY is_preset DESC, experience_level ASC, created_at DESC`,
      [req.user!.orgId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('List profiles error:', err)
    res.status(500).json({ message: 'Failed to list profiles' })
  }
})

// GET /api/profiles/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT * FROM evaluation_profiles WHERE id = $1 AND (is_preset = TRUE OR org_id = $2)`,
      [req.params.id, req.user!.orgId]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Profile not found' })
      return
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('Get profile error:', err)
    res.status(500).json({ message: 'Failed to get profile' })
  }
})

// POST /api/profiles — create custom profile
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, experienceLevel, roleType, domain, categories, strictness, passThreshold } = req.body

    if (!name || !experienceLevel || !categories || !Array.isArray(categories) || categories.length === 0) {
      res.status(400).json({ message: 'Name, experience level, and at least one category are required' })
      return
    }

    // Validate weights sum to 100
    const totalWeight = categories.reduce((sum: number, c: { weight: number }) => sum + c.weight, 0)
    if (totalWeight !== 100) {
      res.status(400).json({ message: `Category weights must sum to 100 (currently ${totalWeight})` })
      return
    }

    const result = await pool.query(
      `INSERT INTO evaluation_profiles (name, description, experience_level, role_type, domain, categories, strictness, pass_threshold, created_by, org_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, description, experience_level, role_type, domain, categories, strictness, pass_threshold, created_at`,
      [
        name,
        description || null,
        experienceLevel,
        roleType || 'ic',
        domain || 'fullstack',
        JSON.stringify(categories),
        strictness || 'moderate',
        passThreshold || 6.0,
        req.user!.userId,
        req.user!.orgId,
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Create profile error:', err)
    res.status(500).json({ message: 'Failed to create profile' })
  }
})

// PUT /api/profiles/:id — update custom profile
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, experienceLevel, roleType, domain, categories, strictness, passThreshold } = req.body

    // Can't edit presets
    const existing = await pool.query(
      'SELECT is_preset FROM evaluation_profiles WHERE id = $1',
      [req.params.id]
    )
    if (existing.rows.length === 0) {
      res.status(404).json({ message: 'Profile not found' })
      return
    }
    if (existing.rows[0].is_preset) {
      res.status(403).json({ message: 'Preset profiles cannot be edited. Duplicate it to create a custom version.' })
      return
    }

    const result = await pool.query(
      `UPDATE evaluation_profiles
       SET name = $1, description = $2, experience_level = $3, role_type = $4, domain = $5,
           categories = $6, strictness = $7, pass_threshold = $8, updated_at = NOW()
       WHERE id = $9 AND org_id = $10
       RETURNING *`,
      [name, description, experienceLevel, roleType, domain, JSON.stringify(categories), strictness, passThreshold, req.params.id, req.user!.orgId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Profile not found' })
      return
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

// DELETE /api/profiles/:id — delete custom profile
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'DELETE FROM evaluation_profiles WHERE id = $1 AND org_id = $2 AND is_preset = FALSE RETURNING id',
      [req.params.id, req.user!.orgId]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Profile not found or is a preset' })
      return
    }
    res.json({ message: 'Profile deleted' })
  } catch (err) {
    console.error('Delete profile error:', err)
    res.status(500).json({ message: 'Failed to delete profile' })
  }
})

export default router
