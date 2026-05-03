import { useEffect, useRef, useCallback } from 'react'
import { createLiveTailSocket } from '../lib/api'
import type { LogEntry } from '../types'

interface UseLiveTailOptions {
  enabled: boolean
  onLog: (log: LogEntry) => void
}

export function useLiveTail({ enabled, onLog }: UseLiveTailOptions): void {
  const wsRef = useRef<WebSocket | null>(null)
  const onLogRef = useRef(onLog)
  onLogRef.current = onLog

  const connect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
    if (!enabled) return

    wsRef.current = createLiveTailSocket(
      (log) => onLogRef.current(log),
      (err) => {
        console.warn('WS error/close:', err)
        setTimeout(() => {
          if (enabled && wsRef.current?.readyState !== WebSocket.OPEN) {
            connect()
          }
        }, 3000)
      }
    )
  }, [enabled])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [connect])
}
