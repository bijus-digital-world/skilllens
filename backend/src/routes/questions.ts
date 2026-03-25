import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool'
import { authenticate, authorize } from '../middleware/auth'
import { generateQuestions } from '../services/questionGenerator'

const router = Router()

router.use(authenticate, authorize('admin'))

// POST /api/questions/generate
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jdId, cvId, difficulty, count } = req.body

    if (!jdId || !difficulty || !count) {
      res.status(400).json({ message: 'jdId, difficulty, and count are required' })
      return
    }

    const validDifficulties = ['simple', 'moderate', 'tough']
    if (!validDifficulties.includes(difficulty)) {
      res.status(400).json({ message: 'Difficulty must be simple, moderate, or tough' })
      return
    }

    const questionCount = Math.min(Math.max(parseInt(count, 10), 1), 20)

    // Fetch JD text
    const jdResult = await pool.query(
      'SELECT title, extracted_text FROM job_descriptions WHERE id = $1 AND org_id = $2',
      [jdId, req.user!.orgId]
    )
    if (jdResult.rows.length === 0) {
      res.status(404).json({ message: 'Job description not found' })
      return
    }
    const jdText = jdResult.rows[0].extracted_text || jdResult.rows[0].title

    // Fetch CV text if provided
    let cvText: string | null = null
    if (cvId) {
      const cvResult = await pool.query(
        'SELECT extracted_text FROM candidate_cvs WHERE id = $1',
        [cvId]
      )
      if (cvResult.rows.length > 0) {
        cvText = cvResult.rows[0].extracted_text
      }
    }

    // Generate questions
    const questions = await generateQuestions(jdText, cvText, difficulty, questionCount)

    // Save to database
    const result = await pool.query(
      `INSERT INTO question_sets (jd_id, cv_id, difficulty, question_count, questions, created_by, org_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, difficulty, question_count, created_at`,
      [jdId, cvId || null, difficulty, questionCount, JSON.stringify(questions), req.user!.userId, req.user!.orgId]
    )

    res.status(201).json({
      ...result.rows[0],
      questions,
    })
  } catch (err) {
    console.error('Generate questions error:', err)
    res.status(500).json({ message: 'Failed to generate questions: ' + (err as Error).message })
  }
})

// GET /api/questions — list saved question sets
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT qs.id, qs.difficulty, qs.question_count, qs.created_at,
              jd.title AS jd_title,
              u.name AS candidate_name
       FROM question_sets qs
       JOIN job_descriptions jd ON jd.id = qs.jd_id
       LEFT JOIN candidate_cvs cv ON cv.id = qs.cv_id
       LEFT JOIN users u ON u.id = cv.candidate_id
       WHERE qs.org_id = $1
       ORDER BY qs.created_at DESC`,
      [req.user!.orgId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('List questions error:', err)
    res.status(500).json({ message: 'Failed to list question sets' })
  }
})

// GET /api/questions/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT qs.*, jd.title AS jd_title,
              u.name AS candidate_name, u.email AS candidate_email
       FROM question_sets qs
       JOIN job_descriptions jd ON jd.id = qs.jd_id
       LEFT JOIN candidate_cvs cv ON cv.id = qs.cv_id
       LEFT JOIN users u ON u.id = cv.candidate_id
       WHERE qs.id = $1 AND qs.created_by = $2`,
      [req.params.id, req.user!.orgId]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Question set not found' })
      return
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('Get questions error:', err)
    res.status(500).json({ message: 'Failed to get question set' })
  }
})

// DELETE /api/questions/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'DELETE FROM question_sets WHERE id = $1 AND org_id = $2 RETURNING id',
      [req.params.id, req.user!.orgId]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Question set not found' })
      return
    }
    res.json({ message: 'Question set deleted' })
  } catch (err) {
    console.error('Delete questions error:', err)
    res.status(500).json({ message: 'Failed to delete question set' })
  }
})

export default router
