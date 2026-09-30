import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

const router = Router();

router.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'express-gateway' });
});

// --- Existing Python Proxy Routes ---

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

// --- Authentication Routes ---

router.post('/auth/register', async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
            [username, hashedPassword]
        );
        res.status(201).json({ success: true, message: 'User created successfully', user: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

router.post('/auth/login', async (req, res, next) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;

        // Force session save to PostgreSQL before responding
        req.session.save((err) => {
            if (err) {
                return next(err);
            }
            res.json({ success: true, message: 'Logged in successfully', username: user.username });
        });
    } catch (err) {
        next(err);
    }
});

router.post('/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ success: false, error: 'Could not log out' });
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

router.get('/auth/session', (req, res) => {
    if (req.session.userId) {
        res.json({ success: true, loggedIn: true, username: req.session.username });
    } else {
        res.json({ success: true, loggedIn: false });
    }
});

// --- Simulation History Routes ---

router.post('/history', async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized. Please log in.' });
    }

    const { simulation_type, configuration } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO simulation_history (user_id, simulation_type, configuration) VALUES ($1, $2, $3) RETURNING *',
            [req.session.userId, simulation_type, configuration]
        );
        res.status(201).json({ success: true, message: 'Simulation saved', history: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

router.get('/history', async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized. Please log in.' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM simulation_history WHERE user_id = $1 ORDER BY created_at DESC',
            [req.session.userId]
        );
        res.json({ success: true, history: result.rows });
    } catch (err) {
        next(err);
    }
});

export default router;