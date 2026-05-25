import { Router } from 'express';
import { getUsers, getUser, updateUser, deleteUser, updateProfile } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '../models/index.js';

const router = Router();

router.use(authenticate);

// Self-service route (any authenticated user)
router.patch('/me', updateProfile);

// Admin-only routes
router.use(authorize(Role.ADMIN));

router.get('/', getUsers);
router.get('/:id', getUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
