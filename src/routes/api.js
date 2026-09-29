import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'express-gateway' });
});

export default router;