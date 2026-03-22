import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool'
import { authenticate, authorize } from '../middleware/auth'
import { generateReport } from '../services/reportGenerator'
import type { EvaluationResult } from '../services/evaluation'
import { sendInterviewScheduledEmail } from '../services/emailService'
import { parsePagination, paginatedResponse } from '../utils/pagination'
import { isValidUUID, validateInt, isOneOf } from '../utils/validate'
import { pickInterviewerName } from '../services/interviewHandler'

const router = Router()

router.use(authenticate)

// POST /api/interviews — schedule an interview (admin only)
router.post('/', authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { candidateId, jdId, cvId, scheduledStart, profileId, adaptiveDifficulty, isPractice } = req.body

    if (!candidateId || !jdId || !cvId || !scheduledStart) {
      res.status(400).json({ message: 'candidateId, jdId, cvId, and scheduledStart are required' })
      return
    }

    // Validate UUIDs
    if (!isValidUUID(candidateId) || !isValidUUID(jdId) || !isValidUUID(cvId)) {
      res.status(400).json({ message: 'Invalid ID format' })
      return
    }
    if (profileId && !isValidUUID(profileId)) {
      res.status(400).json({ message: 'Invalid profile ID format' })
      return
    }

    const duration = validateInt(req.body.durationMinutes, 5, 120, 30)
    const interviewerGender = isOneOf(req.body.interviewerGender, ['male', 'female']) ? req.body.interviewerGender : undefined
    const persona = isOneOf(req.body.persona, ['friendly', 'tough', 'rapid_fire']) ? req.body.persona : 'friendly'
    const initialDifficulty = isOneOf(req.body.initialDifficulty, ['simple', 'moderate', 'tough']) ? req.body.initialDifficulty : 'moderate'

    const start = new Date(scheduledStart)
    if (isNaN(start.getTime())) {
      res.status(400).json({ message: 'Invalid date format' })
      return
    }
    // Prevent scheduling in the past (allow 5 min grace for clock skew)
    if (start.getTime() < Date.now() - 5 * 60 * 1000) {
      res.status(400).json({ message: 'Cannot schedule an interview in the past' })
      return
    }
    const end = new Date(start.getTime() + duration * 60 * 1000)

    const result = await pool.query(
      `INSERT INTO interviews (candidate_id, jd_id, cv_id, scheduled_by, duration_minutes, scheduled_start, scheduled_end, profile_id, interviewer_name, adaptive_difficulty, initial_difficulty, persona, is_practice)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, candidate_id, jd_id, cv_id, status, duration_minutes, scheduled_start, scheduled_end, profile_id, interviewer_name, adaptive_difficulty, initial_difficulty, persona, is_practice, created_at`,
      [candidateId, jdId, cvId, req.user!.userId, duration, start.toISOString(), end.toISOString(), profileId || null, pickInterviewerName(interviewerGender), adaptiveDifficulty ?? true, initialDifficulty || 'moderate', persona || 'friendly', isPractice ?? false]
    )

    const interview = result.rows[0]

    // Send email notification (async, don't block response)
    pool.query(
      'SELECT u.email, u.name FROM users u WHERE u.id = $1',
      [candidateId]
    ).then(async (r) => {
      if (r.rows.length > 0) {
        const jdResult = await pool.query('SELECT title FROM job_descriptions WHERE id = $1', [jdId])
        const jdTitle = jdResult.rows[0]?.title || 'Mock Interview'
        sendInterviewScheduledEmail(
          r.rows[0].email, r.rows[0].name, jdTitle,
          start.toISOString(), duration
        )
      }
    }).catch(() => {})

    res.status(201).json(interview)
  } catch (err) {
    console.error('Schedule interview error:', err)
    res.status(500).json({ message: 'Failed to schedule interview' })
  }
})

