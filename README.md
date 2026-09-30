# Polyglot Tech Demo Express Gateway

> An Express-based gateway responsible for HTTP API routing and WebSocket transport between frontend clients and the Python FastAPI compute service.

---

## 🏗️ Architectural Role

The Express service acts as the **gateway and transport layer** of the Polyglot Tech Demo.

It sits between the frontend applications and the Python compute service:

```text
┌──────────────────────────────┐
│       Frontend Clients       │
│                              │
│ Next.js / Electron Renderer  │
└──────────────┬───────────────┘
               │
               │ HTTP / WebSocket
               ▼
┌──────────────────────────────┐
│       Express Gateway        │
│          :4000               │
│                              │
│  HTTP API       WebSocket    │
│  /api/v1/*      /ws/*        │
│                              │
│  Routing        Proxying     │
│  CORS           Lifecycle    │
│  Errors         Upgrades     │
└──────────────┬───────────────┘
               │
               │ HTTP / WebSocket
               ▼
┌──────────────────────────────┐
│    FastAPI Compute Service   │
│          :8000               │
│                              │
│  Mathematical computation   │
│  Simulation engines          │
│  Satellite telemetry        │
│  Maritime processing         │
│  Attractor generation       │
└──────────────────────────────┘
```

The Express service intentionally does **not** contain the heavy mathematical computation.

Its primary responsibilities are:

- HTTP API routing
- WebSocket connection management
- WebSocket proxying
- Frontend-to-backend transport abstraction
- CORS configuration
- Error handling
- Service health reporting
- Routing requests to the appropriate Python service

---

# 📂 Codebase Map

```text
root/
└── src/
    ├── server.js
    │
    ├── app.js
    │
    ├── middleware/
    │   └── errorHandler.js
    │
    ├── routes/
    │   └── api.js
    │
    └── websocket/
        ├── boidsProxy.js
        ├── satelliteProxy.js
        ├── maritimeProxy.js
        └── attractorProxy.js
```

---

# 🧩 Architectural Components

## `src/server.js`

The server entry point.

Responsibilities include:

- Creating the HTTP server around Express
- Initializing WebSocket servers
- Registering WebSocket proxy handlers
- Routing WebSocket upgrade requests
- Starting the gateway on the configured port

The gateway defaults to:

```text
http://localhost:4000
```

WebSocket connections are exposed through:

```text
ws://localhost:4000/ws/simulation
ws://localhost:4000/ws/satellites
ws://localhost:4000/ws/maritime
ws://localhost:4000/ws/attractor
```

Each WebSocket path is routed to an independent proxy handler.

---

# 🌐 HTTP API Layer

## `src/app.js`

Creates and configures the Express application.

Middleware currently includes:

```text
express.json()
cors()
```

The API router is mounted under:

```text
/api/v1
```

Therefore the gateway exposes versioned HTTP endpoints such as:

```text
GET /api/v1/health
GET /api/v1/satellites
GET /api/v1/maritime/mesh
```

Undefined routes are handled with a JSON `404` response.

Errors are passed to the centralized error middleware.

---

# 🛣️ HTTP Routes

## Health

```http
GET /api/v1/health
```

Returns the gateway's current service status.

Example response:

```json
{
  "status": "UP",
  "service": "express-gateway"
}
```

---

## Satellite Snapshot

```http
GET /api/v1/satellites
```

The gateway requests satellite data from the FastAPI service and returns the response to the client.

Default Python endpoint:

```text
http://localhost:8000/api/satellites
```

The target can be overridden with:

```text
PYTHON_REST_URL
```

The Express gateway therefore provides a stable frontend-facing API while keeping the Python service address configurable.

---

## Maritime Mesh

```http
GET /api/v1/maritime/mesh
```

The gateway proxies the maritime mesh request to FastAPI.

Default target:

```text
http://localhost:8000/api/maritime/mesh
```

The target can be overridden with:

```text
PYTHON_MARITIME_REST_URL
```

---

# 🔌 WebSocket Gateway

The WebSocket layer is implemented separately from the Express HTTP routing layer.

Each feature receives its own `WebSocketServer` instance:

```text
Boids
Satellite
Maritime
Attractor
```

The WebSocket servers use:

```javascript
new WebSocketServer({ noServer: true })
```

This allows the primary HTTP server to control WebSocket upgrade routing.

---

# 🐦 Boids WebSocket

Frontend endpoint:

```text
ws://localhost:4000/ws/simulation
```

Proxy implementation:

```text
src/websocket/boidsProxy.js
```

The gateway forwards the WebSocket connection to the FastAPI simulation service.

This keeps the frontend independent from the Python service's internal WebSocket address.

---

# 🛰️ Satellite WebSocket

Frontend endpoint:

```text
ws://localhost:4000/ws/satellites
```

Proxy implementation:

```text
src/websocket/satelliteProxy.js
```

