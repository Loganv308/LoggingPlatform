import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchLogs, fetchServices, fetchStats } from '../lib/api'
import { useLiveTail } from './useLiveTail'
import type { LogEntry, LogStats, ApiFilters } from '../types'

const MAX_LIVE_LOGS = 500

interface UseLogsReturn {
  logs: LogEntry[]
  services: string[]
  stats: LogStats | null
  loading: boolean
  error: string | null
  liveTail: boolean
  setLiveTail: (value: boolean) => void
  reload: () => void
}

export function useLogs(filters: ApiFilters): UseLogsReturn {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [services, setServices] = useState<string[]>([])
  const [stats, setStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liveTail, setLiveTail] = useState(false)

  // Holds the historical logs loaded on mount / filter change
  const historicalLogsRef = useRef<LogEntry[]>([])
  // Holds only the new logs that arrived via WebSocket
  const liveLogsRef = useRef<LogEntry[]>([])

  // Fetch services list periodically so new services appear without a refresh
  useEffect(() => {
    const load = (): void => {
      fetchServices().then(setServices).catch(() => {})
    }
    load()
    const id = setInterval(load, 15_000)
    return () => clearInterval(id)
  }, [])

  // Fetch stats periodically
  useEffect(() => {
    const load = (): void => { void fetchStats().then(setStats).catch(() => {}) }
    load()
    const id = setInterval(load, 10_000)
    return () => clearInterval(id)
  }, [])

  // Fetch historical logs when filters change or live tail turns off
  const loadLogs = useCallback((): void => {
    setLoading(true)
    setError(null)
    fetchLogs(filters)
      .then((data) => {
        historicalLogsRef.current = data
        liveLogsRef.current = []
        setLogs(data)
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Unknown error')
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)])

  useEffect(() => {
    if (!liveTail) loadLogs()
  }, [loadLogs, liveTail])

  // Live tail: prepend new logs on top of existing historical logs
  useLiveTail({
    enabled: liveTail,
    onLog: useCallback((log: LogEntry) => {
      // Apply client-side filters
      if (filters.service && log.service !== filters.service) return
      if (filters.level && log.level !== filters.level) return
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !log.message?.toLowerCase().includes(q) &&
          !log.service?.toLowerCase().includes(q)
        ) return
      }

      // Prepend to live buffer, cap it, then combine with historical
      liveLogsRef.current = [log, ...liveLogsRef.current].slice(0, MAX_LIVE_LOGS)
      setLogs([...liveLogsRef.current, ...historicalLogsRef.current])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.service, filters.level, filters.search]),
  })

  return { logs, services, stats, loading, error, liveTail, setLiveTail, reload: loadLogs }
}
