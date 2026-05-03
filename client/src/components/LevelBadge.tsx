import type { LogLevel } from '../types'

const STYLES: Record<LogLevel, string> = {
  INFO:  'text-[#00d4ff] bg-[#00d4ff12] border-[#00d4ff30]',
  WARN:  'text-[#ffb547] bg-[#ffb54712] border-[#ffb54730]',
  ERROR: 'text-[#ff4d6a] bg-[#ff4d6a12] border-[#ff4d6a30]',
  DEBUG: 'text-[#7a8494] bg-[#7a849412] border-[#7a849430]',
  FATAL: 'text-[#ff0055] bg-[#ff005518] border-[#ff005540]',
}

interface LevelBadgeProps {
  level: string
}

export function LevelBadge({ level }: LevelBadgeProps) {
  const upper = level?.toUpperCase() as LogLevel
  const cls = STYLES[upper] ?? STYLES.DEBUG
  return (
    <span className={`inline-block font-mono text-[10px] font-medium tracking-widest px-1.5 py-0.5 border rounded ${cls}`}>
      {upper ?? 'UNK'}
    </span>
  )
}
