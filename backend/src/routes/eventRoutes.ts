import { Router } from 'express';
import { createEvent, getEvents, getEvent, updateEvent, deleteEvent, assignUsers, getAssignments } from '../controllers/eventController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '../models/index.js';

const router = Router();

router.use(authenticate);

router.get('/', getEvents);
router.get('/:id', getEvent);
router.get('/:id/assignments', getAssignments);

// Admin only
router.post('/', authorize(Role.ADMIN), createEvent);
router.patch('/:id', authorize(Role.ADMIN), updateEvent);
router.delete('/:id', authorize(Role.ADMIN), deleteEvent);
router.post('/:id/assign', authorize(Role.ADMIN), assignUsers);

export default router;
