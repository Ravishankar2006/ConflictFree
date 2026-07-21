import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
  getOverview,
  getFacultyWorkload,
  getRoomUtilization,
  getDailyDistribution,
  getTimeDistribution,
} from '../controllers/analytics.controller.js';

const router = Router();

router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/overview', getOverview);
router.get('/faculty-workload', getFacultyWorkload);
router.get('/room-utilization', getRoomUtilization);
router.get('/daily-distribution', getDailyDistribution);
router.get('/time-distribution', getTimeDistribution);

export default router;
