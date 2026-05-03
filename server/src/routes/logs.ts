import { Router, Request, Response } from 'express'
import { pool } from '../db/pool.js'

const router = Router()

// GET /api/logs
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { service, level, search, since, until, limit = '200' } = req.query as Record<string, string>

  const conditions: string[] = []
  const params: unknown[]    = []

  if (service) { params.push(service);                       conditions.push(`service = $${params.length}`) }
  if (level)   { params.push(level.toUpperCase());           conditions.push(`level = $${params.length}`) }
  if (since)   { params.push(since);                         conditions.push(`ts >= $${params.length}`) }
  if (until)   { params.push(until);                         conditions.push(`ts <= $${params.length}`) }
  if (search)  { params.push(`%${search}%`);                 conditions.push(`(message ILIKE $${params.length} OR service ILIKE $${params.length})`) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  params.push(Math.min(Number(limit), 1000))

  const result = await pool.query(
    `SELECT id, ts, level, service, message, metadata
     FROM logs
     ${where}
     ORDER BY ts DESC
     LIMIT $${params.length}`,
    params
  )

  res.json(result.rows)
})

// GET /api/services  — distinct service names
router.get('/services', async (_req: Request, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT DISTINCT service FROM logs ORDER BY service`
  )
  res.json(result.rows.map((r: { service: string }) => r.service))
})

// GET /api/stats
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE level = 'ERROR' AND ts > NOW() - INTERVAL '1 hour') AS errors_1h,
      COUNT(*) FILTER (WHERE level = 'WARN'  AND ts > NOW() - INTERVAL '1 hour') AS warns_1h,
      COUNT(DISTINCT service)                                                      AS service_count,
      COUNT(*) FILTER (WHERE ts > NOW() - INTERVAL '24 hours')                    AS total_today
    FROM logs
  `)
  res.json(result.rows[0])
})

export default router
