import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'express-gateway' });
});

// Added route to proxy/fetch satellite snapshot from Python FastAPI backend
router.get('/satellites', async (req, res, next) => {
    try {
        const pythonUrl = process.env.PYTHON_REST_URL || 'http://localhost:8000/api/satellites';
        const response = await fetch(pythonUrl);

        if (!response.ok) {
            return res.status(response.status).json({ 
                success: false, 
                error: `Python service returned status ${response.status}` 
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.get('/maritime/mesh', async (req, res, next) => {
    try {
        const pythonUrl = process.env.PYTHON_MARITIME_REST_URL || 'http://localhost:8000/api/maritime/mesh';
        const response = await fetch(pythonUrl);

        if (!response.ok) {
            return res.status(response.status).json({ 
                success: false, 
                error: `Python service returned status ${response.status}` 
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        next(err);
    }
});

export default router;