import type { ApiFilters, LogEntry, LogStats } from '../types'

const BASE = '/api'

export async function fetchLogs(filters: ApiFilters): Promise<LogEntry[]> {
  const params = new URLSearchParams()
  if (filters.service) params.set('service', filters.service)
  if (filters.level)   params.set('level', filters.level)
  if (filters.search)  params.set('search', filters.search)
  if (filters.since)   params.set('since', filters.since)
  if (filters.until)   params.set('until', filters.until)
  params.set('limit', String(filters.limit ?? 200))

  const res = await fetch(`${BASE}/logs?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<LogEntry[]>
}

export async function fetchServices(): Promise<string[]> {
  const res = await fetch(`${BASE}/services`)
  if (!res.ok) return []
  return res.json() as Promise<string[]>
}

export async function fetchStats(): Promise<LogStats> {
  const res = await fetch(`${BASE}/stats`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<LogStats>
}

export function createLiveTailSocket(
  onMessage: (log: LogEntry) => void,
  onError: (reason: Event | string) => void,
): WebSocket {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(`${proto}://${location.host}/ws`)

  ws.onmessage = (e: MessageEvent<string>) => {
    try { onMessage(JSON.parse(e.data) as LogEntry) } catch { /* ignore */ }
  }
  ws.onerror = (e) => onError(e)
  ws.onclose = () => onError('closed')

  return ws
}
