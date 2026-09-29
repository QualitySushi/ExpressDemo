import http from 'http';
import { URL } from 'url';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import app from './app.js';
import { setupBoidsProxy } from './websocket/boidsProxy.js';
import { setupSatelliteProxy } from './websocket/satelliteProxy.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

// Create standard HTTP server wrapping our Express app
const server = http.createServer(app);

// Initialize independent WebSocket servers without immediate port binding
const boidsWss = new WebSocketServer({ noServer: true });
const satWss = new WebSocketServer({ noServer: true });

// Attach proxy handlers
setupBoidsProxy(boidsWss);
setupSatelliteProxy(satWss);

// Route incoming WebSocket upgrade requests based on URL path
server.on('upgrade', (request, socket, head) => {
    const parsedUrl = new URL(request.url, `http://${request.headers.host}`);
    const pathname = parsedUrl.pathname;

    if (pathname === '/ws/simulation') {
        boidsWss.handleUpgrade(request, socket, head, (clientWs) => {
            boidsWss.emit('connection', clientWs, request);
        });
    } else if (pathname === '/ws/satellites') {
        satWss.handleUpgrade(request, socket, head, (clientWs) => {
            satWss.emit('connection', clientWs, request);
        });
    } else {
        socket.destroy(); // Terminate invalid WebSocket paths
    }
});

server.listen(PORT, () => {
    console.log(`[Gateway] Express server running on http://localhost:${PORT}`);
    console.log(`[Gateway] Boids proxy active on ws://localhost:${PORT}/ws/simulation`);
    console.log(`[Gateway] Satellite proxy active on ws://localhost:${PORT}/ws/satellites`);
});