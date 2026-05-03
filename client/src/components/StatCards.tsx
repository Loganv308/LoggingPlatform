import type { LogStats } from '../types'

interface StatCardsProps {
  stats: LogStats | null
  logCount: number
}

export function StatCards({ stats, logCount }: StatCardsProps) {
  const cards: { label: string; value: string | number; color: string }[] = [
    { label: 'shown',         value: logCount,                                                         color: 'text-white' },
    { label: 'errors (1h)',   value: stats?.errors_1h ?? '—',                                          color: 'text-[#ff4d6a]' },
    { label: 'warnings (1h)', value: stats?.warns_1h ?? '—',                                           color: 'text-[#ffb547]' },
    { label: 'services',      value: stats?.service_count ?? '—',                                      color: 'text-[#00d4ff]' },
    { label: 'total today',   value: stats?.total_today != null ? stats.total_today.toLocaleString() : '—', color: 'text-[#00e5a0]' },
  ]

  return (
    <div className="grid grid-cols-5 gap-2 mb-4">
      {cards.map(({ label, value, color }) => (
        <div key={label} className="bg-bg-surface border border-bg-border rounded-lg px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{label}</div>
          <div className={`font-mono text-xl font-light ${color}`}>{value}</div>
        </div>
      ))}
    </div>
  )
}
