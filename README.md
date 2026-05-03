# LogStream

A self-hosted log aggregation and viewing platform for home networks and internal services. Send logs from any service via HTTP and view them in a real-time web UI.

![LogStream UI](https://github.com/Loganv308/LoggingPlatform/blob/main/Resources/LogPlatform.png?raw=true)

## Features

- **Real-time log tail** via WebSocket — new logs appear instantly without refreshing
- **Filter by service, level, and time range** — narrow down logs across all your services
- **Full-text search** across log messages
- **Expandable log rows** — click any entry to see the full message and JSON metadata
- **Stats dashboard** — errors, warnings, service count, and total logs at a glance
- **Batch ingest endpoint** — send multiple log entries in one request
- **PostgreSQL backend** — reliable storage with indexed queries for fast filtering

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Real-time | WebSockets (`ws`) |
| Dev tooling | `tsx`, `concurrently` |

## Project Structure

```
LoggingPlatform/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   │   ├── FilterBar.tsx
│   │   │   ├── LevelBadge.tsx
│   │   │   ├── LogRow.tsx
│   │   │   ├── LogTable.tsx
│   │   │   └── StatCards.tsx
│   │   ├── hooks/
│   │   │   ├── useLiveTail.ts
│   │   │   └── useLogs.ts
│   │   ├── lib/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── types.ts
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                  # Express backend
│   ├── src/
│   │   ├── db/
│   │   │   └── pool.ts      # PostgreSQL connection + schema init
│   │   ├── routes/
│   │   │   ├── ingest.ts    # POST /api/ingest
│   │   │   └── logs.ts      # GET /api/logs, /services, /stats
│   │   ├── index.ts         # Express app entry point
│   │   └── ws.ts            # WebSocket server
│   ├── .env.example
│   └── package.json
└── package.json             # Root — runs both with concurrently
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [PostgreSQL](https://www.postgresql.org/) v14 or later

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd LoggingPlatform
npm install
npm install --prefix client
npm install --prefix server
```

### 2. Configure the database

Copy the example environment file and fill in your PostgreSQL credentials:

```bash
cp server/.env.example server/.env
```

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=logstream
PGUSER=postgres
PGPASSWORD=yourpassword
PORT=3000
```

Create the database in PostgreSQL:

```sql
CREATE DATABASE logstream;
```

The server will create the `logs` table automatically on first run.

### 3. Start the development servers

```bash
npm run dev
```

This starts both the backend (port 3000) and frontend (port 5173) concurrently. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Production Deployment

### Build

```bash
npm run build
```

This compiles the frontend to `client/dist/` and the server TypeScript to `server/dist/`.

### Run

```bash
cd server
node dist/index.js
```

The server serves both the API and the built frontend on port 3000.

### Keep it running with PM2

```bash
npm install -g pm2
cd server
pm2 start dist/index.js --name logstream
pm2 save
pm2 startup
```

## API Reference

### Send a log entry

```http
POST /api/ingest
Content-Type: application/json

{
  "level": "ERROR",
  "service": "my-service",
  "message": "Something went wrong",
  "ts": "2026-05-02T12:00:00.000Z",
  "metadata": { "any": "extra data here" }
}
```

`ts` and `metadata` are optional. `level` is normalized to uppercase.

### Send multiple log entries

```http
POST /api/ingest/batch
Content-Type: application/json

[
  { "level": "INFO", "service": "my-service", "message": "Started" },
  { "level": "WARN", "service": "my-service", "message": "Slow response" }
]
```

### Query logs

```http
GET /api/logs?service=my-service&level=ERROR&search=timeout&since=2026-05-01T00:00:00Z&limit=200
```

All parameters are optional.

### Get services list

```http
GET /api/services
```

### Get stats

```http
GET /api/stats
```

### Live tail (WebSocket)

```
ws://localhost:3000/ws
```

Receives new log entries as JSON in real time as they are ingested.

## Sending Logs from Other Services

### PowerShell

```powershell
Invoke-RestMethod -Uri http://your-host:3000/api/ingest `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"level":"INFO","service":"my-service","message":"Hello"}'
```

### curl

```bash
curl -X POST http://your-host:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"level":"INFO","service":"my-service","message":"Hello"}'
```

### Python (loguru)

```python
import requests

def ship_log(record):
    requests.post("http://your-host:3000/api/ingest", json={
        "level": record["level"].name,
        "service": "my-python-app",
        "message": record["message"],
        "metadata": {"file": record["file"].name},
    }, timeout=2)

from loguru import logger
logger.add(ship_log)
```

### Node.js (winston)

```javascript
import Transport from 'winston-transport'

class LogstreamTransport extends Transport {
  log(info, callback) {
    fetch('http://your-host:3000/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: info.level.toUpperCase(),
        service: 'my-node-app',
        message: info.message,
      }),
    }).catch(() => {}) // don't let logging errors crash the app
    callback()
  }
}
```

## Home Network Setup

1. Find the host machine's local IP: `ipconfig` (Windows) or `ip addr` (Linux)
2. Set a static IP for the host in your router's DHCP settings
3. Other services send logs to `http://192.168.x.x:3000/api/ingest`
4. Access the UI at `http://192.168.x.x:3000`

Optionally, add a hosts file entry on each machine for a friendly name:

```
192.168.x.x    logstream
```

Then use `http://logstream:3000` everywhere.

## Log Levels

| Level | Color |
|---|---|
| `INFO` | Cyan |
| `WARN` | Amber |
| `ERROR` | Red |
| `DEBUG` | Gray |
| `FATAL` | Bright Red |
