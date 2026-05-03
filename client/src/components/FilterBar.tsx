import { useState } from 'react'
import type { LogFilters, LogLevel, TimeRange } from '../types'

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: '15 min', value: '15m' },
  { label: '1 hr',   value: '1h'  },
  { label: '6 hr',   value: '6h'  },
  { label: '24 hr',  value: '24h' },
  { label: '7 days', value: '7d'  },
]

const LEVELS: LogLevel[] = ['INFO', 'WARN', 'ERROR', 'DEBUG', 'FATAL']

const inputCls = `
  bg-bg-elevated border border-bg-border rounded-md px-3 py-1.5
  text-sm text-gray-200 placeholder-gray-600
  focus:outline-none focus:border-[#00d4ff44] focus:ring-1 focus:ring-[#00d4ff22]
  transition-colors
`

interface FilterBarProps {
  filters: LogFilters
  services: string[]
  onChange: (patch: Partial<LogFilters>) => void
  liveTail: boolean
  onLiveTailToggle: () => void
  onReload: () => void
}

export function FilterBar({ filters, services, onChange, liveTail, onLiveTailToggle, onReload }: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? '')

  function commitSearch(): void {
    onChange({ search: searchInput || undefined })
  }

  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') commitSearch()
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm select-none">⌕</span>
        <input
          type="search"
          placeholder="search messages..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKey}
          onBlur={commitSearch}
          className={`${inputCls} w-full pl-8 font-mono text-xs`}
        />
      </div>

      {/* Service */}
      <select
        value={filters.service ?? ''}
        onChange={(e) => onChange({ service: e.target.value || undefined })}
        className={inputCls}
      >
        <option value="">all services</option>
        {services.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Level */}
      <select
        value={filters.level ?? ''}
        onChange={(e) => onChange({ level: (e.target.value as LogLevel) || '' })}
        className={inputCls}
      >
        <option value="">all levels</option>
        {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>

      {/* Time range */}
      <div className="flex rounded-md border border-bg-border overflow-hidden">
        {TIME_RANGES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => onChange({ range: value })}
            className={`px-2.5 py-1.5 text-xs transition-colors ${
              filters.range === value
                ? 'bg-[#00d4ff18] text-[#00d4ff]'
                : 'bg-bg-elevated text-gray-400 hover:text-gray-200 hover:bg-bg-hover'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Reload */}
      <button
        onClick={onReload}
        disabled={liveTail}
        className="px-3 py-1.5 text-xs rounded-md border border-bg-border bg-bg-elevated text-gray-400 hover:text-gray-200 hover:bg-bg-hover disabled:opacity-30 transition-colors"
        title="Reload logs"
      >
        ↺
      </button>

      {/* Live tail toggle */}
      <button
        onClick={onLiveTailToggle}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border transition-colors ${
          liveTail
            ? 'border-[#00e5a040] bg-[#00e5a010] text-[#00e5a0]'
            : 'border-bg-border bg-bg-elevated text-gray-400 hover:text-gray-200 hover:bg-bg-hover'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${liveTail ? 'bg-[#00e5a0] animate-blink' : 'bg-gray-600'}`} />
        {liveTail ? 'live' : 'paused'}
      </button>
    </div>
  )
}
