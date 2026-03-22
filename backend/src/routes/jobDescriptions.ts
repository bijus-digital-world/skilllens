import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool'
import { authenticate, authorize } from '../middleware/auth'
import { upload, deleteFile } from '../services/fileStorage'
import { extractText } from '../services/documentParser'
import { analyzeJd } from '../services/jdAnalyzer'
import { parsePagination, paginatedResponse } from '../utils/pagination'

const router = Router()

// All routes require admin auth
router.use(authenticate, authorize('admin'))

// POST /api/job-descriptions — upload a JD
router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body
    const file = req.file

    if (!title) {
      res.status(400).json({ message: 'Title is required' })
      return
    }

    let fileKey: string | null = null
    let fileName: string | null = null
    let extractedText: string | null = description || null

    if (file) {
      fileKey = file.filename
      fileName = file.originalname
      try {
        extractedText = await extractText(file.filename)
      } catch {
        // Fall back to description if extraction fails
      }
    }

    const result = await pool.query(
      `INSERT INTO job_descriptions (title, description, file_key, file_name, extracted_text, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, description, file_name, created_at`,
      [title, description || null, fileKey, fileName, extractedText, req.user!.userId]
    )

    const jd = result.rows[0]

    // Trigger AI analysis in background
    if (extractedText) {
      analyzeJd(jd.id, extractedText).catch((err) =>
        console.error('JD analysis error:', err.message)
      )
    }

    res.status(201).json(jd)
  } catch (err) {
    console.error('Create JD error:', err)
    res.status(500).json({ message: 'Failed to create job description' })
  }
})

// GET /api/job-descriptions — list all JDs
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const pagination = parsePagination(req)

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM job_descriptions WHERE created_by = $1',
      [req.user!.userId]
    )
    const total = parseInt(countResult.rows[0].count, 10)

    const result = await pool.query(
      `SELECT id, title, description, file_name, created_at, analysis IS NOT NULL as has_analysis
       FROM job_descriptions WHERE created_by = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user!.userId, pagination.limit, pagination.offset]
    )
    res.json(paginatedResponse(result.rows, total, pagination))
  } catch (err) {
    console.error('List JDs error:', err)
    res.status(500).json({ message: 'Failed to list job descriptions' })
  }
})

// GET /api/job-descriptions/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, file_name, extracted_text, analysis, created_at
       FROM job_descriptions WHERE id = $1 AND created_by = $2`,
      [req.params.id, req.user!.userId]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Job description not found' })
      return
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('Get JD error:', err)
    res.status(500).json({ message: 'Failed to get job description' })
  }
})

// POST /api/job-descriptions/:id/analyze — re-analyze a JD
router.post('/:id/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, extracted_text FROM job_descriptions WHERE id = $1 AND created_by = $2',
      [req.params.id, req.user!.userId]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Job description not found' })
      return
    }
    const { extracted_text } = result.rows[0]
    if (!extracted_text) {
      res.status(400).json({ message: 'No text available to analyze' })
      return
    }
    const jdId = req.params.id as string
    const analysis = await analyzeJd(jdId, String(extracted_text))
    res.json(analysis)
  } catch (err) {
    console.error('Analyze JD error:', err)
    res.status(500).json({ message: 'Failed to analyze job description' })
  }
})

// DELETE /api/job-descriptions/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if any interviews reference this JD
    const refs = await pool.query(
      "SELECT id FROM interviews WHERE jd_id = $1 AND status IN ('scheduled', 'in_progress')",
      [req.params.id]
    )
    if (refs.rows.length > 0) {
      res.status(409).json({ message: 'Cannot delete — this JD is used by active interviews. Cancel them first.' })
      return
    }

    const result = await pool.query(
      'DELETE FROM job_descriptions WHERE id = $1 AND created_by = $2 RETURNING file_key',
      [req.params.id, req.user!.userId]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Job description not found' })
      return
    }
    if (result.rows[0].file_key) {
      deleteFile(result.rows[0].file_key)
    }
    res.json({ message: 'Job description deleted' })
  } catch (err) {
    console.error('Delete JD error:', err)
    res.status(500).json({ message: 'Failed to delete job description' })
  }
})

export default router
