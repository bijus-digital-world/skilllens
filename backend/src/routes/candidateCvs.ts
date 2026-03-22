import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool'
import { authenticate, authorize } from '../middleware/auth'
import { upload, deleteFile } from '../services/fileStorage'
import { extractText } from '../services/documentParser'
import { parsePagination, paginatedResponse } from '../utils/pagination'

const router = Router()

router.use(authenticate, authorize('admin'))

// POST /api/cvs — upload a CV for a candidate
router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { candidateId } = req.body
    const file = req.file

    if (!candidateId) {
      res.status(400).json({ message: 'candidateId is required' })
      return
    }

    if (!file) {
      res.status(400).json({ message: 'File is required' })
      return
    }

    // Verify candidate exists and is a candidate
    const candidate = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND role = 'candidate'",
      [candidateId]
    )
    if (candidate.rows.length === 0) {
      res.status(404).json({ message: 'Candidate not found' })
      return
    }

    let extractedText: string | null = null
    try {
      extractedText = await extractText(file.filename)
    } catch {
      // extraction failed, continue without text
    }

    const result = await pool.query(
      `INSERT INTO candidate_cvs (candidate_id, file_key, file_name, extracted_text, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, candidate_id, file_name, created_at`,
      [candidateId, file.filename, file.originalname, extractedText, req.user!.userId]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Upload CV error:', err)
    res.status(500).json({ message: 'Failed to upload CV' })
  }
})

// GET /api/cvs — list CVs (optionally filtered by candidateId)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { candidateId } = req.query
    const pagination = parsePagination(req)

    let countQuery = 'SELECT COUNT(*) FROM candidate_cvs cv WHERE cv.created_by = $1'
    let query = `SELECT cv.id, cv.candidate_id, cv.file_name, cv.created_at, u.name as candidate_name, u.email as candidate_email
                 FROM candidate_cvs cv
                 JOIN users u ON u.id = cv.candidate_id
                 WHERE cv.created_by = $1`
    const params: unknown[] = [req.user!.userId]
    const countParams: unknown[] = [req.user!.userId]

    if (candidateId) {
      countQuery += ' AND cv.candidate_id = $2'
      query += ' AND cv.candidate_id = $2'
      params.push(candidateId)
      countParams.push(candidateId)
    }

    const countResult = await pool.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].count, 10)

    const paramIdx = params.length + 1
    query += ` ORDER BY cv.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`
    params.push(pagination.limit, pagination.offset)

    const result = await pool.query(query, params)
    res.json(paginatedResponse(result.rows, total, pagination))
  } catch (err) {
    console.error('List CVs error:', err)
    res.status(500).json({ message: 'Failed to list CVs' })
  }
})

// DELETE /api/cvs/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if any interviews reference this CV
    const refs = await pool.query(
      "SELECT id FROM interviews WHERE cv_id = $1 AND status IN ('scheduled', 'in_progress')",
      [req.params.id]
    )
    if (refs.rows.length > 0) {
      res.status(409).json({ message: 'Cannot delete — this CV is used by active interviews. Cancel them first.' })
      return
    }

    const result = await pool.query(
      'DELETE FROM candidate_cvs WHERE id = $1 AND created_by = $2 RETURNING file_key',
      [req.params.id, req.user!.userId]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'CV not found' })
      return
    }
    if (result.rows[0].file_key) {
      deleteFile(result.rows[0].file_key)
    }
    res.json({ message: 'CV deleted' })
  } catch (err) {
    console.error('Delete CV error:', err)
    res.status(500).json({ message: 'Failed to delete CV' })
  }
})

export default router
