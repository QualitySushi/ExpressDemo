import { WebSocket } from 'ws';

const PYTHON_SAT_URL = process.env.PYTHON_SAT_URL || 'ws://polyglot-fastapi:8000/ws/satellites';

// In-memory cache to hold the latest satellite telemetry snapshot
let latestSatelliteSnapshot = [];

/**
 * Getter function to supply cached telemetry to Express REST routes
 */
export const getLatestSatellites = () => {
    return latestSatelliteSnapshot;
};

export const setupSatelliteProxy = (wss) => {
    wss.on('connection', (clientWs, req) => {
        console.log('[Satellite WS] Client connected to telemetry proxy.');

        const pythonWs = new WebSocket(PYTHON_SAT_URL);

        pythonWs.on('open', () => {
            console.log('[Satellite WS] Connected upstream to Python Satellite Tracker.');
        });

        pythonWs.on('message', (data) => {
            const rawMessage = data.toString('utf8');

            // Cache the incoming payload so the REST snapshot endpoint can read it
            try {
                const parsed = JSON.parse(rawMessage);
                latestSatelliteSnapshot = Array.isArray(parsed) ? parsed : [parsed];
            } catch (err) {
                console.error('[Satellite WS] Failed to parse telemetry frame into cache:', err.message);
            }

            // Forward message to the connected WebSocket client as before
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(rawMessage);
            }
        });

        clientWs.on('message', (message) => {
            if (pythonWs.readyState === WebSocket.OPEN) {
                pythonWs.send(message);
            }
        });

        pythonWs.on('error', (err) => {
            console.error('[Satellite WS] Upstream Python Satellite WS Error:', err.message);
        });

        clientWs.on('close', () => {
            console.log('[Satellite WS] Client disconnected. Closing upstream connection.');
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