import express from 'express';
import { login, register, me } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register); // restrict further with authorize() in production
router.get('/me', authenticate, me);

export default router;
