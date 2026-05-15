import { Router } from 'express';
import { login, register, refreshToken, logout, getProfile } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '../models/index.js';

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/register', authenticate, authorize(Role.ADMIN), register);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getProfile);

export default router;
