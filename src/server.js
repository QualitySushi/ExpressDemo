import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { setupWebSocketProxy } from './websocket/boidsProxy.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

// Create standard HTTP server wrapping our Express app
const server = http.createServer(app);

// Attach the WebSocket proxy to the HTTP server instance
setupWebSocketProxy(server);

server.listen(PORT, () => {
    console.log(`[Gateway] Express server running on http://localhost:${PORT}`);
    console.log(`[Gateway] WebSocket proxy active on ws://localhost:${PORT}`);
});