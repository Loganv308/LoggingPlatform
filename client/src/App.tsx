import { useState, useMemo } from 'react'
import { useLogs } from './hooks/useLogs'
import { StatCards } from './components/StatCards'
import { FilterBar } from './components/FilterBar'
import { LogTable } from './components/LogTable'
import type { ApiFilters, LogFilters } from './types'

function rangeToSince(range: string): string {
  const map: Record<string, number> = {
    '15m': 15,
    '1h':  60,
    '6h':  360,
    '24h': 1440,
    '7d':  10080,
  }
  const mins = map[range] ?? 60
  return new Date(Date.now() - mins * 60 * 1000).toISOString()
}

export default function App() {
  const [filters, setFilters] = useState<LogFilters>({ range: '1h' })

  const apiFilters = useMemo<ApiFilters>(() => ({
    service: filters.service,
    level:   filters.level || undefined,
    search:  filters.search,
    since:   rangeToSince(filters.range),
  }), [filters])

  const { logs, services, stats, loading, error, liveTail, setLiveTail, reload } = useLogs(apiFilters)

  function handleFilterChange(patch: Partial<LogFilters>): void {
    setFilters((f) => ({ ...f, ...patch }))
    if (liveTail) setLiveTail(false)
  }

  return (
    <div className="min-h-screen bg-bg-base text-gray-300">
      <div className="max-w-[1400px] mx-auto px-6 py-6">

        <header className="flex items-baseline justify-between mb-6">
          <div className="flex items-baseline gap-3">
            <h1 className="font-sans text-white text-xl font-light tracking-tight">
              log<span className="text-[#00d4ff]">stream</span>
            </h1>
            <span className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">
              {logs.length} entries
            </span>
          </div>
          <span className="font-mono text-[11px] text-gray-600">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </header>

        <StatCards stats={stats} logCount={logs.length} />

        <FilterBar
          filters={filters}
          services={services}
          onChange={handleFilterChange}
          liveTail={liveTail}
          onLiveTailToggle={() => setLiveTail(!liveTail)}
          onReload={reload}
        />

        <LogTable
          logs={logs}
          loading={loading}
          error={error}
          searchQuery={filters.search}
          liveTail={liveTail}
        />
      </div>
    </div>
  )
}
