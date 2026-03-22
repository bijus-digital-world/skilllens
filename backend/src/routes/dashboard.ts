import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.use(authenticate, authorize('admin'))

// GET /api/dashboard/stats
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId

    const [counts, candidates, avgScore, recent] = await Promise.all([
      // Interview counts by status
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled,
           COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
           COUNT(*) FILTER (WHERE status = 'completed') AS completed,
           COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
           COUNT(*) AS total
         FROM interviews WHERE scheduled_by = $1`,
        [userId]
      ),
      // Total candidates
      pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'candidate'"),
      // Average score
      pool.query(
        'SELECT ROUND(AVG(overall_rating)::numeric, 1) AS avg FROM interviews WHERE scheduled_by = $1 AND overall_rating IS NOT NULL',
        [userId]
      ),
      // Recent interviews
      pool.query(
        `SELECT i.id, i.status, i.scheduled_start, i.overall_rating, i.duration_minutes,
                u.name AS candidate_name, u.email AS candidate_email,
                jd.title AS jd_title
         FROM interviews i
         JOIN users u ON u.id = i.candidate_id
         JOIN job_descriptions jd ON jd.id = i.jd_id
         WHERE i.scheduled_by = $1
         ORDER BY i.created_at DESC
         LIMIT 10`,
        [userId]
      ),
    ])

    const c = counts.rows[0]

    // Generate insights from data
    const insights: string[] = []
    const completed = parseInt(c.completed)
    const total = parseInt(c.total)
    const avg = avgScore.rows[0].avg ? parseFloat(avgScore.rows[0].avg) : null

    if (completed > 0 && avg !== null) {
      if (avg >= 7) insights.push(`Strong candidate pool — average score is ${avg}/10`)
      else if (avg >= 5) insights.push(`Average score across interviews is ${avg}/10`)
      else insights.push(`Candidate scores are below expectations — avg ${avg}/10`)
    }

    if (completed > 0) {
      // Find top performer
      const top = await pool.query(
        `SELECT u.name, i.overall_rating FROM interviews i
         JOIN users u ON u.id = i.candidate_id
         WHERE i.scheduled_by = $1 AND i.overall_rating IS NOT NULL
         ORDER BY i.overall_rating DESC LIMIT 1`,
        [userId]
      )
      if (top.rows.length > 0) {
        insights.push(`Top performer: ${top.rows[0].name} scored ${top.rows[0].overall_rating}/10`)
      }
    }

    const scheduled = parseInt(c.scheduled)
    if (scheduled > 0) {
      insights.push(`${scheduled} interview${scheduled > 1 ? 's' : ''} coming up`)
    }

    if (total === 0) {
      insights.push('Get started by uploading a job description and scheduling your first interview')
    }

    res.json({
      interviews: {
        scheduled,
        inProgress: parseInt(c.in_progress),
        completed,
        cancelled: parseInt(c.cancelled),
        total,
      },
      candidates: parseInt(candidates.rows[0].count),
      averageScore: avg,
      recentInterviews: recent.rows,
      insights,
    })
  } catch (err) {
    console.error('Dashboard stats error:', err)
    res.status(500).json({ message: 'Failed to fetch dashboard stats' })
  }
})

export default router
