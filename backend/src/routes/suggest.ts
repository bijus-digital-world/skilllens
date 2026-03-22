import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.use(authenticate, authorize('admin'))

// POST /api/suggest/interview-config — suggest profile, duration, interviewer based on JD + CV
router.post('/interview-config', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jdId, cvId } = req.body

    if (!jdId) {
      res.status(400).json({ message: 'jdId is required' })
      return
    }

    // Fetch JD analysis
    const jdResult = await pool.query(
      'SELECT analysis FROM job_descriptions WHERE id = $1',
      [jdId]
    )

    let suggestedProfile = ''
    let suggestedDuration = 30
    let suggestedInterviewerName = 'Priya Sharma'

    if (jdResult.rows.length > 0 && jdResult.rows[0].analysis) {
      const analysis = typeof jdResult.rows[0].analysis === 'string'
        ? JSON.parse(jdResult.rows[0].analysis)
        : jdResult.rows[0].analysis

      suggestedDuration = analysis.suggestedDuration || 30

      // Find matching profile
      const profileResult = await pool.query(
        `SELECT id FROM evaluation_profiles
         WHERE experience_level = $1 AND (is_preset = TRUE OR created_by = $2)
         ORDER BY is_preset DESC
         LIMIT 1`,
        [analysis.suggestedProfile || 'mid', req.user!.userId]
      )
      if (profileResult.rows.length > 0) {
        suggestedProfile = profileResult.rows[0].id
      }
    }

    // If CV provided, refine suggestion by looking at candidate experience
    if (cvId) {
      const cvResult = await pool.query(
        'SELECT extracted_text FROM candidate_cvs WHERE id = $1',
        [cvId]
      )
      if (cvResult.rows.length > 0 && cvResult.rows[0].extracted_text) {
        const cvText = String(cvResult.rows[0].extracted_text).toLowerCase()
        // Simple heuristic: look for experience indicators
        const yearMatches = cvText.match(/(\d+)\+?\s*years?/g)
        if (yearMatches) {
          const maxYears = Math.max(...yearMatches.map((m) => parseInt(m)))
          let detectedLevel = 'mid'
          if (maxYears <= 2) detectedLevel = 'junior'
          else if (maxYears <= 5) detectedLevel = 'mid'
          else if (maxYears <= 8) detectedLevel = 'senior'
          else detectedLevel = 'lead'

          // Override with CV-detected level
          const profileResult = await pool.query(
            `SELECT id FROM evaluation_profiles
             WHERE experience_level = $1 AND (is_preset = TRUE OR created_by = $2)
             ORDER BY is_preset DESC
             LIMIT 1`,
            [detectedLevel, req.user!.userId]
          )
          if (profileResult.rows.length > 0) {
            suggestedProfile = profileResult.rows[0].id
          }
        }
      }
    }

    res.json({
      profileId: suggestedProfile,
      duration: suggestedDuration,
      interviewerName: suggestedInterviewerName,
    })
  } catch (err) {
    console.error('Suggest error:', err)
    res.status(500).json({ message: 'Failed to generate suggestions' })
  }
})

export default router
