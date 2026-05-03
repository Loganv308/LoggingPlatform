import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

export const pool = new Pool({
  host:     process.env.PGHOST     ?? 'localhost',
  port:     Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? 'logstream',
  user:     process.env.PGUSER     ?? 'postgres',
  password: process.env.PGPASSWORD ?? '',
})

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id        BIGSERIAL    PRIMARY KEY,
      ts        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      level     TEXT         NOT NULL,
      service   TEXT         NOT NULL,
      message   TEXT         NOT NULL,
      metadata  JSONB
    );

    CREATE INDEX IF NOT EXISTS idx_logs_ts      ON logs (ts DESC);
    CREATE INDEX IF NOT EXISTS idx_logs_service ON logs (service);
    CREATE INDEX IF NOT EXISTS idx_logs_level   ON logs (level);
  `)

  console.log('✓ Database ready')
}
