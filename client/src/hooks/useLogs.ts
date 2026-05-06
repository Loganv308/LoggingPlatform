import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchLogs, fetchServices, fetchStats } from '../lib/api'
import { useLiveTail } from './useLiveTail'
import type { LogEntry, LogStats, ApiFilters } from '../types'

const MAX_LOGS = 500

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
  const [logs, setLogs]         = useState<LogEntry[]>([])
  const [services, setServices] = useState<string[]>([])
  const [stats, setStats]       = useState<LogStats | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [liveTail, setLiveTail] = useState(false)

  // Single source of truth for all logs
  const logsRef = useRef<LogEntry[]>([])
  // Track IDs we've already shown to prevent duplicates
  const seenIds = useRef<Set<string | number>>(new Set())

  // Fetch services periodically
  useEffect(() => {
    const load = (): void => { fetchServices().then(setServices).catch(() => {}) }
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

  // Load historical logs from DB
  const loadLogs = useCallback((): void => {
    setLoading(true)
    setError(null)
    fetchLogs(filters)
      .then((data) => {
        // Reset seen IDs and log list with fresh DB data
        seenIds.current = new Set(data.map(l => l.id ?? `${l.ts}-${l.message}`))
        logsRef.current = data
        setLogs([...data])
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Unknown error')
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)])

  // Load on mount and when filters change
  // When live tail turns OFF, reload fresh from DB
  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  useEffect(() => {
    if (!liveTail) loadLogs()
  }, [liveTail, loadLogs])

  // Live tail: prepend new logs, skip duplicates, keep sorted
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

      // Skip if we've already shown this log
      const key = log.id ?? `${log.ts}-${log.message}`
      if (seenIds.current.has(key)) return
      seenIds.current.add(key)

      // Prepend and keep sorted newest first
      logsRef.current = [log, ...logsRef.current].slice(0, MAX_LOGS)
      setLogs([...logsRef.current])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.service, filters.level, filters.search]),
  })

  return { logs, services, stats, loading, error, liveTail, setLiveTail, reload: loadLogs }
}
