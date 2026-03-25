import { pool } from '../db/pool'
import type { Request } from 'express'

export type AuditAction =
  | 'user.login'
  | 'user.register'
  | 'user.password_change'
  | 'user.created'
  | 'interview.scheduled'
  | 'interview.cancelled'
  | 'interview.started'
  | 'interview.completed'
  | 'jd.created'
  | 'jd.deleted'
  | 'cv.uploaded'
  | 'cv.deleted'
  | 'profile.created'
  | 'profile.deleted'

export async function logAudit(
  req: Request,
  action: AuditAction,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const userId = req.user?.userId || null
    const orgId = req.user?.orgId || null
    const ip = req.ip || req.socket.remoteAddress || null

    await pool.query(
      `INSERT INTO audit_log (user_id, org_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, orgId, action, resourceType || null, resourceId || null, details ? JSON.stringify(details) : null, ip]
    )
  } catch (err) {
    // Audit logging should never break the request
    console.error('Audit log error:', (err as Error).message)
  }
}
