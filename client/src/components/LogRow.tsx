import { useState } from 'react'
import { format } from 'date-fns'
import { LevelBadge } from './LevelBadge'
import type { LogEntry, LogLevel } from '../types'

function highlight(text: string, query: string | undefined): React.ReactNode {
  if (!query || !text) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-[#ffb54730] text-[#ffb547] rounded-sm">{part}</mark>
      : part
  )
}

const ROW_BG: Record<LogLevel, string> = {
  ERROR: 'hover:bg-[#ff4d6a08] border-l-[#ff4d6a30]',
  FATAL: 'hover:bg-[#ff005510] border-l-[#ff005540]',
  WARN:  'hover:bg-[#ffb54708] border-l-[#ffb54730]',
  INFO:  'hover:bg-bg-hover border-l-transparent',
  DEBUG: 'hover:bg-bg-hover border-l-transparent',
}

interface LogRowProps {
  log: LogEntry
  searchQuery?: string
}

export function LogRow({ log, searchQuery }: LogRowProps) {
  const [expanded, setExpanded] = useState(false)
  const rowStyle = ROW_BG[log.level?.toUpperCase() as LogLevel] ?? ROW_BG.INFO

  const ts = (() => {
    try { return format(new Date(log.ts), 'MMM dd HH:mm:ss.SSS') }
    catch { return log.ts }
  })()

  const detailRows: [string, string | number | undefined][] = [
    ['timestamp', log.ts],
    ['service',   log.service],
    ['level',     log.level],
    ['id',        log.id as string],
  ]

  return (
    <>
      <div
        onClick={() => setExpanded((v) => !v)}
        className={`grid grid-cols-[180px_72px_140px_1fr] gap-3 px-4 py-2 border-b border-bg-border border-l-2 cursor-pointer transition-colors ${rowStyle} log-row-enter`}
      >
        <span className="font-mono text-[11px] text-gray-500 tabular-nums truncate self-center">{ts}</span>
        <span className="self-center"><LevelBadge level={log.level} /></span>
        <span className="font-mono text-[11px] text-[#b47dff] truncate self-center">{log.service}</span>
        <span className="font-mono text-[12px] text-gray-300 truncate self-center">
          {highlight(log.message, searchQuery)}
        </span>
      </div>

      {expanded && (
        <div className="border-b border-bg-border bg-bg-surface px-4 py-3 animate-fade-in">
          <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-1.5 text-xs font-mono mb-3">
            {detailRows.map(([k, v]) => v != null && (
              <>
                <span key={`${k}-k`} className="text-gray-600">{k}</span>
                <span key={`${k}-v`} className="text-gray-300">{v}</span>
              </>
            ))}
          </div>

          <div className="bg-bg-base rounded-md p-3 font-mono text-[12px] text-gray-300 whitespace-pre-wrap break-all leading-relaxed border border-bg-border">
            {log.message}
          </div>

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="mt-2 bg-bg-base rounded-md p-3 font-mono text-[11px] text-[#00e5a0] border border-bg-border overflow-x-auto">
              {JSON.stringify(log.metadata, null, 2)}
            </div>
          )}
        </div>
      )}
    </>
  )
}
