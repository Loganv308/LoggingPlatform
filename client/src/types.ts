export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'FATAL'

export interface LogEntry {
  id: string | number
  ts: string
  level: LogLevel
  service: string
  message: string
  metadata?: Record<string, unknown>
}

export interface LogStats {
  errors_1h: number
  warns_1h: number
  service_count: number
  total_today: number
}

export type TimeRange = '15m' | '1h' | '6h' | '24h' | '7d'

export interface LogFilters {
  service?: string
  level?: LogLevel | ''
  search?: string
  range: TimeRange
}

export interface ApiFilters {
  service?: string
  level?: string
  search?: string
  since?: string
  until?: string
  limit?: number
}