// GET /api/interviews — list interviews
// Admin sees all they scheduled, candidate sees their own
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user!.role === 'admin'
    const pagination = parsePagination(req)

    if (isAdmin) {
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM interviews WHERE scheduled_by = $1',
        [req.user!.userId]
      )
      const total = parseInt(countResult.rows[0].count, 10)

      const result = await pool.query(
        `SELECT i.id, i.status, i.duration_minutes, i.scheduled_start, i.scheduled_end,
                i.overall_rating, i.created_at,
                u.name as candidate_name, u.email as candidate_email,
                jd.title as jd_title
         FROM interviews i
         JOIN users u ON u.id = i.candidate_id
         JOIN job_descriptions jd ON jd.id = i.jd_id
         WHERE i.scheduled_by = $1
         ORDER BY i.scheduled_start DESC
         LIMIT $2 OFFSET $3`,
        [req.user!.userId, pagination.limit, pagination.offset]
      )
      res.json(paginatedResponse(result.rows, total, pagination))
    } else {
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM interviews WHERE candidate_id = $1',
        [req.user!.userId]
      )
      const total = parseInt(countResult.rows[0].count, 10)

      const result = await pool.query(
        `SELECT i.id, i.status, i.duration_minutes, i.scheduled_start, i.scheduled_end,
                i.created_at, jd.title as jd_title
         FROM interviews i
         JOIN job_descriptions jd ON jd.id = i.jd_id
         WHERE i.candidate_id = $1
         ORDER BY i.scheduled_start DESC
         LIMIT $2 OFFSET $3`,
        [req.user!.userId, pagination.limit, pagination.offset]
      )
      res.json(paginatedResponse(result.rows, total, pagination))
    }
  } catch (err) {
    console.error('List interviews error:', err)
    res.status(500).json({ message: 'Failed to list interviews' })
  }
})

// GET /api/interviews/:id — get interview detail
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user!.role === 'admin'
    const query = `
      SELECT i.*, u.name as candidate_name, u.email as candidate_email,
             jd.title as jd_title, jd.extracted_text as jd_text,
             cv.extracted_text as cv_text
      FROM interviews i
      JOIN users u ON u.id = i.candidate_id
      JOIN job_descriptions jd ON jd.id = i.jd_id
      JOIN candidate_cvs cv ON cv.id = i.cv_id
      WHERE i.id = $1 AND ${isAdmin ? 'i.scheduled_by = $2' : 'i.candidate_id = $2'}
    `
    const result = await pool.query(query, [req.params.id, req.user!.userId])
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Interview not found' })
      return
    }

    const interview = result.rows[0]

    // Candidates should not see evaluation details
    if (!isAdmin) {
      delete interview.score
      delete interview.transcript
      delete interview.overall_rating
      delete interview.report_file_key
      delete interview.jd_text
      delete interview.cv_text
    }

    res.json(interview)
  } catch (err) {
    console.error('Get interview error:', err)
    res.status(500).json({ message: 'Failed to get interview' })
  }
})

// GET /api/interviews/compare/:jdId — compare candidates for a JD (admin only)
router.get('/compare/:jdId', authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT i.id, i.overall_rating, i.score, i.scheduled_start,
              u.name AS candidate_name, u.email AS candidate_email
       FROM interviews i
       JOIN users u ON u.id = i.candidate_id
       WHERE i.jd_id = $1 AND i.scheduled_by = $2 AND i.status = 'completed' AND i.score IS NOT NULL
       ORDER BY i.overall_rating DESC`,
      [req.params.jdId, req.user!.userId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Compare error:', err)
    res.status(500).json({ message: 'Failed to fetch comparison data' })
  }
})

// PATCH /api/interviews/:id/cancel — cancel an interview (admin only)
router.patch('/:id/cancel', authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `UPDATE interviews SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND scheduled_by = $2 AND status = 'scheduled'
       RETURNING id, status`,
      [req.params.id, req.user!.userId]
    )
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Interview not found or cannot be cancelled' })
      return
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('Cancel interview error:', err)
    res.status(500).json({ message: 'Failed to cancel interview' })
  }
})

// GET /api/interviews/:id/report — download PDF report (admin only)
router.get('/:id/report', authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT i.*, u.name as candidate_name, u.email as candidate_email,
              jd.title as jd_title
       FROM interviews i
       JOIN users u ON u.id = i.candidate_id
       JOIN job_descriptions jd ON jd.id = i.jd_id
       WHERE i.id = $1 AND i.scheduled_by = $2`,
      [req.params.id, req.user!.userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Interview not found' })
      return
    }

    const interview = result.rows[0]
    if (!interview.score) {
      res.status(400).json({ message: 'Evaluation not yet available' })
      return
    }

    const evaluation: EvaluationResult = typeof interview.score === 'string'
      ? JSON.parse(interview.score)
      : interview.score

    const doc = generateReport({
      candidateName: interview.candidate_name,
      candidateEmail: interview.candidate_email,
      jdTitle: interview.jd_title,
      interviewDate: new Date(interview.scheduled_start).toLocaleString('en-IN'),
      durationMinutes: interview.duration_minutes,
      evaluation,
    })

    const filename = `interview-report-${interview.candidate_name.replace(/\s+/g, '-').toLowerCase()}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    doc.pipe(res)
  } catch (err) {
    console.error('Report generation error:', err)
    res.status(500).json({ message: 'Failed to generate report' })
  }
})

export default router