This provides the transport layer for live satellite-related WebSocket communication.

Snapshot requests are handled separately through:

```text
GET /api/v1/satellites
```

---

# 🚢 Maritime WebSocket

Frontend endpoint:

```text
ws://localhost:4000/ws/maritime
```

Proxy implementation:

```text
src/websocket/maritimeProxy.js
```

The gateway provides a stable WebSocket endpoint for the frontend while the actual maritime processing remains inside the FastAPI service.

---

# 🌀 Attractor WebSocket

Frontend endpoint:

```text
ws://localhost:4000/ws/attractor
```

Proxy implementation:

```text
src/websocket/attractorProxy.js
```

The gateway forwards attractor configuration and generated point streams between the frontend and FastAPI.

Supported attractor types currently include:

```text
Clifford
De Jong
Aizawa
Lorenz
```

The mathematical generation itself belongs to the Python service.

---

# 🔀 WebSocket Routing

Incoming WebSocket upgrade requests are routed according to their URL path:

```text
/ws/simulation
        ↓
Boids Proxy

/ws/satellites
        ↓
Satellite Proxy

/ws/maritime
        ↓
Maritime Proxy

/ws/attractor
        ↓
Attractor Proxy
```

Unknown WebSocket paths are rejected by destroying the socket.

This prevents arbitrary WebSocket upgrade requests from being accepted by the gateway.

---

# ⚠️ Error Handling

Centralized HTTP error handling is implemented in:

```text
src/middleware/errorHandler.js
```

Errors are logged using:

```text
[Gateway Error]
```

The middleware returns a consistent JSON structure:

```json
{
  "success": false,
  "error": "Error message"
}
```

The HTTP status code is taken from:

```javascript
err.statusCode || 500
```

This keeps API error responses consistent across routes.

---

# ⚙️ Configuration

The gateway uses environment variables for runtime configuration.

## Port

```text
PORT=4000
```

If `PORT` is not defined, the gateway defaults to:

```text
4000
```

## Python REST Service

```text
PYTHON_REST_URL=http://localhost:8000/api/satellites
```

## Python Maritime REST Service

```text
PYTHON_MARITIME_REST_URL=http://localhost:8000/api/maritime/mesh
```

Environment configuration allows the gateway to run against different backend environments without modifying source code.

---

# 🚀 Running the Gateway

Install dependencies:

```bash
npm install
```

Start the gateway using the project's configured start command.

The server should report:

```text
[Gateway] Express server running on http://localhost:4000
```

WebSocket endpoints are then available under:

```text
ws://localhost:4000/ws/*
```

The FastAPI compute service must also be running for proxied functionality to operate.

---

# 🧱 Separation of Responsibilities

The project deliberately separates transport from computation.

| Layer | Responsibility |
|---|---|
| Next.js | Web application UI |
| Electron | Desktop application shell |
| Express | Gateway, routing, proxying, transport |
| FastAPI | API endpoints and compute orchestration |
| Python Services | Mathematical and scientific computation |
| NumPy / SciPy | Numerical and spatial computation |

For example, the attractor pipeline is:

```text
Frontend
   │
   │ WebSocket
   ▼
Express
/ws/attractor
   │
   │ WebSocket proxy
   ▼
FastAPI
   │
   ▼
Attractor Engine
   │
   ├── Clifford
   ├── De Jong
   ├── Aizawa
   └── Lorenz
```

The Express gateway does not need to understand the mathematical implementation.

It only needs to transport the messages between the client and compute service.

---

# 🎯 Design Goals

The gateway is designed around several principles.

### 1. Thin Gateway

Keep business and mathematical logic out of Express.

### 2. Stable Frontend Interface

Frontend applications communicate with predictable gateway endpoints rather than directly depending on the internal Python service topology.

### 3. Independent WebSocket Channels

Each real-time feature has its own WebSocket proxy.

### 4. Versioned HTTP APIs

HTTP routes are exposed through:

```text
/api/v1/*
```

This leaves room for future API versions without immediately breaking existing clients.

### 5. Configurable Backend

Python service URLs are controlled through environment variables rather than hard-coded throughout the application.

### 6. Centralized Error Handling

HTTP errors are normalized through a single middleware layer.

---

# 🔭 Service Boundary

The intended architectural boundary is:

```text
             TRANSPORT
                │
                ▼
        ┌───────────────┐
        │ Express       │
        │ Gateway       │
        └───────┬───────┘
                │
                ▼
          COMPUTE / DATA
                │
                ▼
        ┌───────────────┐
        │ FastAPI       │
        │ Compute       │
        │ Service       │
        └───────────────┘
```

Express answers:

> **"Where should this request or stream go?"**

FastAPI and its service layer answer:

> **"What computation or data operation should happen?"**

This separation allows the frontend, gateway, and compute service to evolve independently while maintaining a clear responsibility boundary.
