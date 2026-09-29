import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());
app.use(cors());

// Mount API routes under a versioned prefix
app.use('/api/v1', apiRoutes);

// Catch-all for undefined routes
app.use((req, res, next) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;