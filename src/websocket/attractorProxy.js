import { WebSocket } from 'ws';

const PYTHON_ATTRACTOR_WS_URL = process.env.PYTHON_ATTRACTOR_WS_URL || 'ws://localhost:8000/api/ws/attractor';

export const setupAttractorProxy = (wss) => {
    wss.on('connection', (clientWs, req) => {
        console.log('[Attractor WS] Client connected to Attractor proxy.');

        const pythonWs = new WebSocket(PYTHON_ATTRACTOR_WS_URL);

        pythonWs.on('open', () => {
            console.log('[Attractor WS] Connected upstream to Python Attractor engine.');
        });

        pythonWs.on('message', (data) => {
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(data.toString('utf8'));
            }
        });

        clientWs.on('message', (message) => {
            console.log('[Attractor WS] Client message:', message.toString());

            if (pythonWs.readyState === WebSocket.OPEN) {
                console.log('[Attractor WS] Forwarding message upstream.');
                pythonWs.send(message);
            } else {
                console.log('[Attractor WS] Python connection is not open.');
            }
        });

        pythonWs.on('error', (err) => {
            console.error('[Attractor WS] Upstream Python WS Error:', err.message);
        });

        clientWs.on('close', () => {
            console.log('[Attractor WS] Client disconnected. Closing upstream connection.');
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