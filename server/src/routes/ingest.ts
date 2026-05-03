import { Router, Request, Response } from 'express'
import { pool } from '../db/pool.js'
import { broadcast } from '../ws.js'

const router = Router()

interface IngestBody {
  level:    string
  service:  string
  message:  string
  ts?:      string
  metadata?: Record<string, unknown>
}

// POST /api/ingest  — single log entry
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { level, service, message, ts, metadata } = req.body as IngestBody

  if (!level || !service || !message) {
    res.status(400).json({ error: 'level, service, and message are required' })
    return
  }

  const result = await pool.query<{ id: string; ts: string }>(
    `INSERT INTO logs (ts, level, service, message, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, ts`,
    [ts ?? new Date().toISOString(), level.toUpperCase(), service, message, metadata ?? null]
  )

  const row = result.rows[0]
  const logEntry = { id: row.id, ts: row.ts, level: level.toUpperCase(), service, message, metadata }

  // Push to all connected WebSocket clients
  broadcast(logEntry)

  res.status(201).json(logEntry)
})

// POST /api/ingest/batch  — array of log entries
router.post('/batch', async (req: Request, res: Response): Promise<void> => {
  const entries = req.body as IngestBody[]

  if (!Array.isArray(entries) || entries.length === 0) {
    res.status(400).json({ error: 'Body must be a non-empty array' })
    return
  }

  const values = entries.map((e, i) => {
    const base = i * 5
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`
  }).join(', ')

  const params = entries.flatMap(e => [
    e.ts ?? new Date().toISOString(),
    (e.level ?? 'INFO').toUpperCase(),
    e.service,
    e.message,
    e.metadata ?? null,
  ])

  await pool.query(
    `INSERT INTO logs (ts, level, service, message, metadata) VALUES ${values}`,
    params
  )

  res.status(201).json({ inserted: entries.length })
})

export default router
