import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDb, pool } from './db/pool.js'
import { initWebSocket } from './ws.js'
import ingestRouter from './routes/ingest.js'
import logsRouter   from './routes/logs.js'

const app     = express()
const server  = http.createServer(app)
const PORT    = Number(process.env.PORT ?? 3000)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Middleware
app.use(cors())
app.use(express.json())

// Boot
async function start(): Promise<void> {
  await initDb()
  initWebSocket(server)

  // API routes first
  app.use('/api/ingest', ingestRouter)
  app.use('/api/logs',   logsRouter)

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

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

  // Static files LAST — after all API routes
  const frontendDist = process.env.FRONTEND_DIST ?? path.join(__dirname, '../../client/dist')
  app.use(express.static(frontendDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'))
  })

  server.listen(PORT, () => {
    console.log(`✓ Server listening on http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})