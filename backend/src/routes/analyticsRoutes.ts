import { Router } from 'express';
import { getOverview, getEventAnalytics, getReportAnalytics } from '../controllers/analyticsController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '../models/index.js';

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

router.get('/overview', getOverview);
router.get('/events', getEventAnalytics);
router.get('/reports', getReportAnalytics);

export default router;
