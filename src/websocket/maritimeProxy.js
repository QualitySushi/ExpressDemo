import { WebSocket } from 'ws';

const PYTHON_MARITIME_URL = process.env.PYTHON_MARITIME_URL || 'ws://localhost:8000/api/ws/maritime';

export const setupMaritimeProxy = (wss) => {
    wss.on('connection', (clientWs, req) => {
        console.log('[Maritime WS] Client connected to Maritime proxy.');

        const pythonWs = new WebSocket(PYTHON_MARITIME_URL);

        pythonWs.on('open', () => {
            console.log('[Maritime WS] Connected upstream to Python Maritime engine.');
        });

        pythonWs.on('message', (data) => {
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(data.toString('utf8'));
            }
        });

        pythonWs.on('error', (err) => {
            console.error('[Maritime WS] Upstream Error:', err.message);
        });

        clientWs.on('close', () => {
            console.log('[Maritime WS] Client disconnected. Closing upstream connection.');
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