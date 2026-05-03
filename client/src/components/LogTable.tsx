import { useRef, useEffect } from 'react'
import { LogRow } from './LogRow'
import type { LogEntry } from '../types'

interface LogTableProps {
  logs: LogEntry[]
  loading: boolean
  error: string | null
  searchQuery?: string
  liveTail: boolean
}

export function LogTable({ logs, loading, error, searchQuery, liveTail }: LogTableProps) {
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (liveTail && logs.length > 0) {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [liveTail, logs[0]?.id])

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 text-[#ff4d6a] font-mono text-sm">
        <span className="opacity-50 mr-2">⚠</span> {error}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 font-mono text-sm gap-3">
        <span className="animate-spin">◌</span> loading logs...
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-600 font-mono text-sm gap-2">
        <span className="text-2xl opacity-30">∅</span>
        <span>no logs match the current filters</span>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-bg-border overflow-hidden bg-bg-surface">
      <div className="grid grid-cols-[180px_72px_140px_1fr] gap-3 px-4 py-2 bg-bg-elevated border-b border-bg-border">
        {(['timestamp', 'level', 'service', 'message'] as const).map((h) => (
          <span key={h} className="text-[10px] uppercase tracking-widest text-gray-600">{h}</span>
        ))}
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
        <div ref={topRef} />
        {logs.map((log) => (
          <LogRow
            key={`${log.id ?? ''}-${log.ts}-${log.message}`}
            log={log}
            searchQuery={searchQuery}
          />
        ))}
      </div>
    </div>
  )
}
