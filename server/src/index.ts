import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import http from 'http'
import { initDb, pool } from './db/pool.js'
import { initWebSocket } from './ws.js'
import ingestRouter from './routes/ingest.js'
import logsRouter   from './routes/logs.js'

const app    = express()
const server = http.createServer(app)
const PORT   = Number(process.env.PORT ?? 3000)

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/ingest', ingestRouter)
app.use('/api/logs',   logsRouter)

// Standalone routes expected by the frontend
app.get('/api/services', async (_req, res) => {
  const result = await pool.query('SELECT DISTINCT service FROM logs ORDER BY service')
  res.json(result.rows.map((r: { service: string }) => r.service))
})

app.get('/api/stats', async (_req, res) => {
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

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

// Boot
async function start(): Promise<void> {
  await initDb()
  initWebSocket(server)

  server.listen(PORT, () => {
    console.log(`✓ Server listening on http://localhost:${PORT}`)
    console.log(`  POST http://localhost:${PORT}/api/ingest        — send a log`)
    console.log(`  POST http://localhost:${PORT}/api/ingest/batch  — send many logs`)
    console.log(`  GET  http://localhost:${PORT}/api/logs          — query logs`)
    console.log(`  GET  http://localhost:${PORT}/api/services      — list services`)
    console.log(`  GET  http://localhost:${PORT}/api/stats         — stats`)
    console.log(`  WS   ws://localhost:${PORT}/ws                  — live tail`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
