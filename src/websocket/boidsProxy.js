import { WebSocketServer, WebSocket } from 'ws';

const PYTHON_WS_URL = process.env.PYTHON_WS_URL || 'ws://localhost:8000/ws/simulation';

export const setupWebSocketProxy = (server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (clientWs, req) => {
        console.log('[Gateway WS] Client connected to WebSocket proxy.');

        const pythonWs = new WebSocket(PYTHON_WS_URL);

        pythonWs.on('open', () => {
            console.log('[Gateway WS] Connected upstream to Python Boids engine.');
        });

        pythonWs.on('message', (data) => {
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(data.toString('utf8'));
            }
        });

        clientWs.on('message', (message) => {
            if (pythonWs.readyState === WebSocket.OPEN) {
                pythonWs.send(message);
            }
        });

        pythonWs.on('error', (err) => {
            console.error('[Gateway WS] Upstream Python WS Error:', err.message);
        });

        clientWs.on('close', () => {
            console.log('[Gateway WS] Client disconnected. Closing upstream connection.');
            if (pythonWs.readyState === WebSocket.OPEN) {
                pythonWs.close();
            }
        });

        pythonWs.on('close', () => {
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.close();
            }
        });
    });
};