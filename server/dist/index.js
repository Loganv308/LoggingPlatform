import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db/pool.js';
import { initWebSocket } from './ws.js';
import ingestRouter from './routes/ingest.js';
import logsRouter from './routes/logs.js';
const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT ?? 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Middleware
app.use(cors());
app.use(express.json());
// Routes
app.use('/api/ingest', ingestRouter);
app.use('/api/logs', logsRouter);
// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
app.use(express.static(path.join(__dirname, '../../client/dist')));
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});
// Boot
async function start() {
    await initDb();
    initWebSocket(server);
    server.listen(PORT, () => {
        console.log(`✓ Server listening on http://localhost:${PORT}`);
        console.log(`  POST http://localhost:${PORT}/api/ingest        — send a log`);
        console.log(`  POST http://localhost:${PORT}/api/ingest/batch  — send many logs`);
        console.log(`  GET  http://localhost:${PORT}/api/logs          — query logs`);
        console.log(`  WS   ws://localhost:${PORT}/ws                  — live tail`);
    });
}
start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
