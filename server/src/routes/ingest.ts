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

  const result = await pool.query(
    `INSERT INTO logs (ts, level, service, message, metadata) VALUES ${values} RETURNING id, ts, level, service, message, metadata`,
    params
  )

  // Broadcast each inserted log to WebSocket clients
  result.rows.forEach((row) => {
    broadcast({
      id:       row.id,
      ts:       row.ts,
      level:    row.level,
      service:  row.service,
      message:  row.message,
      metadata: row.metadata,
    })
  })

  res.status(201).json({ inserted: entries.length })
})

export default router
