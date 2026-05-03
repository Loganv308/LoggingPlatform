import { WebSocketServer, WebSocket } from 'ws';
let wss = null;
export function initWebSocket(server) {
    wss = new WebSocketServer({ server, path: '/ws' });
    wss.on('connection', (ws, req) => {
        console.log(`WS client connected from ${req.socket.remoteAddress}`);
        ws.on('close', () => console.log('WS client disconnected'));
        ws.on('error', (err) => console.error('WS error:', err));
    });
    console.log('✓ WebSocket server ready on /ws');
}
export function broadcast(data) {
    if (!wss)
        return;
    const payload = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}
