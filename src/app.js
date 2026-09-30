import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './config/db.js';
import apiRoutes from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';

const pgSession = connectPgSimple(session);
const app = express();

app.use(express.json());
app.use(cors());

// Configure Session Middleware with PostgreSQL Store
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session' // Managed automatically by connect-pg-simple
    }),
    secret: process.env.SESSION_SECRET || 'polyglot-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
}));

// Mount API routes under versioned prefix
app.use('/api/v1', apiRoutes);

// Catch-all for undefined routes
app.use((req, res, next) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;