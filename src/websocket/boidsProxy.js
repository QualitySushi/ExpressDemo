import { WebSocket } from 'ws';

// Add '/api' to match FastAPI's route prefix
const PYTHON_WS_URL = process.env.PYTHON_WS_URL || 'ws://polyglot-fastapi:8000/api/ws/simulation';

export const setupBoidsProxy = (wss) => {
    wss.on('connection', (clientWs, req) => {
        console.log('[Boids WS] Client connected to Boids proxy.');

        const pythonWs = new WebSocket(PYTHON_WS_URL);

        pythonWs.on('open', () => {
            console.log('[Boids WS] Connected upstream to Python Boids engine.');
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
            console.error('[Boids WS] Upstream Python WS Error:', err.message);
        });

        clientWs.on('close', () => {
            console.log('[Boids WS] Client disconnected. Closing upstream connection.');
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