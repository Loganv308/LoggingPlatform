import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { Server } from 'http'

let wss: WebSocketServer | null = null

export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    console.log(`WS client connected from ${req.socket.remoteAddress}`)
    ws.on('close', () => console.log('WS client disconnected'))
    ws.on('error', (err) => console.error('WS error:', err))
  })

  console.log('✓ WebSocket server ready on /ws')
}

export function broadcast(data: unknown): void {
  if (!wss) return
  const payload = JSON.stringify(data)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
}
